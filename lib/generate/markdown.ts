/**
 * Markdown escaping for untrusted catalog text.
 *
 * Catalog content (titles, summaries, notes, labels) is treated as plain text
 * when rendered into the generated README. Escaping prevents a contributor from
 * injecting emphasis, code, links, images, raw HTML, headings, table breaks, or
 * other markup into the generated document. Normal English text, Traditional
 * Chinese, and ordinary punctuation (including parentheses) pass through
 * unchanged.
 */

/** Collapse any run of whitespace containing a line break into a single space. */
function collapseLineBreaks(text: string): string {
  return text.replace(/\s*[\r\n]+\s*/g, ' ');
}

// Inline metacharacters that can start emphasis (* _), code (`), links/images
// ([ ]), raw HTML/autolinks (< >), strikethrough (~), table cells (|), or an
// escape (\). Escaping these renders them as literal characters.
const INLINE_SPECIALS = /[\\`*_[\]<>~|]/g;

/**
 * Escape inline text so it renders verbatim. Safe for headings, list items,
 * paragraphs, table cells, and Markdown link text.
 */
export function escapeInline(text: string): string {
  return collapseLineBreaks(text).replace(INLINE_SPECIALS, (char) => `\\${char}`);
}

/** Alias documenting intent at table-cell call sites (pipes are handled above). */
export function escapeTableCell(text: string): string {
  return escapeInline(text);
}

/**
 * Escape a URL for use as a Markdown link destination `[text](dest)`. URLs are
 * already validated (HTTPS, no spaces), but may legitimately contain parentheses,
 * which would otherwise terminate the destination — so those are wrapped in the
 * angle-bracket form that permits them.
 */
export function escapeLinkDestination(url: string): string {
  const cleaned = url.replace(/[\r\n]/g, '');
  if (/[()\s<>]/.test(cleaned)) {
    return `<${cleaned.replace(/[<>]/g, (char) => `\\${char}`)}>`;
  }
  return cleaned;
}
