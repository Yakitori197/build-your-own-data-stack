/**
 * Marker-based section replacement.
 *
 * Generated content lives between HTML comment markers so that hand-written prose
 * in the same file is never touched. Example:
 *
 *   <!-- AUTOGEN:STATS:START -->
 *   ...generated...
 *   <!-- AUTOGEN:STATS:END -->
 */

export const AUTOGEN_SECTIONS = ['STATS', 'CATEGORIES', 'LEARNING_PATHS', 'CATALOG'] as const;
export type AutogenSection = (typeof AUTOGEN_SECTIONS)[number];

export function markerFor(name: string): { start: string; end: string } {
  return {
    start: `<!-- AUTOGEN:${name}:START -->`,
    end: `<!-- AUTOGEN:${name}:END -->`,
  };
}

export function hasSection(content: string, name: string): boolean {
  const { start, end } = markerFor(name);
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  return startIndex !== -1 && endIndex !== -1 && startIndex < endIndex;
}

/**
 * Replace the body between a section's markers, leaving everything else intact.
 * Throws when the markers are missing or out of order so mistakes fail loudly.
 */
export function replaceSection(content: string, name: string, body: string): string {
  const { start, end } = markerFor(name);
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing or malformed AUTOGEN markers for section "${name}".`);
  }
  const before = content.slice(0, startIndex + start.length);
  const after = content.slice(endIndex);
  return `${before}\n${body}\n${after}`;
}
