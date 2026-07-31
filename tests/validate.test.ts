import { describe, expect, it } from 'vitest';
import { formatIssue, isRealCalendarDate, validateCatalog } from '../lib/catalog/validate';
import type { CatalogSources } from '../lib/catalog/types';
import { validCategory, validEntry, validLearningPath } from './fixtures';

function sources(overrides: Partial<CatalogSources> = {}): CatalogSources {
  return {
    categories: [validCategory()],
    learningPaths: [validLearningPath()],
    entries: [{ file: 'entries/build-a-toy-database.yaml', data: validEntry() }],
    ...overrides,
  };
}

const PAST_NOW = new Date('2026-07-15T00:00:00Z');

function codes(result: ReturnType<typeof validateCatalog>): string[] {
  return result.issues.map((issue) => issue.code);
}

describe('validateCatalog', () => {
  it('accepts a valid catalog and returns a sorted, assembled catalog', () => {
    const result = validateCatalog(
      sources({
        entries: [
          { file: 'entries/zzz.yaml', data: validEntry({ slug: 'zzz' }) },
          { file: 'entries/aaa.yaml', data: validEntry({ slug: 'aaa' }) },
        ],
        learningPaths: [validLearningPath({ steps: [{ slug: 'aaa' }, { slug: 'zzz' }] })],
      }),
      { now: PAST_NOW },
    );
    expect(result.ok).toBe(true);
    expect(result.catalog).not.toBeNull();
    expect(result.catalog?.entries.map((e) => e.slug)).toEqual(['aaa', 'zzz']);
  });

  it('returns a null catalog when there is any error', () => {
    const result = validateCatalog(
      sources({ entries: [{ file: 'entries/x.yaml', data: validEntry({ category: 'nope' }) }] }),
      { now: PAST_NOW },
    );
    expect(result.ok).toBe(false);
    expect(result.catalog).toBeNull();
  });

  it('flags duplicate entry slugs', () => {
    const result = validateCatalog(
      sources({
        entries: [
          { file: 'entries/build-a-toy-database.yaml', data: validEntry() },
          { file: 'entries/dupe.yaml', data: validEntry({ slug: 'build-a-toy-database' }) },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('duplicate-slug');
  });

  it('flags an unknown category', () => {
    const result = validateCatalog(
      sources({ entries: [{ file: 'entries/x.yaml', data: validEntry({ category: 'ghost' }) }] }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('unknown-category');
  });

  it('rejects non-https source urls', () => {
    const result = validateCatalog(
      sources({
        entries: [
          {
            file: 'entries/x.yaml',
            data: validEntry({ sourceUrl: 'http://example.com/x' }),
          },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('url-not-https');
  });

  it('rejects source urls with tracking params', () => {
    const result = validateCatalog(
      sources({
        entries: [
          {
            file: 'entries/x.yaml',
            data: validEntry({ sourceUrl: 'https://example.com/x?utm_source=n' }),
          },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('url-tracking-params');
  });

  it('rejects source urls that point at non-public hosts or addresses', () => {
    const host = validateCatalog(
      sources({
        entries: [
          { file: 'entries/x.yaml', data: validEntry({ sourceUrl: 'https://localhost/x' }) },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(host)).toContain('url-unsafe-host');

    const addr = validateCatalog(
      sources({
        entries: [
          {
            file: 'entries/y.yaml',
            data: validEntry({ slug: 'y', sourceUrl: 'https://10.0.0.1/x' }),
          },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(addr)).toContain('url-unsafe-address');
  });

  it('rejects source urls with credentials or that are unparseable', () => {
    const creds = validateCatalog(
      sources({
        entries: [
          { file: 'entries/x.yaml', data: validEntry({ sourceUrl: 'https://u:p@example.com/x' }) },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(creds)).toContain('url-unsafe-url');

    const bad = validateCatalog(
      sources({
        entries: [
          { file: 'entries/z.yaml', data: validEntry({ slug: 'z', sourceUrl: 'not a url' }) },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(bad)).toContain('url-unparseable');
  });

  it('validates an optional sourceRepoUrl', () => {
    const result = validateCatalog(
      sources({
        entries: [
          {
            file: 'entries/x.yaml',
            data: validEntry({ sourceRepoUrl: 'http://example.com/repo' }),
          },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('url-not-https');
  });

  it('flags unreasonable estimatedHours', () => {
    const result = validateCatalog(
      sources({ entries: [{ file: 'entries/x.yaml', data: validEntry({ estimatedHours: 500 }) }] }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('unreasonable-hours');
  });

  it('rejects impossible calendar dates', () => {
    const result = validateCatalog(
      sources({
        entries: [{ file: 'entries/x.yaml', data: validEntry({ lastVerified: '2026-02-30' }) }],
      }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('invalid-date');
  });

  it('warns (but does not fail) on future lastVerified dates', () => {
    const result = validateCatalog(
      sources({
        entries: [{ file: 'entries/x.yaml', data: validEntry({ lastVerified: '2099-01-01' }) }],
      }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('future-date');
    expect(result.ok).toBe(true);
  });

  it('warns when a filename does not match its slug', () => {
    const result = validateCatalog(
      sources({ entries: [{ file: 'entries/wrong-name.yaml', data: validEntry() }] }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('filename-slug-mismatch');
    expect(result.ok).toBe(true);
  });

  it('warns on duplicate tags and languages', () => {
    const result = validateCatalog(
      sources({
        entries: [
          {
            file: 'entries/build-a-toy-database.yaml',
            data: validEntry({ tags: ['a', 'a'], languages: ['Python', 'python'] }),
          },
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('duplicate-tag');
    expect(codes(result)).toContain('duplicate-language');
  });

  it('flags learning paths that reference unknown entries', () => {
    const result = validateCatalog(
      sources({
        learningPaths: [
          validLearningPath({ steps: [{ slug: 'build-a-toy-database' }, { slug: 'ghost' }] }),
        ],
      }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('unknown-step-reference');
  });

  it('flags duplicate learning path slugs', () => {
    const result = validateCatalog(
      sources({ learningPaths: [validLearningPath(), validLearningPath()] }),
      { now: PAST_NOW },
    );
    expect(codes(result)).toContain('duplicate-path-slug');
  });

  it('flags duplicate category ids', () => {
    const result = validateCatalog(sources({ categories: [validCategory(), validCategory()] }), {
      now: PAST_NOW,
    });
    expect(codes(result)).toContain('duplicate-category-id');
  });

  it('surfaces schema errors and skips the broken entry', () => {
    const result = validateCatalog(
      sources({ entries: [{ file: 'entries/x.yaml', data: { slug: 'x' } }] }),
      { now: PAST_NOW },
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code.startsWith('schema-'))).toBe(true);
  });

  it('reports malformed category and learning-path files without throwing', () => {
    const result = validateCatalog(
      { categories: 'nope', learningPaths: 42, entries: [] },
      { now: PAST_NOW },
    );
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('works without an explicit now (defaults to the current time)', () => {
    const result = validateCatalog(sources());
    expect(result.ok).toBe(true);
  });
});

describe('isRealCalendarDate', () => {
  it('accepts real dates', () => {
    expect(isRealCalendarDate('2026-07-27')).toBe(true);
    expect(isRealCalendarDate('2024-02-29')).toBe(true);
  });
  it('rejects impossible dates and bad formats', () => {
    expect(isRealCalendarDate('2026-02-30')).toBe(false);
    expect(isRealCalendarDate('2026-13-01')).toBe(false);
    expect(isRealCalendarDate('2023-02-29')).toBe(false);
    expect(isRealCalendarDate('not-a-date')).toBe(false);
  });
});

describe('formatIssue', () => {
  it('renders errors and warnings with scope', () => {
    expect(
      formatIssue({ level: 'error', code: 'x', message: 'boom', location: 'a.yaml', path: 'f' }),
    ).toContain('ERROR');
    expect(formatIssue({ level: 'warning', code: 'y', message: 'careful' })).toContain('WARN');
  });
});
