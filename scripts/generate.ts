/**
 * `npm run catalog:generate`
 *
 * Regenerates the marker-managed README sections and the public JSON feed from
 * the validated catalog. Output is deterministic: running it twice with the same
 * catalog produces byte-identical files (verified in CI).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CatalogValidationError, loadCatalog } from '../lib/catalog/load';
import type { Catalog } from '../lib/catalog/types';
import { formatIssue } from '../lib/catalog/validate';
import { buildFeed } from '../lib/generate/feed';
import { applyReadmeSections } from '../lib/generate/readme';
import { stableStringify } from '../lib/generate/serialize';

const ROOT = process.cwd();
const README_PATH = resolve(ROOT, 'README.md');
const FEED_PATH = resolve(ROOT, 'public', 'api', 'catalog.json');

function loadOrExit(): Catalog {
  try {
    return loadCatalog(ROOT);
  } catch (error) {
    if (error instanceof CatalogValidationError) {
      for (const issue of error.issues.filter((i) => i.level === 'error')) {
        console.error(formatIssue(issue));
      }
      console.error(
        '\nRefusing to generate from an invalid catalog. Run `npm run catalog:validate`.',
      );
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
}

function writeFeed(catalog: Catalog): void {
  mkdirSync(dirname(FEED_PATH), { recursive: true });
  writeFileSync(FEED_PATH, stableStringify(buildFeed(catalog)), 'utf8');
}

function writeReadme(catalog: Catalog): void {
  // Normalise line endings on read so output is identical regardless of the
  // checkout's autocrlf setting; always write LF.
  const current = readFileSync(README_PATH, 'utf8').replace(/\r\n/g, '\n');
  writeFileSync(README_PATH, applyReadmeSections(current, catalog), 'utf8');
}

const catalog = loadOrExit();
writeFeed(catalog);
writeReadme(catalog);
console.log(
  `Generated public/api/catalog.json and README sections from ${catalog.entries.length} entries.`,
);
