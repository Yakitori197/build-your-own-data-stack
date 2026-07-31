# 0002. Astro static site with progressive bilingual UI

- Status: Accepted
- Date: 2026-07-27

## Context

The site must be fast, static (no backend, no accounts, no tracking), accessible,
and bilingual (English + Traditional Chinese UI). Entry content is English by
policy, but the UI chrome must work in both languages.

## Decision

Build the site with **Astro** in static output mode, using **vanilla TypeScript**
for interactivity rather than a client framework.

For bilingual UI, render both languages into the HTML and swap the visible one at
runtime:

- Each UI string is emitted with `data-en` / `data-zh` attributes and its English
  text as the default content.
- A small client script swaps `textContent` (and input placeholders) and updates
  `<html lang>` when the reader toggles language; the choice is stored in
  `localStorage`.

## Consequences

- **Works without JavaScript.** With JS disabled, the site is a complete, usable,
  English page — good for accessibility and resilience.
- **No routing duplication.** A single set of pages serves both languages, unlike
  per-locale route trees.
- The trade-off is that both languages ship in the HTML (a little extra bytes) and
  the toggle only swaps leaf text nodes. For a site this size that is negligible.
- Avoiding a client framework keeps the dependency and runtime surface small and
  the bundle tiny.
