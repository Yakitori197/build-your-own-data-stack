import { describe, expect, it } from 'vitest';
import { checkLinks } from '../lib/linkcheck/checker';
import {
  checkUrl,
  classifyError,
  isRetryable,
  type HttpCheckOptions,
  type LinkResult,
  type RequestFn,
  type SecureResponse,
} from '../lib/linkcheck/http';

const PUBLIC_LOOKUP = async (): Promise<string[]> => ['93.184.216.34'];

function resp(status: number, headers: Record<string, string> = {}): SecureResponse {
  return { status, headers };
}

/** A transport that never opens a socket; it returns scripted responses. */
function transport(script: (url: string, method: string) => SecureResponse | Error): RequestFn {
  return async (url, options) => {
    const result = script(url, options.method);
    if (result instanceof Error) {
      throw result;
    }
    return result;
  };
}

function httpOptions(overrides: Partial<HttpCheckOptions> = {}): HttpCheckOptions {
  return {
    timeoutMs: 1000,
    maxRedirects: 5,
    userAgent: 'test',
    lookup: PUBLIC_LOOKUP,
    requestFn: async () => resp(200),
    ...overrides,
  };
}

describe('checkUrl', () => {
  it('reports a healthy url', async () => {
    const result = await checkUrl('https://ok.example/', httpOptions());
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.method).toBe('HEAD');
  });

  it('reports a 404 as broken', async () => {
    const result = await checkUrl(
      'https://x.example/missing',
      httpOptions({ requestFn: transport(() => resp(404)) }),
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error).toBe('http-404');
  });

  it('follows redirects and counts them', async () => {
    const requestFn = transport((url) =>
      url.endsWith('/redirect') ? resp(302, { location: '/ok' }) : resp(200),
    );
    const result = await checkUrl('https://x.example/redirect', httpOptions({ requestFn }));
    expect(result.ok).toBe(true);
    expect(result.redirects).toBe(1);
    expect(result.finalUrl?.endsWith('/ok')).toBe(true);
  });

  it('stops on redirect loops', async () => {
    const requestFn = transport(() => resp(302, { location: '/loop' }));
    const result = await checkUrl(
      'https://x.example/loop',
      httpOptions({ requestFn, maxRedirects: 3 }),
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBe('too-many-redirects');
  });

  it('treats a redirect without a location header as broken', async () => {
    const requestFn = transport(() => resp(302));
    const result = await checkUrl('https://x.example/', httpOptions({ requestFn }));
    expect(result.error).toBe('redirect-without-location');
  });

  it('treats an unparseable redirect target as broken', async () => {
    const requestFn = transport(() => resp(302, { location: 'http://[' }));
    const result = await checkUrl('https://x.example/', httpOptions({ requestFn }));
    expect(result.error).toBe('invalid-redirect-location');
  });

  it('rejects an HTTPS -> HTTP downgrade redirect', async () => {
    const requestFn = transport(() => resp(302, { location: 'http://downgrade.example/' }));
    const result = await checkUrl('https://x.example/', httpOptions({ requestFn }));
    expect(result.error).toBe('insecure-redirect');
  });

  it('falls back from HEAD to GET when HEAD is not allowed', async () => {
    const requestFn = transport((_url, method) => (method === 'HEAD' ? resp(405) : resp(200)));
    const result = await checkUrl('https://x.example/', httpOptions({ requestFn }));
    expect(result.ok).toBe(true);
    expect(result.method).toBe('GET');
  });

  it('maps timeout errors', async () => {
    const requestFn = transport(() => {
      const error = new Error('slow');
      error.name = 'TimeoutError';
      return error;
    });
    const result = await checkUrl('https://x.example/', httpOptions({ requestFn }));
    expect(result.ok).toBe(false);
    expect(result.error).toBe('timeout');
    expect(result.status).toBeNull();
  });

  it('reports transport errors as network failures', async () => {
    const requestFn = transport(() => new Error('socket hang up'));
    const result = await checkUrl('https://x.example/', httpOptions({ requestFn }));
    expect(result.ok).toBe(false);
    expect(result.status).toBeNull();
    expect(result.error).toBe('socket hang up');
  });

  it('rejects a statically unsafe url without calling the transport', async () => {
    let called = 0;
    const requestFn: RequestFn = async () => {
      called += 1;
      return resp(200);
    };
    const result = await checkUrl('http://example.com/', httpOptions({ requestFn }));
    expect(result.error).toBe('unsafe-url');
    expect(called).toBe(0);
  });
});

describe('isRetryable', () => {
  const base: Omit<LinkResult, 'status' | 'error'> = {
    url: 'u',
    ok: false,
    finalUrl: null,
    redirects: 0,
    attempts: 1,
    method: 'HEAD',
  };
  it('retries transient failures only', () => {
    expect(isRetryable({ ...base, status: 500 })).toBe(true);
    expect(isRetryable({ ...base, status: 429 })).toBe(true);
    expect(isRetryable({ ...base, status: null, error: 'timeout' })).toBe(true);
    expect(isRetryable({ ...base, status: null, error: 'boom' })).toBe(true);
    expect(isRetryable({ ...base, status: 404 })).toBe(false);
    expect(isRetryable({ ...base, status: null, error: 'unsafe-address' })).toBe(false);
  });
});

describe('classifyError', () => {
  it('maps abort/timeout errors', () => {
    const err = new Error('');
    err.name = 'TimeoutError';
    expect(classifyError(err)).toBe('timeout');
  });
  it('uses message then name for other errors', () => {
    expect(classifyError(new Error('nope'))).toBe('nope');
    expect(classifyError(new Error(''))).toBe('Error');
  });
  it('handles non-error throwables', () => {
    expect(classifyError('weird')).toBe('unknown-error');
  });
});

describe('checkLinks', () => {
  it('preserves input order and summarises results', async () => {
    const requestFn = transport((url) => resp(url.endsWith('/notfound') ? 404 : 200));
    const summary = await checkLinks(
      ['https://a.example/ok', 'https://a.example/notfound', 'https://a.example/ok'],
      { concurrency: 2, lookup: PUBLIC_LOOKUP, requestFn },
    );
    expect(summary.results.map((r) => r.status)).toEqual([200, 404, 200]);
    expect(summary.total).toBe(3);
    expect(summary.ok).toBe(2);
    expect(summary.broken).toBe(1);
  });

  it('retries transient failures until success', async () => {
    const counts = new Map<string, number>();
    const requestFn: RequestFn = async (url) => {
      const n = (counts.get(url) ?? 0) + 1;
      counts.set(url, n);
      return resp(n < 3 ? 503 : 200);
    };
    const summary = await checkLinks(['https://a.example/flaky'], {
      retries: 2,
      sleep: async () => {},
      lookup: PUBLIC_LOOKUP,
      requestFn,
    });
    expect(summary.results[0]?.ok).toBe(true);
    expect(summary.results[0]?.attempts).toBe(3);
  });

  it('gives up after exhausting retries', async () => {
    const summary = await checkLinks(['https://a.example/down'], {
      retries: 1,
      sleep: async () => {},
      lookup: PUBLIC_LOOKUP,
      requestFn: transport(() => resp(503)),
    });
    expect(summary.results[0]?.ok).toBe(false);
    expect(summary.results[0]?.attempts).toBe(2);
  });

  it('uses the built-in delay when no sleep is injected', async () => {
    const summary = await checkLinks(['https://a.example/down'], {
      retries: 1,
      retryDelayMs: 0,
      lookup: PUBLIC_LOOKUP,
      requestFn: transport(() => resp(503)),
    });
    expect(summary.results[0]?.attempts).toBe(2);
  });

  it('handles an empty url list', async () => {
    const summary = await checkLinks([]);
    expect(summary).toEqual({ total: 0, ok: 0, broken: 0, results: [] });
  });
});
