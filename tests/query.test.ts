import { describe, expect, it } from 'vitest';
import { validateCatalog } from '../lib/catalog/validate';
import type { Catalog } from '../lib/catalog/types';
import {
  allLanguages,
  categoriesWithEntries,
  countEntriesByCategory,
  entriesForCategory,
  entryBySlug,
} from '../lib/catalog/query';
import { validCategory, validEntry, validLearningPath } from './fixtures';

function catalogWithEmptyCategory(): Catalog {
  const result = validateCatalog(
    {
      categories: [
        validCategory({ id: 'databases' }),
        validCategory({
          id: 'caches',
          label: { en: 'Caches', 'zh-TW': '快取' },
          summary: { en: 'Hot data.', 'zh-TW': '熱資料。' },
        }),
      ],
      learningPaths: [validLearningPath({ steps: [{ slug: 'a' }, { slug: 'a' }] })],
      entries: [
        {
          file: 'entries/a.yaml',
          data: validEntry({ slug: 'a', category: 'databases', languages: ['Go', 'Python'] }),
        },
      ],
    },
    { now: new Date('2026-07-15T00:00:00Z') },
  );
  if (!result.catalog) {
    throw new Error(`invalid fixture: ${JSON.stringify(result.issues)}`);
  }
  return result.catalog;
}

describe('query helpers', () => {
  const catalog = catalogWithEmptyCategory();

  it('lists sorted, unique languages', () => {
    expect(allLanguages(catalog)).toEqual(['Go', 'Python']);
  });

  it('counts entries per category, including empty ones', () => {
    const counts = countEntriesByCategory(catalog);
    expect(counts.get('databases')).toBe(1);
    expect(counts.get('caches')).toBe(0);
  });

  it('filters entries by category', () => {
    expect(entriesForCategory(catalog, 'databases').map((entry) => entry.slug)).toEqual(['a']);
    expect(entriesForCategory(catalog, 'caches')).toEqual([]);
  });

  it('maps entries by slug', () => {
    expect(entryBySlug(catalog).get('a')?.slug).toBe('a');
  });

  it('counts only non-empty categories', () => {
    expect(categoriesWithEntries(catalog)).toBe(1);
  });
});
