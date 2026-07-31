import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Catalog, CatalogSources, Issue, RawEntry } from './types';
import { validateCatalog } from './validate';
import { compareStrings } from '../util/sort';

/** Resolve the catalog directory relative to a project root (defaults to CWD). */
export function resolveCatalogDir(root: string = process.cwd()): string {
  return resolve(root, 'catalog');
}

function readYaml(path: string): unknown {
  return parseYaml(readFileSync(path, 'utf8'));
}

/**
 * Read every catalog document from disk. Entry files are read in a stable,
 * locale-independent filename order so downstream generation is deterministic.
 */
export function readCatalogSources(catalogDir: string): CatalogSources {
  const categories = readYaml(join(catalogDir, 'categories.yaml'));
  const learningPaths = readYaml(join(catalogDir, 'learning-paths.yaml'));

  const entriesDir = join(catalogDir, 'entries');
  const files = readdirSync(entriesDir)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .sort(compareStrings);

  const entries: RawEntry[] = files.map((name) => ({
    file: `entries/${basename(name)}`,
    data: readYaml(join(entriesDir, name)),
  }));

  return { categories, learningPaths, entries };
}

/** Thrown by {@link loadCatalog} when the on-disk catalog has validation errors. */
export class CatalogValidationError extends Error {
  readonly issues: Issue[];

  constructor(issues: Issue[]) {
    const errorCount = issues.filter((issue) => issue.level === 'error').length;
    super(`Catalog validation failed with ${errorCount} error(s).`);
    this.name = 'CatalogValidationError';
    this.issues = issues;
  }
}

/**
 * Load and validate the catalog from disk, returning a ready-to-use
 * {@link Catalog}. Throws {@link CatalogValidationError} on any error so callers
 * (the generator, the site build) never operate on invalid data.
 */
export function loadCatalog(root?: string): Catalog {
  const sources = readCatalogSources(resolveCatalogDir(root));
  const result = validateCatalog(sources);
  if (!result.ok || result.catalog === null) {
    throw new CatalogValidationError(result.issues);
  }
  return result.catalog;
}
