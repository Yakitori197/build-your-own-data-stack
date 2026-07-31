# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-27

Initial release.

### Added

- **Catalog** of 22 original, curated resources across 12 categories, plus 3
  ordered learning paths, stored as validated YAML in `catalog/`.
- **Schema and validation** (`lib/catalog`): a Zod schema plus cross-entry checks
  for duplicate slugs, unknown categories, non-HTTPS or tracking-laden URLs,
  implausible time estimates, invalid dates, and broken learning-path references.
- **Deterministic generation** (`lib/generate`, `scripts/generate.ts`): the
  public JSON feed at `public/api/catalog.json` and the marker-managed README
  sections, reproducible byte-for-byte.
- **Link checker** (`lib/linkcheck`, `scripts/check-links.ts`): timeout, bounded
  concurrency, retry with backoff, redirect capping, and `HEAD`→`GET` fallback;
  unit-tested against a local mock server.
- **Static site** (`src/`, Astro): home, filterable/searchable catalog, per-entry
  detail pages, and learning paths; bilingual (English + Traditional Chinese) UI,
  keyboard and screen-reader friendly, `prefers-reduced-motion` aware, with
  progress tracking stored only in `localStorage`.
- **Docs** (`docs/`) including architecture, schema, guidelines, pipelines,
  testing, accessibility, privacy/security, deployment, release process, roadmap,
  and Architecture Decision Records.
- **Automation**: CI on Ubuntu and Windows (lint, typecheck, tests + coverage,
  catalog validation, determinism check, build, `npm audit`), a scheduled/manual
  link-check workflow, issue and PR templates, and Dependabot.
