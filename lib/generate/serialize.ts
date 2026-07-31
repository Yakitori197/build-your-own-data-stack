import { compareStrings } from '../util/sort';

/**
 * Recursively sort object keys so that serialisation is independent of the order
 * in which keys were inserted. Array order is preserved (it is meaningful).
 */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort(compareStrings)) {
      sorted[key] = sortKeysDeep(source[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Deterministic JSON: sorted keys, two-space indent, and a trailing newline.
 * Given identical input this always produces byte-identical output.
 */
export function stableStringify(value: unknown): string {
  return `${JSON.stringify(sortKeysDeep(value), null, 2)}\n`;
}
