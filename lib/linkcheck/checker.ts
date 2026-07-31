import { nodeLookup } from '../net/dns';
import type { LookupFn } from '../net/url-policy';
import { checkUrl, DEFAULT_USER_AGENT, isRetryable, type LinkResult, type RequestFn } from './http';
import { nodeHttpsRequest } from './transport';

export interface LinkCheckConfig {
  timeoutMs?: number;
  maxRedirects?: number;
  concurrency?: number;
  /** Number of *additional* attempts after the first (so total = retries + 1). */
  retries?: number;
  retryDelayMs?: number;
  userAgent?: string;
  /** DNS resolver used by the connection-time secure lookup. Injectable. */
  lookup?: LookupFn;
  /** Transport. Injectable so tests never open a real socket. */
  requestFn?: RequestFn;
  /** Injectable delay, so tests need not wait for real backoff. */
  sleep?: (ms: number) => Promise<void>;
}

interface ResolvedConfig {
  timeoutMs: number;
  maxRedirects: number;
  concurrency: number;
  retries: number;
  retryDelayMs: number;
  userAgent: string;
  lookup: LookupFn;
  requestFn: RequestFn;
  sleep: (ms: number) => Promise<void>;
}

export interface LinkCheckSummary {
  readonly total: number;
  readonly ok: number;
  readonly broken: number;
  readonly results: LinkResult[];
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function resolveConfig(config: LinkCheckConfig): ResolvedConfig {
  return {
    timeoutMs: config.timeoutMs ?? 10_000,
    maxRedirects: config.maxRedirects ?? 5,
    concurrency: Math.max(1, config.concurrency ?? 8),
    retries: Math.max(0, config.retries ?? 2),
    retryDelayMs: config.retryDelayMs ?? 500,
    userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
    lookup: config.lookup ?? nodeLookup,
    requestFn: config.requestFn ?? nodeHttpsRequest,
    sleep: config.sleep ?? defaultSleep,
  };
}

async function checkWithRetry(url: string, config: ResolvedConfig): Promise<LinkResult> {
  let result = await checkUrl(url, config);
  let attempt = 1;
  while (attempt <= config.retries && !result.ok && isRetryable(result)) {
    await config.sleep(config.retryDelayMs * attempt);
    result = await checkUrl(url, config);
    attempt += 1;
  }
  return { ...result, attempts: attempt };
}

/**
 * Check many URLs with a fixed-size worker pool. Results are returned in the same
 * order as the input, regardless of completion order.
 */
export async function checkLinks(
  urls: readonly string[],
  config: LinkCheckConfig = {},
): Promise<LinkCheckSummary> {
  const resolved = resolveConfig(config);
  const results = new Array<LinkResult>(urls.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= urls.length) {
        return;
      }
      const url = urls[index];
      if (url === undefined) {
        return;
      }
      results[index] = await checkWithRetry(url, resolved);
    }
  };

  const workerCount = Math.min(resolved.concurrency, urls.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const ok = results.filter((result) => result.ok).length;
  return { total: urls.length, ok, broken: urls.length - ok, results };
}
