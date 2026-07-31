/**
 * Locale-independent ordering helpers.
 *
 * We deliberately avoid `String.prototype.localeCompare` because its result can
 * depend on the host's ICU data and locale, which would make generated output
 * non-deterministic across machines and CI runners. Catalog slugs and tags are
 * ASCII, so a plain code-unit comparison is both correct and reproducible.
 */

export function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function byKey<T>(key: (item: T) => string): (a: T, b: T) => number {
  return (a, b) => compareStrings(key(a), key(b));
}
