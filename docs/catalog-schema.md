# Catalog schema

The catalog lives in `catalog/`:

- `categories.yaml` — the fixed set of learning categories (bilingual metadata).
- `learning-paths.yaml` — ordered paths through the catalog.
- `entries/<slug>.yaml` — one file per resource.

The authoritative definition is [`lib/catalog/schema.ts`](../lib/catalog/schema.ts)
(Zod). This document explains it in prose.

## Entry fields

| Field              | Type     | Required | Rules                                                                    |
| ------------------ | -------- | -------- | ------------------------------------------------------------------------ |
| `slug`             | string   | yes      | kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`; unique; should match the filename |
| `title`            | string   | yes      | 1–120 characters                                                         |
| `summary`          | string   | yes      | 40–600 characters; **written in your own words**                         |
| `category`         | string   | yes      | one of the ids in `categories.yaml`                                      |
| `difficulty`       | enum     | yes      | `beginner` \| `intermediate` \| `advanced`                               |
| `languages`        | string[] | yes      | at least one; use `Language-agnostic` for conceptual resources           |
| `estimatedHours`   | number   | yes      | plausible; the validator flags anything outside `0.5`–`300`              |
| `sourceUrl`        | string   | yes      | HTTPS only; no tracking query parameters                                 |
| `sourceType`       | enum     | yes      | see below                                                                |
| `free`             | boolean  | yes      | `true` only if the resource is genuinely free to access                  |
| `openSource`       | boolean  | yes      | `true` if the accompanying code is open source                           |
| `prerequisites`    | string[] | yes      | may be empty                                                             |
| `learningOutcomes` | string[] | yes      | at least one                                                             |
| `tags`             | string[] | yes      | at least one; lower-case kebab tokens                                    |
| `lastVerified`     | string   | yes      | `YYYY-MM-DD`, a real date; a future date is a warning                    |
| `authors`          | string[] | no       | credit the original author(s)                                            |
| `sourceRepoUrl`    | string   | no       | HTTPS; a separate code repository if the source is an article/book       |

`sourceType` is one of: `tutorial`, `series`, `book`, `course`, `article`,
`paper`, `project`, `video`, `interactive`, `reference`.

Unknown fields are rejected, so a typo like `sumary` fails validation rather than
being silently ignored.

## Category fields (`categories.yaml`)

| Field     | Type          | Rules                                     |
| --------- | ------------- | ----------------------------------------- |
| `id`      | string        | kebab-case; unique; referenced by entries |
| `label`   | `{en, zh-TW}` | both languages required                   |
| `summary` | `{en, zh-TW}` | both languages required                   |

## Validation rules

Beyond the field types, [`lib/catalog/validate.ts`](../lib/catalog/validate.ts)
applies cross-cutting checks:

**Errors** (block `catalog:generate` and fail CI):

- `duplicate-slug` — two entries share a slug
- `unknown-category` — an entry references a category id that does not exist
- `duplicate-category-id` — two categories share an id
- `url-not-https` / `url-tracking-params` / `url-unparseable` — bad `sourceUrl`
  or `sourceRepoUrl`
- `unreasonable-hours` — `estimatedHours` outside `0.5`–`300`
- `invalid-date` — `lastVerified` is not a real calendar date
- `duplicate-path-slug` — two learning paths share a slug
- `unknown-step-reference` — a learning-path step points at a missing entry
- `schema-*` — any Zod schema violation

**Warnings** (reported, but do not fail the build):

- `filename-slug-mismatch` — `entries/<file>.yaml` name differs from `slug`
- `future-date` — `lastVerified` is in the future
- `duplicate-tag` / `duplicate-language` — repeated values within one entry

Run the checks with:

```bash
npm run catalog:validate
```
