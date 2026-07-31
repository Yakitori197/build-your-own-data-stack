/**
 * `npm run links:check`
 *
 * Verifies that every source link in the catalog still resolves. This hits the
 * real network and is intended for manual runs and the scheduled GitHub Action —
 * it is deliberately NOT part of the unit test suite (see docs/link-checker.md).
 */
import { loadCatalog } from '../lib/catalog/load';
import type { Catalog } from '../lib/catalog/types';
import { checkLinks } from '../lib/linkcheck/checker';
import { redactUrl } from '../lib/net/url-policy';
import { compareStrings } from '../lib/util/sort';

function collectUrls(catalog: Catalog): string[] {
  const urls = new Set<string>();
  for (const entry of catalog.entries) {
    urls.add(entry.sourceUrl);
    if (entry.sourceRepoUrl) {
      urls.add(entry.sourceRepoUrl);
    }
  }
  return [...urls].sort(compareStrings);
}

async function main(): Promise<number> {
  const catalog = loadCatalog();
  const urls = collectUrls(catalog);
  console.log(`Checking ${urls.length} unique links...\n`);

  const summary = await checkLinks(urls, {
    concurrency: 6,
    timeoutMs: 15_000,
    retries: 2,
    retryDelayMs: 1_000,
  });

  for (const result of summary.results) {
    const label = result.ok ? 'OK  ' : 'FAIL';
    const status = result.status === null ? '---' : String(result.status);
    const detail = result.error ? ` (${result.error})` : '';
    console.log(`${label} ${status.padStart(3)} ${redactUrl(result.url)}${detail}`);
  }

  console.log(`\n${summary.ok}/${summary.total} OK · ${summary.broken} broken`);
  return summary.broken > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
