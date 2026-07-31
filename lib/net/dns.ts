import { promises as dns } from 'node:dns';
import type { LookupFn } from './url-policy';

/**
 * Real DNS resolver used in production. It is intentionally a thin adapter over
 * `node:dns` so that all policy logic can be unit tested with an injected fake
 * resolver and never touch the real network.
 */
export const nodeLookup: LookupFn = async (hostname) => {
  const results = await dns.lookup(hostname, { all: true, verbatim: true });
  return results.map((result) => result.address);
};
