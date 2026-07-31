# build-your-own-data-stack

**Learn data infrastructure by rebuilding it from first principles.**

An interactive, community-curated learning map for people who want to understand
databases, storage engines, query engines, message queues, and the rest of the
modern data stack — not by reading about them, but by building small versions of
them yourself.

Every entry points to a real, public, hands-on resource: a tutorial, an online
book, a university course, a paper, or an open-source teaching project. The
catalog is structured data, validated in CI, and rendered into a fast static
site.

> **Inspiration.** This project is inspired by the excellent
> [build-your-own-x](https://github.com/codecrafters-io/build-your-own-x) list
> and its "learn by rebuilding" philosophy. It is an independent, original work:
> the catalog data, summaries, source code, UI, and design here are our own, and
> reuse none of that project's text, code, images, or branding. See
> [Attribution](#attribution).

---

## Highlights

- **Structured catalog, not a wall of links.** Every resource is a validated
  YAML record with difficulty, languages, estimated hours, prerequisites, and
  learning outcomes.
- **Strict quality gates.** A schema plus cross-entry checks catch duplicate
  slugs, unknown categories, non-HTTPS or tracking-laden URLs, missing fields,
  and implausible time estimates.
- **Deterministic generation.** The category tables in this README and a public
  JSON feed are generated from the catalog and are byte-for-byte reproducible.
- **A real, accessible website.** Filter by category, difficulty, language,
  time, free, and open-source; search by keyword; track your own progress in
  `localStorage`. Bilingual UI (English + 繁體中文), keyboard-navigable, and
  respectful of `prefers-reduced-motion`.
- **Privacy by default.** No accounts, no backend, no analytics, no trackers,
  and no API keys. The site is fully static.

## Demo

The site is **not deployed yet**, so there is no live URL to link here. Run it
locally in under a minute:

```bash
npm ci
npm run dev
```

Then open the address printed in your terminal. When a maintainer deploys the
site, the link will be added to this section — see
[docs/deployment.md](docs/deployment.md).

## Quick start

```bash
# Node.js 22.13+ (LTS) or 24+. Check with: node --version
npm ci                     # install exactly what package-lock.json pins
npm run catalog:validate   # validate the catalog
npm run dev                # start the local site
npm run build              # produce the static site in dist/
```

## Catalog snapshot

<!-- AUTOGEN:STATS:START -->
- **Entries:** 22
- **Categories:** 15 (12 with at least one entry)
- **Learning paths:** 3
- **Languages covered:** C, C++, Go, Java, Kotlin, Language-agnostic, Python, Rust, SQL
<!-- AUTOGEN:STATS:END -->

### Categories

<!-- AUTOGEN:CATEGORIES:START -->
| Category | Entries | What you build |
| --- | --- | --- |
| File Formats & Parsers | 2 | Turn raw bytes into structured records by parsing CSV, JSON, and binary formats by hand. |
| Storage Engines | 3 | The layer that actually puts bytes on disk: log-structured merge trees, B-trees, and page management. |
| Indexes | 1 | Data structures that make lookups fast: hash indexes, B-trees, and LSM indexes. |
| Query Engines | 2 | Parse, plan, optimise, and execute queries over your data, from SQL text to a result set. |
| Databases | 3 | Assemble storage, indexes, transactions, and a query layer into a working database. |
| Caches | 1 | Keep hot data close with eviction policies, TTLs, and write strategies. |
| Message Queues | 1 | Decouple producers from consumers with durable logs, delivery guarantees, and offsets. |
| Stream Processing | 2 | Compute over unbounded data with windows, watermarks, state, and exactly-once semantics. |
| Workflow Orchestration | 0 | Schedule and coordinate multi-step pipelines with dependencies, retries, and backfills. |
| Data Quality | 0 | Assert what your data should look like with schema checks, constraints, and validation rules. |
| Data Observability | 0 | Detect freshness, volume, and distribution problems before your dashboards mislead you. |
| Search Engines | 1 | Build inverted indexes, tokenizers, and ranking to search text at speed. |
| Vector Databases | 1 | Store embeddings and find nearest neighbours with approximate search structures. |
| Data Warehouses | 1 | Columnar storage, vectorised execution, and analytics at scale over large datasets. |
| Distributed Systems | 4 | Replication, consensus, partitioning, and fault tolerance across many machines. |
<!-- AUTOGEN:CATEGORIES:END -->

## Learning paths

Curated, ordered routes through the catalog. Each step builds on the previous
one.

<!-- AUTOGEN:LEARNING_PATHS:START -->
### From File Parser to Query Engine

Start by turning bytes into structured data, then work up to planning and executing queries over it. A path from parsing to a working query engine.

_intermediate · 4 steps_

1. **[Crafting Interpreters](https://craftinginterpreters.com/)** — Learn to scan and parse text into a syntax tree.
2. **[Apache Parquet File Format](https://parquet.apache.org/docs/file-format/)** — See how a real columnar format lays out data on disk.
3. **[How Query Engines Work](https://howqueryengineswork.com/)** — Turn parsed queries into logical and physical plans.
4. **[Writing a SQL Database from Scratch](https://notes.eatonphil.com/database-basics.html)** — Put lexer, parser, and executor together over real tables.

### From Key-Value Store to Distributed Database

Begin with a single-node store, evolve it into a durable storage engine, then replicate it across machines with consensus. A path from one key to many nodes.

_advanced · 5 steps_

1. **[py-caskdb: A Bitcask-style Key-Value Store](https://github.com/avinassh/py-caskdb)** — Build a single-node, log-structured key-value store.
2. **[Mini-LSM: Build a Storage Engine in a Week](https://skyzh.github.io/mini-lsm/)** — Upgrade storage to an LSM tree with compaction.
3. **[Build Your Own Redis with C/C++](https://build-your-own.org/redis/)** — Add a network protocol and in-memory data structures.
4. **[Raft: Understandable Consensus](https://raft.github.io/)** — Learn the consensus algorithm that keeps replicas in sync.
5. **[MIT 6.824: Distributed Systems](https://pdos.csail.mit.edu/6.824/)** — Implement a replicated, sharded key-value store on Raft.

### From Event Log to Stream Processor

Treat an append-only log as the source of truth, then compute derived views over it as data keeps arriving. A path from logging events to processing streams.

_intermediate · 4 steps_

1. **[Apache Kafka: Design and the Commit Log](https://kafka.apache.org/documentation/#design)** — Understand the log as a unifying abstraction.
2. **[Streaming 101: The World Beyond Batch](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/)** — Learn windowing, event time, and watermarks.
3. **[Turning the Database Inside-Out](https://martin.kleppmann.com/2015/03/04/turning-the-database-inside-out.html)** — Reframe views and caches as stream transformations.
4. **[Writing a Time Series Database from Scratch](https://nakabonne.dev/posts/write-tsdb-from-scratch/)** — Store time-ordered data efficiently for querying.
<!-- AUTOGEN:LEARNING_PATHS:END -->

## The full catalog

<!-- AUTOGEN:CATALOG:START -->
### File Formats & Parsers

- **[Apache Parquet File Format](https://parquet.apache.org/docs/file-format/)** — The official specification for Parquet's columnar layout, covering row groups, column chunks, pages, encodings, and metadata, with enough detail to write your own reader or writer. _(advanced · ~6h · Language-agnostic · free · open source)_
- **[Crafting Interpreters](https://craftinginterpreters.com/)** — A complete, free book that builds two interpreters for a small language; its scanning and parsing chapters are a superb, practical grounding for writing any file-format or query parser. _(intermediate · ~60h · Java, C · free · open source)_

### Storage Engines

- **[Mini-LSM: Build a Storage Engine in a Week](https://skyzh.github.io/mini-lsm/)** — A guided tutorial that builds an LSM-tree storage engine in Rust from the ground up, including memtables, SSTables, compaction, bloom filters, and MVCC, with tests for each milestone. _(advanced · ~40h · Rust · free · open source)_
- **[py-caskdb: A Bitcask-style Key-Value Store](https://github.com/avinassh/py-caskdb)** — An educational project that implements a disk-based, log-structured key-value store in Python following the Bitcask design, with a small codebase and exercises to complete. _(beginner · ~8h · Python · free · open source)_
- **[Writing a Time Series Database from Scratch](https://nakabonne.dev/posts/write-tsdb-from-scratch/)** — A hands-on tutorial that builds a time-series database engine in Go from the ground up, covering an in-memory head block, partitioning by time, a write-ahead log for durability, and querying by labels. _(advanced · ~8h · Go · free · open source)_

### Indexes

- **[Use the Index, Luke!](https://use-the-index-luke.com/)** — A free web book that teaches how database indexes actually work by reasoning about B-tree structure, then shows how query patterns, ordering, and joins decide whether an index helps. _(beginner · ~10h · SQL · free)_

### Query Engines

- **[How Query Engines Work](https://howqueryengineswork.com/)** — A concise book, by a DataFusion co-creator, that builds a query engine step by step: data sources, logical plans, expression evaluation, physical operators, and a SQL front end. _(intermediate · ~25h · Kotlin · free · open source)_
- **[Writing a SQL Database from Scratch](https://notes.eatonphil.com/database-basics.html)** — A hands-on series that builds a tiny SQL engine in Go, with a lexer, a parser, and an in-memory executor for SELECT, INSERT, and CREATE, explaining each layer as it goes. _(intermediate · ~10h · Go · free · open source)_

### Databases

- **[Build Your Own Database From Scratch (Go)](https://build-your-own.org/database/)** — An online book that builds a persistent, copy-on-write B+tree database in Go, then layers a relational-style query interface and transactions on top. _(advanced · ~25h · Go · free)_
- **[CMU 15-445: Database Systems](https://15445.courses.cs.cmu.edu/)** — A university course whose projects have you implement the internals of a disk-based database, including a buffer pool, a B+tree index, query operators, and concurrency control, inside the BusTub teaching system. _(advanced · ~120h · C++ · free · open source)_
- **[Let's Build a Simple Database](https://cstack.github.io/db_tutorial/)** — A step-by-step series that grows a SQLite-style database in C, one commit at a time, from a REPL and pager to a B-tree stored on disk. _(intermediate · ~15h · C · free · open source)_

### Caches

- **[Build Your Own Redis with C/C++](https://build-your-own.org/redis/)** — An online book that recreates a Redis-like in-memory server from sockets up: an event loop, the RESP protocol, hash tables, sorted sets, and TTL-based key expiry. _(intermediate · ~20h · C, C++ · free)_

### Message Queues

- **[Apache Kafka: Design and the Commit Log](https://kafka.apache.org/documentation/#design)** — Kafka's design documentation explains the partitioned, append-only commit log at its core, including offsets, replication, and delivery guarantees, the foundation for building a durable message queue yourself. _(intermediate · ~4h · Language-agnostic · free · open source)_

### Stream Processing

- **[Streaming 101: The World Beyond Batch](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/)** — A foundational two-part essay that untangles streaming vocabulary, including event versus processing time, windowing, watermarks, and triggers, the concepts any stream processor must get right. _(intermediate · ~3h · Language-agnostic · free)_
- **[Turning the Database Inside-Out](https://martin.kleppmann.com/2015/03/04/turning-the-database-inside-out.html)** — A talk-turned-article that reframes materialized views, caches, and indexes as derived data kept in sync by an event log, the core idea behind log-based stream processing. _(intermediate · ~2h · Language-agnostic · free)_

### Search Engines

- **[Let's Build a Full-Text Search Engine](https://artem.krylysov.com/blog/2020/07/28/lets-build-a-full-text-search-engine/)** — A focused tutorial that indexes a large document set in Go by building an inverted index with tokenization, filtering, and boolean queries, small enough to read in one sitting. _(intermediate · ~5h · Go · free · open source)_

### Vector Databases

- **[HNSW: Hierarchical Navigable Small World Graphs](https://arxiv.org/abs/1603.09320)** — The paper introducing HNSW, the graph index behind most modern vector databases, a clear specification you can follow to implement fast approximate nearest-neighbor search. _(advanced · ~12h · Language-agnostic · free)_

### Data Warehouses

- **[CMU 15-721: Advanced Database Systems](https://15721.courses.cs.cmu.edu/)** — A course focused on the internals of modern analytical databases: columnar storage, vectorized and compiled execution, and query optimization, the building blocks of a data warehouse engine. _(advanced · ~60h · C++ · free)_

### Distributed Systems

- **[Designing Data-Intensive Applications](https://dataintensive.net/)** — A widely used reference that maps the whole landscape, from storage engines and replication to partitioning, transactions, and consensus, giving you the mental models to design and rebuild data systems. _(intermediate · ~40h · Language-agnostic · paid)_
- **[Gossip Glomers: Distributed Systems Challenges](https://fly.io/dist-sys/)** — A set of hands-on challenges built on the Maelstrom test harness where you implement broadcast, a grow-only counter, and a replicated log, then have your solutions stress-tested against failures. _(intermediate · ~20h · Go · free · open source)_
- **[MIT 6.824: Distributed Systems](https://pdos.csail.mit.edu/6.824/)** — A graduate course whose lab series has you build a fault-tolerant, replicated key-value store in Go, starting from MapReduce, through a full Raft implementation, to a sharded service. _(advanced · ~100h · Go · free)_
- **[Raft: Understandable Consensus](https://raft.github.io/)** — The Raft home page gathers the paper, talks, and an interactive visualization that walk through leader election, log replication, and safety, the pieces you need to implement consensus yourself. _(advanced · ~30h · Language-agnostic · free · open source)_
<!-- AUTOGEN:CATALOG:END -->

## Add a resource

1. Copy an existing file in [`catalog/entries/`](catalog/entries/) to
   `catalog/entries/<your-slug>.yaml`.
2. Fill in every field. The schema and rules are documented in
   [docs/catalog-schema.md](docs/catalog-schema.md) and
   [docs/content-guidelines.md](docs/content-guidelines.md).
3. Write your **own** one- or two-sentence summary — do not copy text from the
   source.
4. Run the checks below, then open a pull request.

Only real, public, verifiable resources are accepted. Paid resources are welcome
but must be marked `free: false`; never label paid content as free.

## Validate and generate

```bash
npm run catalog:validate   # schema + cross-entry checks (no network)
npm run catalog:generate   # regenerate README sections + public/api/catalog.json
npm run links:check        # verify every source link resolves (uses the network)
```

`catalog:generate` only rewrites content between the `AUTOGEN` markers in this
file; your prose is never touched. Its output is deterministic, and CI fails if a
commit forgot to run it.

### Public JSON feed

`npm run catalog:generate` writes a machine-readable feed to
[`public/api/catalog.json`](public/api/catalog.json), served at `/api/catalog.json`
on the built site. It carries no timestamp so it stays reproducible; per-resource
freshness lives in each entry's `lastVerified` date.

## Verify everything

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:coverage
npm run build
```

See [docs/testing.md](docs/testing.md) for how the test suite stays fast and
network-free.

## Privacy and security

- The deployed site has no analytics, advertising, or third-party trackers and
  loads no third-party scripts. Astro's optional build-time telemetry is also
  explicitly disabled in CI and local scripts (it never ran in a visitor's
  browser regardless). See [PRIVACY.md](PRIVACY.md).
- No accounts, cookies, or backend; progress is stored only in your browser's
  `localStorage` and never leaves your device.
- No API keys are required to build or run anything here.
- Only fictional data appears in examples and tests.

Details: [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Contributing

Contributions are very welcome — new entries, new learning paths, translations,
accessibility fixes, and tooling improvements. Start with
[CONTRIBUTING.md](CONTRIBUTING.md) and the
[content guidelines](docs/content-guidelines.md). By participating you agree to
the [Code of Conduct](CODE_OF_CONDUCT.md).

## Roadmap

A short, honest view of what is planned lives in
[docs/roadmap.md](docs/roadmap.md). Nothing on the roadmap is described above as
if it already exists.

## Documentation

Deep-dive design docs live in [`docs/`](docs/README.md): architecture, the
catalog schema, the validation pipeline, the link checker, testing,
accessibility, deployment, and the decision records in
[`docs/decisions/`](docs/decisions/).

## License

- **Code** (everything under `lib/`, `scripts/`, `src/`, and config) is licensed
  under the [MIT License](LICENSE).
- **Original catalog content** (the summaries, categories, and learning paths we
  wrote in `catalog/`) is licensed under
  [Creative Commons Attribution 4.0](CONTENT_LICENSE.md) (CC BY 4.0).
- **Linked third-party resources** remain the property of their respective
  authors. Listing a resource here does not relicense it, and nothing here should
  be read as a claim over anyone else's work.

## Attribution

Inspired by [build-your-own-x](https://github.com/codecrafters-io/build-your-own-x).
This repository shares that project's spirit of learning by rebuilding, but is an
independent work with its own catalog, code, and design.
