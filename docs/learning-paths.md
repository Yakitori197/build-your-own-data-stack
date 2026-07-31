# Learning paths

A learning path is an ordered route through several catalog entries. It turns a
pile of good resources into a sequence a learner can actually follow.

Paths live in [`catalog/learning-paths.yaml`](../catalog/learning-paths.yaml).

## Fields

| Field        | Type     | Rules                                      |
| ------------ | -------- | ------------------------------------------ |
| `slug`       | string   | kebab-case; unique across paths            |
| `title`      | string   | 1–120 characters                           |
| `summary`    | string   | 40–600 characters                          |
| `difficulty` | enum     | `beginner` \| `intermediate` \| `advanced` |
| `steps`      | array    | at least two steps                         |
| `tags`       | string[] | at least one                               |

Each **step** has:

| Field  | Type   | Rules                                                  |
| ------ | ------ | ------------------------------------------------------ |
| `slug` | string | must reference an existing entry in `catalog/entries/` |
| `note` | string | optional; one line on why this step comes here         |

Every step's `slug` is validated against the catalog, so a path can never point
at a resource that does not exist.

## The three seed paths

1. **From File Parser to Query Engine** — parsing bytes → columnar formats →
   query planning → a small SQL engine.
2. **From Key-Value Store to Distributed Database** — a single-node store → an
   LSM engine → a networked server → consensus → a replicated, sharded store.
3. **From Event Log to Stream Processor** — the log abstraction → streaming
   concepts → log-centric architectures → a time-series store.

## Adding a path

1. Add a new item to `learning-paths.yaml` with a unique `slug`.
2. List at least two steps, each referencing an existing entry `slug`.
3. Add a short `note` to each step explaining its place in the sequence.
4. Run `npm run catalog:validate`, then `npm run catalog:generate` to refresh the
   README, then open a PR.
