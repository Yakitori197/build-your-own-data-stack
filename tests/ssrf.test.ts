import { describe, expect, it } from 'vitest';
import {
  analyzeUrlPolicy,
  createSecureLookup,
  isBlockedHostname,
  redactUrl,
  resolvePublicAddresses,
  SsrfError,
  type LookupFn,
} from '../lib/net/url-policy';
import { nodeLookup } from '../lib/net/dns';
import {
  buildRequestOptions,
  checkUrl,
  type HttpCheckOptions,
  type RequestFn,
  type SecureResponse,
} from '../lib/linkcheck/http';

function resp(status: number, headers: Record<string, string> = {}): SecureResponse {
  return { status, headers };
}

/* --------------------------------------------------------------- static policy */

describe('analyzeUrlPolicy (static)', () => {
  const cases: Array<[string, 'unsafe-url' | 'unsafe-host' | 'unsafe-address' | null]> = [
    ['https://example.com/', null],
    ['https://8.8.8.8/', 'unsafe-address'],
    ['http://example.com/', 'unsafe-url'],
    ['not a url', 'unsafe-url'],
    ['https://user:pass@example.com/', 'unsafe-url'],
    ['https://example.com:8443/', 'unsafe-url'],
    ['https://localhost/', 'unsafe-host'],
    ['https://api.localhost/', 'unsafe-host'],
    ['https://svc.internal/', 'unsafe-host'],
    ['https://foo.local/', 'unsafe-host'],
    ['https://127.0.0.1/', 'unsafe-address'],
    ['https://10.0.0.1/', 'unsafe-address'],
    ['https://169.254.0.1/', 'unsafe-address'],
    ['https://100.64.0.1/', 'unsafe-address'],
    ['https://[::1]/', 'unsafe-address'],
    ['https://[fc00::1]/', 'unsafe-address'],
    ['https://[fe80::1]/', 'unsafe-address'],
  ];
  for (const [url, expected] of cases) {
    it(`${url} -> ${expected ?? 'ok'}`, () => {
      const result = analyzeUrlPolicy(url);
      expect(result.reason).toBe(expected);
      expect(result.ok).toBe(expected === null);
    });
  }

  it('isBlockedHostname handles trailing dots and case', () => {
    expect(isBlockedHostname('LOCALHOST.')).toBe(true);
    expect(isBlockedHostname('example.com')).toBe(false);
  });
});

/* ----------------------------------------------- connection-time DNS validation */

describe('resolvePublicAddresses', () => {
  it('returns addresses with families for public results', async () => {
    const resolved = await resolvePublicAddresses('h', async () => [
      '93.184.216.34',
      '2606:4700:4700::1111',
    ]);
    expect(resolved).toEqual([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:4700:4700::1111', family: 6 },
    ]);
  });

  it('rejects an empty result as unsafe-host', async () => {
    await expect(resolvePublicAddresses('h', async () => [])).rejects.toBeInstanceOf(SsrfError);
    await expect(resolvePublicAddresses('h', async () => [])).rejects.toMatchObject({
      reason: 'unsafe-host',
    });
  });

  it('rejects if any resolved address is private', async () => {
    await expect(
      resolvePublicAddresses('h', async () => ['93.184.216.34', '10.0.0.1']),
    ).rejects.toMatchObject({ reason: 'unsafe-address' });
  });
});

function callLookup(
  lookup: ReturnType<typeof createSecureLookup>,
  all: boolean,
): Promise<{ err: Error | null; addr: unknown; family: number | undefined }> {
  return new Promise((resolve) => {
    lookup('host', { all }, (err, addr, family) => resolve({ err, addr, family }));
  });
}

describe('createSecureLookup', () => {
  it('returns all validated addresses when options.all is true', async () => {
    const lookup = createSecureLookup(async () => ['93.184.216.34', '2606:4700:4700::1111']);
    const { err, addr } = await callLookup(lookup, true);
    expect(err).toBeNull();
    expect(addr).toEqual([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:4700:4700::1111', family: 6 },
    ]);
  });

  it('returns a single validated address+family when options.all is false', async () => {
    const v4 = await callLookup(
      createSecureLookup(async () => ['93.184.216.34']),
      false,
    );
    expect(v4.err).toBeNull();
    expect(v4.addr).toBe('93.184.216.34');
    expect(v4.family).toBe(4);

    const v6 = await callLookup(
      createSecureLookup(async () => ['2606:4700:4700::1111']),
      false,
    );
    expect(v6.addr).toBe('2606:4700:4700::1111');
    expect(v6.family).toBe(6);
  });

  it('refuses to yield a private address', async () => {
    const { err, addr } = await callLookup(
      createSecureLookup(async () => ['10.0.0.1']),
      true,
    );
    expect(err).toBeInstanceOf(SsrfError);
    expect((err as SsrfError).reason).toBe('unsafe-address');
    expect(addr).toBeUndefined();
  });

  it('refuses an empty resolution', async () => {
    const { err } = await callLookup(
      createSecureLookup(async () => []),
      false,
    );
    expect((err as SsrfError).reason).toBe('unsafe-host');
  });

  it('propagates resolver errors', async () => {
    const { err } = await callLookup(
      createSecureLookup(async () => {
        throw new Error('dns down');
      }),
      true,
    );
    expect(err).toBeInstanceOf(Error);
  });
});

/* ------------------------------------------------------------ request options */

function httpOptions(overrides: Partial<HttpCheckOptions> = {}): HttpCheckOptions {
  return {
    timeoutMs: 1000,
    maxRedirects: 5,
    userAgent: 'ua',
    lookup: async () => ['93.184.216.34'],
    requestFn: async () => resp(200),
    ...overrides,
  };
}

describe('buildRequestOptions', () => {
  it('preserves the original hostname for SNI, Host header, and cert checks', () => {
    const options = buildRequestOptions('https://example.com/wiki/Foo?q=1', 'HEAD', httpOptions());
    expect(options.hostname).toBe('example.com');
    expect(options.servername).toBe('example.com');
    expect(options.headers.host).toBe('example.com');
    expect(options.rejectUnauthorized).toBe(true);
    expect(options.method).toBe('HEAD');
    expect(options.port).toBe(443);
    expect(options.path).toBe('/wiki/Foo?q=1');
    expect(typeof options.lookup).toBe('function');
  });
});

/* --------------------------------------------- transport enforces the policy */

/** A transport that models node:https.request: it resolves via the socket's own
 *  secure lookup before "connecting". If the lookup refuses, no connection is
 *  made and no other DNS query happens. */
function connectingTransport(onConnect: (url: string, method: string) => SecureResponse | Error): {
  requestFn: RequestFn;
  connections: () => number;
} {
  let connections = 0;
  const requestFn: RequestFn = async (url, options) => {
    await new Promise<void>((resolve, reject) => {
      options.lookup(options.hostname, { all: true }, (err) => (err ? reject(err) : resolve()));
    });
    connections += 1;
    const result = onConnect(url, options.method);
    if (result instanceof Error) {
      throw result;
    }
    return result;
  };
  return { requestFn, connections: () => connections };
}

describe('link checker pins the connection to a validated address', () => {
  it('never connects when the hostname resolves to a private IP (single DNS resolution)', async () => {
    let dnsCalls = 0;
    const lookup: LookupFn = async () => {
      dnsCalls += 1;
      return ['10.0.0.1'];
    };
    const { requestFn, connections } = connectingTransport(() => resp(200));
    const result = await checkUrl('https://rebind.example/', httpOptions({ lookup, requestFn }));
    expect(result.error).toBe('unsafe-address');
    expect(connections()).toBe(0); // socket never connected
    expect(dnsCalls).toBe(1); // exactly one resolution, at connection time — no pre-flight DNS
  });

  it('rejects when any resolved address (A/AAAA) is private', async () => {
    const lookup: LookupFn = async () => ['93.184.216.34', 'fc00::1'];
    const { requestFn, connections } = connectingTransport(() => resp(200));
    const result = await checkUrl('https://mixed.example/', httpOptions({ lookup, requestFn }));
    expect(result.error).toBe('unsafe-address');
    expect(connections()).toBe(0);
  });

  it('rejects an empty resolution as unsafe-host', async () => {
    const { requestFn } = connectingTransport(() => resp(200));
    const result = await checkUrl(
      'https://empty.example/',
      httpOptions({ lookup: async () => [], requestFn }),
    );
    expect(result.error).toBe('unsafe-host');
  });

  it('surfaces resolver errors as a failure without connecting', async () => {
    const { requestFn, connections } = connectingTransport(() => resp(200));
    const result = await checkUrl(
      'https://err.example/',
      httpOptions({
        lookup: async () => {
          throw new Error('dns down');
        },
        requestFn,
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBeNull();
    expect(connections()).toBe(0);
  });

  it('re-validates the target of a public -> private redirect', async () => {
    const lookup: LookupFn = async (host) =>
      host === 'evil.example' ? ['10.0.0.1'] : ['93.184.216.34'];
    const { requestFn, connections } = connectingTransport((url) =>
      url.includes('start.example') ? resp(302, { location: 'https://evil.example/' }) : resp(200),
    );
    const result = await checkUrl('https://start.example/', httpOptions({ lookup, requestFn }));
    expect(result.error).toBe('unsafe-address');
    expect(connections()).toBe(1); // only the first hop connected; the redirect target was refused
  });

  it('resolves IPv4 and IPv6 sockets from the secure lookup', async () => {
    const v4 = connectingTransport(() => resp(200));
    const r4 = await checkUrl(
      'https://v4.example/',
      httpOptions({ lookup: async () => ['93.184.216.34'], requestFn: v4.requestFn }),
    );
    expect(r4.ok).toBe(true);
    expect(v4.connections()).toBe(1);

    const v6 = connectingTransport(() => resp(200));
    const r6 = await checkUrl(
      'https://v6.example/',
      httpOptions({ lookup: async () => ['2606:4700:4700::1111'], requestFn: v6.requestFn }),
    );
    expect(r6.ok).toBe(true);
    expect(v6.connections()).toBe(1);
  });
});

/* ------------------------------------------------------------------ utilities */

describe('redactUrl', () => {
  it('strips credentials from a URL', () => {
    expect(redactUrl('https://user:pass@example.com/x')).toBe('https://example.com/x');
  });
  it('leaves clean URLs unchanged', () => {
    expect(redactUrl('https://example.com/x')).toBe('https://example.com/x');
  });
  it('never echoes an unparseable string', () => {
    expect(redactUrl('a b c')).toBe('[unparseable-url]');
  });
});

describe('nodeLookup (loopback only, no network)', () => {
  it('resolves localhost from the hosts file', async () => {
    const addresses = await nodeLookup('localhost');
    expect(addresses.length).toBeGreaterThan(0);
    expect(typeof addresses[0]).toBe('string');
  });
});
