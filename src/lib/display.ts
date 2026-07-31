import type { Entry } from '../../lib/catalog/types';

/** Compact hours display: `12` for whole numbers, `1.5` otherwise. */
export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

/** Lower-cased haystack used by the client-side keyword search. */
export function searchText(entry: Entry): string {
  return [
    entry.title,
    entry.summary,
    entry.category,
    entry.languages.join(' '),
    entry.tags.join(' '),
    (entry.authors ?? []).join(' '),
  ]
    .join(' ')
    .toLowerCase();
}
