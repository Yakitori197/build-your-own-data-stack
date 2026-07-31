# Validation and generation pipeline

Two npm scripts turn the raw catalog into validated, published artifacts.

## `npm run catalog:validate`

Runs [`scripts/validate.ts`](../scripts/validate.ts):

1. Read `categories.yaml`, `learning-paths.yaml`, and every `entries/*.yaml`
   (in a stable, locale-independent filename order).
2. Parse each document against the Zod schema.
3. Apply cross-entry rules (see [catalog-schema.md](catalog-schema.md)).
4. Print every finding and exit non-zero if there are any **errors**.

It performs **no network access**, so it is fast and deterministic and runs on
every CI job.

## `npm run catalog:generate`

Runs [`scripts/generate.ts`](../scripts/generate.ts):

1. `loadCatalog()` — validates first and throws on any error, so generation never
   runs against a broken catalog.
2. Write `public/api/catalog.json` using a stable serializer (sorted keys,
   two-space indent, trailing newline).
3. Rewrite the marker-delimited sections of `README.md`.

### Determinism

Generated output depends **only** on the catalog. There are no timestamps or
other wall-clock inputs, so running the generator twice produces byte-identical
files. CI enforces this:

```bash
npm run catalog:generate
git diff --exit-code README.md public/api/catalog.json
```

If a contributor changed the catalog but forgot to regenerate, this fails.

### Marker sections

The generator only edits text between HTML comment markers in `README.md`:

```
<!-- AUTOGEN:STATS:START -->        ... <!-- AUTOGEN:STATS:END -->
<!-- AUTOGEN:CATEGORIES:START -->   ... <!-- AUTOGEN:CATEGORIES:END -->
<!-- AUTOGEN:LEARNING_PATHS:START --> ... <!-- AUTOGEN:LEARNING_PATHS:END -->
<!-- AUTOGEN:CATALOG:START -->      ... <!-- AUTOGEN:CATALOG:END -->
```

Everything outside the markers is hand-written prose and is never touched. If a
marker is missing or malformed, the generator throws rather than guessing.

Because `README.md` and `public/api/catalog.json` are generator-owned, they are
listed in `.prettierignore` so Prettier and the generator never fight over
formatting.
