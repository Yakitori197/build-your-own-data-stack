/**
 * Public-URL policy: the single source of truth for deciding whether a URL is
 * safe to fetch. Designed to defend against SSRF, including DNS rebinding.
 *
 * There are two layers:
 *   1. `analyzeUrlPolicy` — cheap static checks (no DNS): HTTPS only, no
 *      credentials, no non-default port, no localhost/`.local`/`.internal`, and
 *      no private/reserved IP literals.
 *   2. `createSecureLookup` — a connection-time DNS guard. The link checker hands
 *      this to `node:https.request` as its `lookup`, so the address the socket
 *      actually connects to is the one that was validated. There is no separate
 *      pre-flight DNS lookup that a second resolution could diverge from.
 */
import { isPublicIp, parseIpv4 } from './ip';

export type UrlPolicyReason = 'unsafe-url' | 'unsafe-host' | 'unsafe-address';

export interface UrlPolicyResult {
  readonly ok: boolean;
  readonly reason: UrlPolicyReason | null;
}

/** A DNS resolver: hostname -> list of resolved IP address strings. Injectable. */
export type LookupFn = (hostname: string) => Promise<string[]>;

/** Error raised when a connection is refused for SSRF-policy reasons. */
export class SsrfError extends Error {
  readonly reason: UrlPolicyReason;

  constructor(reason: UrlPolicyReason) {
    super(reason);
    this.name = 'SsrfError';
    this.reason = reason;
  }
}

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal'];

/** Hostnames that must never be fetched even before DNS resolution. */
export function isBlockedHostname(host: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, '');
  if (normalized === 'localhost') {
    return true;
  }
  return BLOCKED_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

/** Strip the surrounding brackets that `URL.hostname` keeps for IPv6 literals. */
export function stripBrackets(host: string): string {
  return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
}

export function isIpLiteral(host: string): boolean {
  const bare = stripBrackets(host);
  return parseIpv4(bare) !== null || bare.includes(':');
}

const OK: UrlPolicyResult = { ok: true, reason: null };

/**
 * Static checks only (no DNS). Rejects non-HTTPS, embedded credentials,
 * non-default ports, blocked hostnames, and private/reserved IP literals.
 */
export function analyzeUrlPolicy(raw: string): UrlPolicyResult {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'unsafe-url' };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'unsafe-url' };
  }
  if (url.username !== '' || url.password !== '') {
    return { ok: false, reason: 'unsafe-url' };
  }
  if (url.port !== '') {
    return { ok: false, reason: 'unsafe-url' };
  }
  // IP-literal URLs are refused outright: only DNS hostnames are allowed. This
  // keeps TLS SNI / certificate verification meaningful and avoids IPv6-bracket
  // handling in the socket layer. DNS-resolved addresses are still validated as
  // public at connection time (see resolvePublicAddresses).
  if (isIpLiteral(url.hostname)) {
    return { ok: false, reason: 'unsafe-address' };
  }
  if (isBlockedHostname(url.hostname)) {
    return { ok: false, reason: 'unsafe-host' };
  }
  return OK;
}

function ipFamily(address: string): number {
  return parseIpv4(address) !== null ? 4 : 6;
}

export interface ResolvedAddress {
  readonly address: string;
  readonly family: number;
}

/**
 * The core connection-time guard, split out so it can be unit tested directly:
 * resolve the hostname, and only return addresses if **every** one is public.
 * Throws {@link SsrfError} otherwise (empty result -> `unsafe-host`, any private
 * address -> `unsafe-address`).
 */
export async function resolvePublicAddresses(
  hostname: string,
  lookup: LookupFn,
): Promise<ResolvedAddress[]> {
  const addresses = await lookup(hostname);
  if (addresses.length === 0) {
    throw new SsrfError('unsafe-host');
  }
  for (const address of addresses) {
    if (!isPublicIp(address)) {
      throw new SsrfError('unsafe-address');
    }
  }
  return addresses.map((address) => ({ address, family: ipFamily(address) }));
}

/** Node-style lookup callback: single address form or (with `all`) array form. */
type LookupCallback = (
  err: Error | null,
  addressOrAddresses?: string | ResolvedAddress[],
  family?: number,
) => void;

export type SecureLookup = (
  hostname: string,
  options: { all?: boolean },
  callback: LookupCallback,
) => void;

/**
 * Build a `node:https.request`-compatible `lookup` that only ever yields
 * validated public addresses. Because this runs as the socket's own resolver,
 * the transport performs no other DNS query — closing the rebinding/TOCTOU gap.
 * The original hostname is untouched, so TLS SNI and certificate verification
 * still use the real domain.
 */
export function createSecureLookup(lookup: LookupFn): SecureLookup {
  return (hostname, options, callback) => {
    resolvePublicAddresses(hostname, lookup)
      .then((resolved) => {
        if (options.all === true) {
          callback(null, resolved);
        } else {
          // resolvePublicAddresses throws on an empty result, so resolved[0] exists.
          const first = resolved[0]!;
          callback(null, first.address, first.family);
        }
      })
      .catch((error: unknown) => {
        callback(error instanceof Error ? error : new SsrfError('unsafe-host'));
      });
  };
}

/**
 * Remove any userinfo from a URL before it is logged, so credentials never leak
 * into logs. Falls back to a placeholder if the input is not a valid URL.
 */
export function redactUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.username !== '' || url.password !== '') {
      url.username = '';
      url.password = '';
    }
    return url.toString();
  } catch {
    return '[unparseable-url]';
  }
}
