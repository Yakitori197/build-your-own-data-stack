# 0001. Structured YAML catalog validated with Zod

- Status: Accepted
- Date: 2026-07-27

## Context

The project curates learning resources. The obvious approach — a hand-maintained
list in the README — does not scale: it cannot be filtered, searched, or checked
for quality, and every edit risks silent mistakes (a broken URL, a duplicate, a
paid resource mislabelled as free).

We need the content to be **data**: machine-readable, queryable, and validated.

## Decision

Store content as YAML in `catalog/` — one file per entry — and validate it with a
[Zod](https://zod.dev/) schema plus a layer of cross-entry rules.

- YAML because it is pleasant to hand-edit and produces clean diffs.
- One file per entry so contributions touch a single file and merge cleanly.
- Zod because it gives us both runtime validation and inferred TypeScript types
  from one definition.
- A separate validation layer for rules Zod cannot express on its own (uniqueness
  across files, category existence, URL hygiene, plausibility).

## Consequences

- Adding a resource means adding a YAML file and running `catalog:validate`, not
  editing prose. This is a small learning curve for contributors, mitigated by
  [content-guidelines.md](../content-guidelines.md).
- The schema is the single source of truth for the shape of an entry; the site,
  the generator, and the feed all consume the same validated `Catalog`.
- Unknown fields are rejected, turning typos into loud validation errors.
