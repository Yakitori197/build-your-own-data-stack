/**
 * Production transport: a thin wrapper over `node:https.request`.
 *
 * Every security-relevant field (hostname, SNI `servername`, `rejectUnauthorized`,
 * and the connection-time secure `lookup`) is prepared and unit-tested in
 * `buildRequestOptions` (lib/linkcheck/http.ts). The explicit timeout below
 * bounds the whole operation — DNS resolution, connection, and response — so even
 * a hostname whose lookup hangs cannot stall the checker. Excluded from coverage
 * (it needs a real TLS socket) but still exercised by tests/transport.test.ts.
 */
import { request as httpsRequest } from 'node:https';
import type { LookupFunction } from 'node:net';
import type { RequestFn } from './http';

export const nodeHttpsRequest: RequestFn = (_url, options) =>
  new Promise((resolve, reject) => {
    let done = false;
    const finish = (action: () => void): void => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timer);
      action();
    };

    const req = httpsRequest(
      {
        method: options.method,
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        servername: options.servername,
        headers: options.headers,
        // The secure lookup pins the socket to a validated public address while
        // leaving hostname/SNI/certificate verification on the real domain.
        lookup: options.lookup as unknown as LookupFunction,
        signal: options.signal,
        rejectUnauthorized: options.rejectUnauthorized,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const { headers } = res;
        res.destroy(); // status + headers are enough; discard the body
        finish(() => resolve({ status, headers }));
      },
    );

    // Bounds DNS + connect + response (a stuck lookup has no socket yet, so
    // req.setTimeout alone would not fire — an explicit timer is required). We
    // reject directly rather than relying on `destroy` re-emitting an error.
    const timer = setTimeout(() => {
      req.destroy();
      finish(() => reject(new Error('timeout')));
    }, options.timeoutMs);

    req.on('error', (error) => finish(() => reject(error)));
    req.end();
  });
