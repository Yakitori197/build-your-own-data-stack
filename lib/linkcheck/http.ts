/**
 * Single-URL health check.
 *
 * Requests go through an injectable transport (`RequestFn`; in production a thin
 * wrapper over `node:https.request`). Every request is built with a connection
 * time secure `lookup` (see lib/net/url-policy.ts) so the socket only ever
 * connects to a validated public address — the original hostname is preserved
 * for TLS SNI and certificate verification, and no second, unvalidated DNS query
 * happens. Redirects are followed manually so we can cap/count them and reject
 * HTTPS→HTTP downgrades; `HEAD` is tried first, falling back to `GET`.
 */
import type { IncomingHttpHeaders } from 'node:http';
import {
  analyzeUrlPolicy,
  createSecureLookup,
  SsrfError,
  type LookupFn,
  type SecureLookup,
} from '../net/url-policy';

export const DEFAULT_USER_AGENT = 'build-your-own-data-stack-link-checker/0.1';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const METHOD_FALLBACK_STATUSES = new Set([405, 501]);

/** Errors that are permanent — never worth retrying. */
const NON_RETRYABLE_ERRORS = new Set([
  'unsafe-url',
  'unsafe-host',
  'unsafe-address',
  'insecure-redirect',
  'too-many-redirects',
  'redirect-without-location',
  'invalid-redirect-location',
]);

export interface SecureRequestOptions {
  readonly method: string;
  readonly hostname: string;
  readonly port: number;
  readonly path: string;
  /** TLS SNI: always the original hostname, never a raw IP. */
  readonly servername: string;
  readonly headers: Record<string, string>;
  /** Connection-time DNS guard handed to the transport. */
  readonly lookup: SecureLookup;
  readonly signal: AbortSignal;
  /** Certificate verification is always on. */
  readonly rejectUnauthorized: true;
  readonly timeoutMs: number;
}

export interface SecureResponse {
  readonly status: number;
  readonly headers: IncomingHttpHeaders;
}

export type RequestFn = (url: string, options: SecureRequestOptions) => Promise<SecureResponse>;

export interface HttpCheckOptions {
  readonly timeoutMs: number;
  readonly maxRedirects: number;
  readonly userAgent: string;
  /** DNS resolver used by the connection-time secure lookup. Injectable. */
  readonly lookup: LookupFn;
  /** Transport. Injectable so tests never open a real socket. */
  readonly requestFn: RequestFn;
}

export interface LinkResult {
  readonly url: string;
  readonly ok: boolean;
  readonly status: number | null;
  readonly finalUrl: string | null;
  readonly redirects: number;
  readonly attempts: number;
  readonly method: string;
  readonly error?: string;
}

/**
 * Build the options for one HTTPS request. The hostname is kept intact (so SNI
 * and certificate checks use the real domain) while `lookup` pins the connection
 * to a validated public address.
 */
export function buildRequestOptions(
  rawUrl: string,
  method: string,
  options: HttpCheckOptions,
): SecureRequestOptions {
  const url = new URL(rawUrl);
  return {
    method,
    hostname: url.hostname,
    port: url.port === '' ? 443 : Number(url.port),
    path: `${url.pathname}${url.search}`,
    servername: url.hostname,
    headers: { host: url.host, 'user-agent': options.userAgent },
    lookup: createSecureLookup(options.lookup),
    signal: AbortSignal.timeout(options.timeoutMs),
    rejectUnauthorized: true,
    timeoutMs: options.timeoutMs,
  };
}

function isRedirect(status: number): boolean {
  return REDIRECT_STATUSES.has(status);
}

export function classifyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return 'timeout';
    }
    return error.message || error.name;
  }
  return 'unknown-error';
}

function fail(
  startUrl: string,
  method: string,
  redirects: number,
  error: string,
  status: number | null = null,
  finalUrl: string | null = null,
): LinkResult {
  return { url: startUrl, ok: false, status, finalUrl, redirects, attempts: 1, method, error };
}

function initialScheme(url: string): string {
  try {
    return new URL(url).protocol;
  } catch {
    return '';
  }
}

async function follow(
  startUrl: string,
  method: string,
  options: HttpCheckOptions,
): Promise<LinkResult> {
  const originScheme = initialScheme(startUrl);
  let current = startUrl;
  let redirects = 0;

  for (;;) {
    // Cheap static gate (handles non-HTTPS, credentials, ports, blocked hosts,
    // and private IP literals). The DNS-based check happens in the transport's
    // secure lookup, at connection time.
    const policy = analyzeUrlPolicy(current);
    if (!policy.ok) {
      return fail(startUrl, method, redirects, policy.reason ?? 'unsafe-url');
    }

    let response: SecureResponse;
    try {
      response = await options.requestFn(current, buildRequestOptions(current, method, options));
    } catch (error) {
      if (error instanceof SsrfError) {
        return fail(startUrl, method, redirects, error.reason);
      }
      return fail(startUrl, method, redirects, classifyError(error));
    }

    const status = response.status;
    if (isRedirect(status)) {
      const location = response.headers.location;
      if (location === undefined) {
        return fail(startUrl, method, redirects, 'redirect-without-location', status, current);
      }
      if (redirects >= options.maxRedirects) {
        return fail(startUrl, method, redirects, 'too-many-redirects', status, current);
      }
      let target: URL;
      try {
        target = new URL(location, current);
      } catch {
        return fail(startUrl, method, redirects, 'invalid-redirect-location', status, current);
      }
      if (originScheme === 'https:' && target.protocol !== 'https:') {
        return fail(startUrl, method, redirects, 'insecure-redirect', status, current);
      }
      current = target.toString();
      redirects += 1;
      continue; // policy + secure lookup re-applied at the top of the loop
    }

    const ok = status >= 200 && status < 400;
    return {
      url: startUrl,
      ok,
      status,
      finalUrl: current,
      redirects,
      attempts: 1,
      method,
      error: ok ? undefined : `http-${status}`,
    };
  }
}

/**
 * Check a single URL. Tries `HEAD`, then retries once with `GET` when the server
 * reports that `HEAD` is not allowed/implemented.
 */
export async function checkUrl(url: string, options: HttpCheckOptions): Promise<LinkResult> {
  const head = await follow(url, 'HEAD', options);
  if (head.status !== null && METHOD_FALLBACK_STATUSES.has(head.status)) {
    return follow(url, 'GET', options);
  }
  return head;
}

/** Whether a result is worth retrying (transient failures only). */
export function isRetryable(result: LinkResult): boolean {
  if (result.error !== undefined && NON_RETRYABLE_ERRORS.has(result.error)) {
    return false;
  }
  if (result.status === null) {
    return true; // network error or timeout
  }
  return result.status >= 500 || result.status === 429;
}
