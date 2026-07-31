import { describe, expect, it } from 'vitest';
import { escapeInline, escapeLinkDestination, escapeTableCell } from '../lib/generate/markdown';
import { validateCatalog } from '../lib/catalog/validate';
import type { Catalog } from '../lib/catalog/types';
import { buildReadmeSections } from '../lib/generate/readme';
import { validCategory, validEntry, validLearningPath } from './fixtures';

describe('escapeInline', () => {
  it('escapes markdown metacharacters', () => {
    expect(escapeInline('*x* _y_ `z` [a] <b> | ~c~ \\d')).toBe(
      '\\*x\\* \\_y\\_ \\`z\\` \\[a\\] \\<b\\> \\| \\~c\\~ \\\\d',
    );
  });

  it('collapses line breaks to a single space', () => {
    expect(escapeInline('line one\r\n  line two')).toBe('line one line two');
  });

  it('leaves ordinary English, Chinese, and punctuation untouched', () => {
    const text = 'Build a database (in Go), 從零開始！ 100% fun.';
    expect(escapeInline(text)).toBe(text);
  });

  it('escapeTableCell escapes pipes', () => {
    expect(escapeTableCell('a | b')).toBe('a \\| b');
  });
});

describe('escapeLinkDestination', () => {
  it('leaves clean URLs bare', () => {
    expect(escapeLinkDestination('https://example.com/a')).toBe('https://example.com/a');
  });

  it('wraps URLs containing parentheses in angle brackets', () => {
    expect(escapeLinkDestination('https://example.com/wiki/Foo_(bar)')).toBe(
      '<https://example.com/wiki/Foo_(bar)>',
    );
  });

  it('escapes angle brackets inside a wrapped destination', () => {
    expect(escapeLinkDestination('https://x.example/a<b>')).toBe('<https://x.example/a\\<b\\>>');
  });
});

function maliciousCatalog(): Catalog {
  const result = validateCatalog(
    {
      categories: [
        validCategory({
          id: 'databases',
          label: { en: 'D|B <x>', 'zh-TW': '資料庫' },
          summary: {
            en: 'Summary with | pipe and <b> tag included for escaping tests.',
            'zh-TW': '測試用摘要。',
          },
        }),
      ],
      learningPaths: [
        validLearningPath({
          steps: [{ slug: 'evil' }, { slug: 'parens', note: 'step <b> | note' }],
        }),
      ],
      entries: [
        {
          file: 'entries/evil.yaml',
          data: validEntry({
            slug: 'evil',
            category: 'databases',
            languages: ['Go'],
            title: 'Evil <script>x</script> [a](b) *bold* `code` | pipe',
            summary:
              'Malicious summary <img src=x> with `code`, | pipes, [links](x), and _emphasis_ to verify escaping.',
          }),
        },
        {
          file: 'entries/parens.yaml',
          data: validEntry({
            slug: 'parens',
            category: 'databases',
            languages: ['Go'],
            title: 'Parens Title',
            summary: 'A perfectly ordinary summary for a resource whose URL contains parentheses.',
            sourceUrl: 'https://example.com/wiki/Foo_(bar)',
          }),
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

describe('README generation escapes catalog content', () => {
  const sections = buildReadmeSections(maliciousCatalog());

  it('does not emit raw HTML from titles or summaries', () => {
    expect(sections.CATALOG).not.toContain('<script>');
    expect(sections.CATALOG).not.toContain('<img src=x>');
  });

  it('escapes emphasis, code, and link syntax in content', () => {
    expect(sections.CATALOG).toContain('\\`code\\`');
    expect(sections.CATALOG).toContain('\\*bold\\*');
    expect(sections.CATALOG).toContain('\\[a\\]');
  });

  it('escapes pipes so table structure cannot be broken', () => {
    expect(sections.CATEGORIES).toContain('D\\|B');
  });

  it('escapes learning-path notes', () => {
    expect(sections.LEARNING_PATHS).toContain('step \\<b\\> \\| note');
  });

  it('renders a legitimate URL with parentheses as a working link', () => {
    expect(sections.CATALOG).toContain('(<https://example.com/wiki/Foo_(bar)>)');
  });
});
