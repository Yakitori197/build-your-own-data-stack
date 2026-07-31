import type { Catalog, Entry, LearningPath, LocalizedText } from '../catalog/types';
import { allLanguages, categoriesWithEntries, countEntriesByCategory } from '../catalog/query';

/** Version of the public feed format. Bump on breaking shape changes. */
export const FEED_VERSION = 1;

export interface FeedCategory {
  readonly id: string;
  readonly label: LocalizedText;
  readonly summary: LocalizedText;
  readonly entryCount: number;
}

export interface FeedCounts {
  readonly entries: number;
  readonly categories: number;
  readonly categoriesWithEntries: number;
  readonly learningPaths: number;
  readonly languages: number;
}

export interface Feed {
  readonly version: number;
  readonly generator: string;
  readonly counts: FeedCounts;
  readonly languages: string[];
  readonly categories: FeedCategory[];
  readonly entries: Entry[];
  readonly learningPaths: LearningPath[];
}

/**
 * Build the public JSON feed object from a validated catalog.
 *
 * The feed intentionally contains no wall-clock timestamp: given the same
 * catalog it is byte-for-byte reproducible. Per-resource freshness is tracked by
 * each entry's `lastVerified` field instead.
 */
export function buildFeed(catalog: Catalog): Feed {
  const counts = countEntriesByCategory(catalog);
  const languages = allLanguages(catalog);
  return {
    version: FEED_VERSION,
    generator: 'build-your-own-data-stack',
    counts: {
      entries: catalog.entries.length,
      categories: catalog.categories.length,
      categoriesWithEntries: categoriesWithEntries(catalog),
      learningPaths: catalog.learningPaths.length,
      languages: languages.length,
    },
    languages,
    categories: catalog.categories.map((category) => ({
      id: category.id,
      label: category.label,
      summary: category.summary,
      // countEntriesByCategory seeds every category id, so this is always defined.
      entryCount: counts.get(category.id)!,
    })),
    entries: catalog.entries,
    learningPaths: catalog.learningPaths,
  };
}
