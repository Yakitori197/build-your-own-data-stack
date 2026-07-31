# Architecture Decision Records

Short records of significant, hard-to-reverse decisions and why we made them.
Each ADR is immutable once accepted; if a decision changes, add a new ADR that
supersedes the old one rather than editing history.

| ADR                                                        | Title                                            | Status   |
| ---------------------------------------------------------- | ------------------------------------------------ | -------- |
| [0001](0001-structured-catalog-with-zod.md)                | Structured YAML catalog validated with Zod       | Accepted |
| [0002](0002-astro-static-site-progressive-i18n.md)         | Astro static site with progressive bilingual UI  | Accepted |
| [0003](0003-deterministic-generation-with-markers.md)      | Deterministic generation into marker sections    | Accepted |
| [0004](0004-network-free-tests-scheduled-link-check.md)    | Network-free tests; scheduled real link checking | Accepted |

## Format

Each record uses: **Context** (the forces at play), **Decision** (what we chose),
and **Consequences** (the trade-offs we accept).
