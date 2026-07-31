/**
 * URL hygiene checks for catalog source links.
 *
 * The catalog only accepts HTTPS links that are free of common tracking query
 * parameters and that satisfy the public-URL policy (no credentials, no
 * non-default ports, no localhost/`.local`/`.internal`, no private/reserved IP
 * literals). These are static checks only — DNS resolution happens in the link
 * checker (see lib/net/url-policy.ts and lib/linkcheck), which keeps catalog
 * validation fast and network-free.
 */
import { isBlockedHostname, isIpLiteral } from '../net/url-policy';

/** Query parameters that are almost always analytics/tracking noise. */
export const TRACKING_PARAMS: readonly string[] = [
  'gclid',
  'fbclid',
  'msclkid',
  'yclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'ref',
  'ref_src',
  'ref_url',
  'referrer',
  'source',
  'spm',
  'vero_id',
  '_hsenc',
  '_hsmi',
  '_ga',
  'oly_enc_id',
  'oly_anon_id',
];

const TRACKING_PARAM_SET = new Set(TRACKING_PARAMS);

export type UrlReason =
  | 'unparseable'
  | 'not-https'
  | 'unsafe-url'
  | 'unsafe-host'
  | 'unsafe-address'
  | 'tracking-params'
  | null;

export interface UrlAnalysis {
  /** True only when the URL is HTTPS, policy-safe, and free of tracking params. */
  readonly valid: boolean;
  /** Parsed protocol including the trailing colon, e.g. `https:`. */
  readonly protocol: string | null;
  /** Tracking parameters found on the URL (original casing preserved). */
  readonly trackingParams: readonly string[];
  /** Machine-readable reason when {@link valid} is false. */
  readonly reason: UrlReason;
}

function findTrackingParams(url: URL): string[] {
  const found: string[] = [];
  for (const key of url.searchParams.keys()) {
    const normalized = key.toLowerCase();
    if (normalized.startsWith('utm_') || TRACKING_PARAM_SET.has(normalized)) {
      found.push(key);
    }
  }
  return found;
}

/** Analyse a source URL against the catalog's hygiene and safety rules. */
export function analyzeUrl(raw: string): UrlAnalysis {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { valid: false, protocol: null, trackingParams: [], reason: 'unparseable' };
  }

  const trackingParams = findTrackingParams(url);
  const base = { protocol: url.protocol, trackingParams } as const;

  if (url.protocol !== 'https:') {
    return { valid: false, ...base, reason: 'not-https' };
  }
  if (url.username !== '' || url.password !== '' || url.port !== '') {
    return { valid: false, ...base, reason: 'unsafe-url' };
  }
  // IP-literal source URLs are rejected; only DNS hostnames are allowed.
  if (isIpLiteral(url.hostname)) {
    return { valid: false, ...base, reason: 'unsafe-address' };
  }
  if (isBlockedHostname(url.hostname)) {
    return { valid: false, ...base, reason: 'unsafe-host' };
  }
  if (trackingParams.length > 0) {
    return { valid: false, ...base, reason: 'tracking-params' };
  }
  return { valid: true, ...base, reason: null };
}

/** Convenience predicate wrapping {@link analyzeUrl}. */
export function isCleanHttpsUrl(raw: string): boolean {
  return analyzeUrl(raw).valid;
}
