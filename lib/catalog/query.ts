import type { Catalog, Entry } from './types';
import { compareStrings } from '../util/sort';

/** All programming languages used across entries, de-duplicated and sorted. */
export function allLanguages(catalog: Catalog): string[] {
  const languages = new Set<string>();
  for (const entry of catalog.entries) {
    for (const language of entry.languages) {
      languages.add(language);
    }
  }
  return [...languages].sort(compareStrings);
}

/** Map of category id -> number of entries (includes categories with zero). */
export function countEntriesByCategory(catalog: Catalog): Map<string, number> {
  const counts = new Map<string, number>();
  for (const category of catalog.categories) {
    counts.set(category.id, 0);
  }
  for (const entry of catalog.entries) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
  }
  return counts;
}

/** Entries belonging to a category, preserving the catalog's slug order. */
export function entriesForCategory(catalog: Catalog, categoryId: string): Entry[] {
  return catalog.entries.filter((entry) => entry.category === categoryId);
}

/** Lookup table from entry slug to entry. */
export function entryBySlug(catalog: Catalog): Map<string, Entry> {
  return new Map(catalog.entries.map((entry) => [entry.slug, entry]));
}

/** How many categories currently have at least one entry. */
export function categoriesWithEntries(catalog: Catalog): number {
  let total = 0;
  for (const count of countEntriesByCategory(catalog).values()) {
    if (count > 0) {
      total += 1;
    }
  }
  return total;
}
