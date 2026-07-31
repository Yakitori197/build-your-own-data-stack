import { describe, expect, it } from 'vitest';
import { validateCatalog } from '../lib/catalog/validate';
import type { Catalog } from '../lib/catalog/types';
import { sortKeysDeep, stableStringify } from '../lib/generate/serialize';
import { hasSection, markerFor, replaceSection } from '../lib/generate/markers';
import { buildFeed } from '../lib/generate/feed';
import { applyReadmeSections, buildReadmeSections } from '../lib/generate/readme';
import { validCategory, validEntry, validLearningPath } from './fixtures';

function buildCatalog(): Catalog {
  const result = validateCatalog(
    {
      categories: [
        validCategory({ id: 'databases' }),
        validCategory({
          id: 'caches',
          label: { en: 'Caches', 'zh-TW': '快取' },
          summary: { en: 'Keep hot data close.', 'zh-TW': '把熱資料放在近處。' },
        }),
      ],
      learningPaths: [
        validLearningPath({ steps: [{ slug: 'aaa' }, { slug: 'bbb', note: 'next' }] }),
      ],
      entries: [
        {
          file: 'entries/bbb.yaml',
          data: validEntry({ slug: 'bbb', category: 'caches', languages: ['Go'], title: 'Bbb' }),
        },
        {
          file: 'entries/aaa.yaml',
          data: validEntry({
            slug: 'aaa',
            category: 'databases',
            languages: ['Python', 'Rust'],
            title: 'Aaa',
          }),
        },
      ],
    },
    { now: new Date('2026-07-15T00:00:00Z') },
  );
  if (!result.catalog) {
    throw new Error(`fixture catalog invalid: ${JSON.stringify(result.issues)}`);
  }
  return result.catalog;
}

describe('stableStringify', () => {
  it('sorts object keys deeply and appends a trailing newline', () => {
    const out = stableStringify({ b: 1, a: { d: 2, c: 3 } });
    expect(out).toBe('{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}\n');
  });

  it('is independent of key insertion order', () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
  });

  it('preserves array order', () => {
    expect(sortKeysDeep([3, 1, 2])).toEqual([3, 1, 2]);
  });
});

describe('markers', () => {
  const template = `x\n${markerFor('S').start}\nold\n${markerFor('S').end}\ny`;

  it('detects a present section', () => {
    expect(hasSection(template, 'S')).toBe(true);
    expect(hasSection(template, 'MISSING')).toBe(false);
  });

  it('replaces only the body between markers', () => {
    const out = replaceSection(template, 'S', 'new');
    expect(out).toContain('new');
    expect(out).not.toContain('old');
    expect(out.startsWith('x\n')).toBe(true);
    expect(out.endsWith('\ny')).toBe(true);
  });

  it('throws when markers are missing', () => {
    expect(() => replaceSection('no markers', 'S', 'x')).toThrow(/markers/);
  });
});

describe('buildFeed', () => {
  it('computes counts and per-category entry counts', () => {
    const feed = buildFeed(buildCatalog());
    expect(feed.counts.entries).toBe(2);
    expect(feed.counts.categories).toBe(2);
    expect(feed.counts.categoriesWithEntries).toBe(2);
    expect(feed.counts.learningPaths).toBe(1);
    expect(feed.languages).toEqual(['Go', 'Python', 'Rust']);
    const databases = feed.categories.find((c) => c.id === 'databases');
    expect(databases?.entryCount).toBe(1);
  });

  it('contains no wall-clock timestamp (reproducible output)', () => {
    const feed = buildFeed(buildCatalog()) as unknown as Record<string, unknown>;
    expect(feed['generatedAt']).toBeUndefined();
    expect(feed['timestamp']).toBeUndefined();
  });

  it('produces identical serialisation across runs', () => {
    expect(stableStringify(buildFeed(buildCatalog()))).toBe(
      stableStringify(buildFeed(buildCatalog())),
    );
  });
});

describe('readme sections', () => {
  const template = [
    '# Project',
    '',
    markerFor('STATS').start,
    markerFor('STATS').end,
    markerFor('CATEGORIES').start,
    markerFor('CATEGORIES').end,
    markerFor('LEARNING_PATHS').start,
    markerFor('LEARNING_PATHS').end,
    markerFor('CATALOG').start,
    markerFor('CATALOG').end,
  ].join('\n');

  it('renders all four sections with expected content', () => {
    const sections = buildReadmeSections(buildCatalog());
    expect(sections.STATS).toContain('**Entries:** 2');
    expect(sections.CATEGORIES).toContain('| Category | Entries | What you build |');
    expect(sections.LEARNING_PATHS).toContain('### From Parser to Query Engine');
    expect(sections.CATALOG).toContain('Aaa');
  });

  it('preserves prose and is idempotent', () => {
    const catalog = buildCatalog();
    const once = applyReadmeSections(template, catalog);
    const twice = applyReadmeSections(once, catalog);
    expect(once).toBe(twice);
    expect(once).toContain('# Project');
  });
});
