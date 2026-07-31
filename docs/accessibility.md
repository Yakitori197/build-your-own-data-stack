# Accessibility

Accessibility is a requirement, not an afterthought. The site aims to meet WCAG
2.1 AA in spirit and is built to be usable without a mouse, without JavaScript,
and with a screen reader.

## What is in place

- **Semantic HTML.** Landmarks (`header`/`banner`, `nav`, `main`, `footer`),
  a single `h1` per page, ordered heading levels, real `ul`/`ol` lists, and
  native `button`, `a`, `input`, and `select` controls.
- **Keyboard support.** Every interactive element is a native control, so tab
  order and activation work out of the box. A **skip link** jumps to `#main`.
- **Visible focus.** A strong `:focus-visible` outline is defined globally and
  never removed.
- **State, not just colour.** Difficulty badges pair a colour swatch with a text
  label. The progress toggle uses `aria-pressed`. The language buttons use
  `aria-pressed`. Nothing relies on colour alone.
- **Colour contrast.** The light and dark palettes are chosen for AA-level text
  contrast, and `<meta name="color-scheme">` plus `prefers-color-scheme` respect
  the reader's system theme.
- **Reduced motion.** A `prefers-reduced-motion: reduce` block disables
  transitions, animations, and smooth scrolling.
- **Live results.** The catalog's result count is in an `aria-live="polite"`
  region so filtering announces how many resources match.
- **Language.** The `<html lang>` attribute is set (`en` or `zh-Hant`) and updates
  when the reader switches languages.

## Works without JavaScript

The site is server-rendered. With JavaScript disabled you still get a complete,
navigable, English-language site with every resource listed and linked. The
language toggle, live filtering, and progress tracking are progressive
enhancements layered on top.

## Testing it yourself

- Tab through each page; confirm focus is always visible and ordered.
- Toggle your OS between light/dark and reduced-motion; confirm the site follows.
- Run a browser accessibility audit (e.g. the built-in Lighthouse or axe
  DevTools) against `npm run build && npm run preview`.

Accessibility gaps are treated as bugs — please file an issue.
