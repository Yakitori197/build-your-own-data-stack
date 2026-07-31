# Testing

## Tooling

[Vitest](https://vitest.dev/) with the V8 coverage provider. Configuration is in
[`vitest.config.ts`](../vitest.config.ts).

```bash
npm test -- --run       # run once
npm test                # watch mode
npm run test:coverage   # run once with coverage + thresholds
```

## Principles

- **No network.** Tests never make real HTTP requests or open real sockets. HTTP
  behaviour (redirects, timeouts, retries, HEAD→GET fallback) is exercised with an
  injected in-memory transport, and the real `node:https` transport has its own
  fully-offline security regression tests driven by an injected DNS resolver — a
  rejected connection never opens a socket.
- **Only fictional data.** Fixtures use `example.com` URLs and invented content.
  No real catalog entry is required for a unit test to pass (though one
  integration test does load the real catalog to guard the shipped data).
- **Meaningful coverage.** We aim for high coverage of the core modules, but do
  not write assertions purely to touch lines. Unreachable defensive branches are
  left uncovered on purpose.

## Coverage targets

Coverage is measured on the core library (`lib/**`) and gated in
`vitest.config.ts`:

| Metric     | Threshold |
| ---------- | --------- |
| Statements | 90%       |
| Branches   | 90%       |
| Functions  | 90%       |
| Lines      | 90%       |

The Astro site and the thin CLI wrappers are validated by `astro build`,
`astro check`, and the browser rather than by unit coverage.

## What is tested

- **Schema** (`schema.test.ts`) — accepts valid records; rejects bad slugs,
  unknown keys, short summaries, empty required arrays, bad enums and dates.
- **URL hygiene** (`urls.test.ts`) — HTTPS enforcement and tracking-parameter
  detection.
- **Validation** (`validate.test.ts`) — every cross-entry rule and the assembled
  `Catalog`.
- **Generation** (`generate.test.ts`) — stable serialization, marker replacement,
  feed counts, and README idempotency.
- **Link checker** (`linkcheck.test.ts`) — HTTP behaviour via an injected
  in-memory transport (redirects, retries, HEAD→GET, timeouts, concurrency).
- **SSRF policy** (`ssrf.test.ts`) — the connection-time secure lookup, redirect
  re-validation, IP-literal rejection, and the DNS-rebinding defence.
- **Real transport** (`transport.test.ts`) — the production `node:https` wrapper,
  fully offline (private-IP refusal without a socket; stuck-lookup timeout).
- **Loading** (`load.test.ts`) — reads and validates the real shipped catalog and
  handles an invalid catalog.
- **Query/sort helpers** (`query.test.ts`, `sort.test.ts`).
