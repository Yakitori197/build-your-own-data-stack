import { describe, expect, it } from 'vitest';
import { checkUrl, type HttpCheckOptions } from '../lib/linkcheck/http';
import { nodeHttpsRequest } from '../lib/linkcheck/transport';

/**
 * Offline regression tests for the *real* production transport
 * (`nodeHttpsRequest`, a `node:https.request` wrapper). No public site is used —
 * the injected `lookup` decides everything, so a rejected connection never opens
 * a real socket.
 */
function realOptions(overrides: Partial<HttpCheckOptions>): HttpCheckOptions {
  return {
    timeoutMs: 2000,
    maxRedirects: 5,
    userAgent: 'transport-test',
    lookup: async () => ['93.184.216.34'],
    requestFn: nodeHttpsRequest, // the real transport, not a mock
    ...overrides,
  };
}

describe('nodeHttpsRequest (real transport, fully offline)', () => {
  it('refuses a hostname whose lookup returns a private IP, without opening a socket', async () => {
    let lookupCalls = 0;
    const lookup = async (): Promise<string[]> => {
      lookupCalls += 1;
      return ['127.0.0.1'];
    };

    // `.invalid` never resolves via real DNS. If the transport ever dropped
    // `lookup: options.lookup`, node would try real DNS here and fail with a DNS
    // error (ENOTFOUND) — not `unsafe-address` — and lookupCalls would be 0. So
    // this assertion also guards that the transport actually wires the lookup.
    const result = await checkUrl('https://blocked.invalid/', realOptions({ lookup }));

    // The secure lookup throws inside the connection's own lookup callback, so no
    // socket is opened (a real connection to 127.0.0.1:443 would surface as
    // ECONNREFUSED, not unsafe-address).
    expect(result.error).toBe('unsafe-address');
    expect(result.ok).toBe(false);
    expect(result.status).toBeNull();
    expect(lookupCalls).toBe(1); // exactly one resolution, at connection time
  });

  it('aborts a stuck lookup via the request timeout', async () => {
    // A lookup that never settles — only the transport's timeout can end this.
    const lookup = (): Promise<string[]> => new Promise<string[]>(() => {});
    const result = await checkUrl(
      'https://stuck.invalid/',
      realOptions({ lookup, timeoutMs: 150 }),
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBe('timeout');
    expect(result.status).toBeNull();
  });
});
