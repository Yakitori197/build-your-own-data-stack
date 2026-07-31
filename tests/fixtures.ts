/**
 * Test fixtures. Everything here uses fictional data and example.com URLs so
 * that unit tests never depend on real network resources or real catalog data.
 */

export function validEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug: 'build-a-toy-database',
    title: 'Build a Toy Database',
    summary:
      'A fictional, hands-on walkthrough of building a small database from scratch, covering storage and queries.',
    category: 'databases',
    difficulty: 'intermediate',
    languages: ['Python'],
    estimatedHours: 12,
    sourceUrl: 'https://example.com/build-a-toy-database',
    sourceType: 'tutorial',
    free: true,
    openSource: true,
    prerequisites: ['Comfort reading Python'],
    learningOutcomes: ['Understand page-based storage', 'Execute simple queries'],
    tags: ['databases', 'storage'],
    lastVerified: '2026-07-01',
    ...overrides,
  };
}

export function validCategory(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'databases',
    label: { en: 'Databases', 'zh-TW': '資料庫' },
    summary: {
      en: 'Assemble storage, indexes, and a query layer into a working database.',
      'zh-TW': '把儲存、索引與查詢層組裝成一個可運作的資料庫。',
    },
    ...overrides,
  };
}

export function validLearningPath(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    slug: 'from-parser-to-query-engine',
    title: 'From Parser to Query Engine',
    summary:
      'A fictional path that starts with parsing a file format and ends with a small query engine over it.',
    difficulty: 'intermediate',
    steps: [{ slug: 'build-a-toy-database' }, { slug: 'build-a-toy-database', note: 'Revisit' }],
    tags: ['databases'],
    ...overrides,
  };
}
