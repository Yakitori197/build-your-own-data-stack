# Architecture

## Goals

1. **Content is data, not prose.** Every resource is a structured record that can
   be validated, queried, filtered, and rendered many ways.
2. **Determinism.** Anything generated from the catalog (README sections, the
   JSON feed) is byte-for-byte reproducible, so CI can prove it is up to date.
3. **No runtime.** The published site is static HTML/CSS/JS — no server, no
   database, no accounts, no third-party calls.
4. **Testability.** Core logic is framework-free and unit-tested without touching
   the network.

## Layers

```
              catalog/*.yaml  (source of truth)
                     │
                     ▼
   lib/catalog  ─ schema (Zod) · load · validate · query
                     │
        ┌────────────┼─────────────────────────┐
        ▼            ▼                           ▼
  lib/generate   the Astro site (src/)     lib/linkcheck
  README + feed   reads catalog at build     network checker
        │            │                           │
        ▼            ▼                           ▼
   scripts/generate  dist/ (static site)    scripts/check-links
```

- **`lib/catalog`** is the heart. `schema.ts` defines the shape with Zod;
  `validate.ts` layers cross-entry rules (duplicate slugs, unknown categories,
  URL hygiene, plausibility) on top; `load.ts` reads YAML from disk and returns a
  validated `Catalog`; `query.ts` provides derived views.
- **`lib/generate`** turns a `Catalog` into a JSON feed and README section bodies.
  It has no wall-clock inputs, so output depends only on the catalog.
- **`lib/linkcheck`** verifies external links. It is isolated from the catalog
  logic and never runs during the unit tests.
- **`src/`** is the Astro site. Pages import `loadCatalog()` in their frontmatter
  (build time), so an invalid catalog fails the build. Interactivity (filtering,
  search, language toggle, progress) is vanilla TypeScript that progressively
  enhances server-rendered HTML.

## Why this shape

Keeping the core in plain TypeScript (no Astro imports) means the schema,
generator, and link checker can be unit-tested in isolation and reused by any
front end. The Astro site is a thin presentation layer over that core. See the
[decision records](decisions/) for the reasoning behind the bigger choices.

## Data flow at build time

1. `astro build` runs each page's frontmatter.
2. `loadCatalog()` reads `catalog/`, validates it, and throws on any error.
3. Pages render entirely from the returned `Catalog`.
4. `public/api/catalog.json` (generated earlier by `catalog:generate`) is copied
   into `dist/` as-is.

The site never fetches data at runtime; everything is baked in at build time.
