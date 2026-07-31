# 0003. Deterministic generation into marker sections

- Status: Accepted
- Date: 2026-07-27

## Context

Parts of the README (category tables, stats, the full listing) and a public JSON
feed should be derived from the catalog, not maintained by hand. But the README
also contains hand-written prose we must not clobber, and CI needs a way to prove
the generated artifacts are current.

## Decision

Generate the derived artifacts deterministically and constrain README edits to
marked regions.

- The generator's output is a pure function of the catalog: **no timestamps** or
  other wall-clock inputs, sorted keys in JSON, stable ASCII ordering. Running it
  twice yields byte-identical files.
- README edits happen only between `<!-- AUTOGEN:NAME:START -->` /
  `<!-- AUTOGEN:NAME:END -->` markers; prose outside is untouched. A missing
  marker is a hard error.
- CI runs the generator and then `git diff --exit-code` on the outputs.

## Consequences

- Contributors must run `catalog:generate` after changing the catalog; CI catches
  it if they forget.
- Per-resource freshness is tracked by each entry's `lastVerified` date instead of
  a global "generated at" timestamp, which keeps output reproducible.
- Generated files (`README.md`, `public/api/catalog.json`) are in
  `.prettierignore` so the formatter and the generator never conflict.
