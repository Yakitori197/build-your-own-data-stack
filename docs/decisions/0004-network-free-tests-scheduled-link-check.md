# 0004. Network-free tests; scheduled real link checking

- Status: Accepted
- Date: 2026-07-27

## Context

The catalog points at many external sites, so we want to know when a link breaks.
But if the normal test suite made real HTTP requests, it would fail whenever a
third-party site was briefly down, rate-limited us, or tweaked a redirect — flaky
failures unrelated to our code.

## Decision

Separate the link checker's **logic** from its **real-world execution**.

- Unit tests exercise the checker against a local `node:http` mock server on an
  ephemeral port, covering redirects, timeouts, retries, `HEAD`→`GET` fallback,
  and concurrency — with zero external traffic.
- Real link checking runs only in a dedicated GitHub Action
  (`link-check.yml`) triggered on a schedule and by manual dispatch — never on
  every pull request.

## Consequences

- The everyday test suite is fast and deterministic; CI does not flake because of
  someone else's outage.
- Broken links are still caught, just on a cadence (scheduled) rather than
  blocking unrelated changes.
- The checker is written with an injectable `fetch` and `sleep`, which is what
  makes both the mock-server tests and the fast retry tests possible.
