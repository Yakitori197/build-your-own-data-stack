# Documentation

Design and engineering notes for **build-your-own-data-stack**. The root
[`README.md`](../README.md) is the user-facing entry point; these documents go
deeper.

## Contents

| Document                                                 | What it covers                                            |
| -------------------------------------------------------- | --------------------------------------------------------- |
| [architecture.md](architecture.md)                       | How the pieces fit together and why                       |
| [catalog-schema.md](catalog-schema.md)                   | Every catalog field and validation rule                   |
| [content-guidelines.md](content-guidelines.md)           | What belongs in the catalog and how to write entries      |
| [learning-paths.md](learning-paths.md)                   | How learning paths work and how to add one                |
| [validation-pipeline.md](validation-pipeline.md)         | `catalog:validate` and `catalog:generate` in detail       |
| [link-checker.md](link-checker.md)                       | The link checker's design and when it runs                |
| [testing.md](testing.md)                                 | Test strategy, coverage targets, and staying network-free |
| [accessibility.md](accessibility.md)                     | Accessibility commitments and how they are met            |
| [privacy-and-security.md](privacy-and-security.md)       | Privacy stance and security practices                     |
| [deployment.md](deployment.md)                           | How to deploy the static site                             |
| [release-process.md](release-process.md)                 | Versioning and release steps                              |
| [roadmap.md](roadmap.md)                                 | What is planned (and explicitly not yet built)            |
| [decisions/](decisions/)                                 | Architecture Decision Records (ADRs)                      |

## Repository layout

```
catalog/            Structured content (YAML): categories, entries, learning paths
lib/                Core, framework-free TypeScript
  catalog/          Schema, loading, validation, queries
  generate/         Deterministic README + JSON feed generation
  linkcheck/        Network link checker (timeout, retry, concurrency)
  util/             Small shared helpers
scripts/            CLI entry points for the npm scripts
src/                The Astro site (pages, components, layouts, styles, client scripts)
tests/              Vitest unit tests (no network access)
public/             Static assets, including the generated api/catalog.json feed
docs/               You are here
```
