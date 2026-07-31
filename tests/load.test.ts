import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CatalogValidationError,
  loadCatalog,
  readCatalogSources,
  resolveCatalogDir,
} from '../lib/catalog/load';

describe('resolveCatalogDir', () => {
  it('resolves a catalog directory under a project root', () => {
    const resolved = resolveCatalogDir('/project/root').replace(/\\/g, '/');
    expect(resolved.endsWith('/project/root/catalog')).toBe(true);
  });
});

describe('the shipped catalog', () => {
  it('reads every entry file from disk', () => {
    const sources = readCatalogSources(resolveCatalogDir());
    expect(sources.entries.length).toBeGreaterThanOrEqual(20);
  });

  it('loads, validates, and sorts the real catalog', () => {
    const catalog = loadCatalog();
    expect(catalog.entries.length).toBeGreaterThanOrEqual(20);
    expect(catalog.categories.length).toBe(15);
    expect(catalog.learningPaths.length).toBeGreaterThanOrEqual(3);
    const slugs = catalog.entries.map((entry) => entry.slug);
    expect([...slugs].sort()).toEqual(slugs);
  });
});

describe('CatalogValidationError', () => {
  it('summarises the error count and preserves issues', () => {
    const error = new CatalogValidationError([
      { level: 'error', code: 'x', message: 'boom' },
      { level: 'warning', code: 'y', message: 'careful' },
    ]);
    expect(error.name).toBe('CatalogValidationError');
    expect(error.issues).toHaveLength(2);
    expect(error.message).toContain('1 error');
  });
});

describe('loadCatalog on an invalid catalog', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'byods-invalid-'));
    const catalogDir = join(root, 'catalog');
    mkdirSync(join(catalogDir, 'entries'), { recursive: true });
    writeFileSync(join(catalogDir, 'categories.yaml'), 'nope: not-an-array\n');
    writeFileSync(join(catalogDir, 'learning-paths.yaml'), '[]\n');
    writeFileSync(join(catalogDir, 'entries', 'bad.yaml'), 'slug: bad\n');
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('throws CatalogValidationError carrying the errors', () => {
    expect(() => loadCatalog(root)).toThrow(CatalogValidationError);
    try {
      loadCatalog(root);
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      if (error instanceof CatalogValidationError) {
        expect(error.issues.some((issue) => issue.level === 'error')).toBe(true);
      }
    }
  });
});
