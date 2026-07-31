# Link checker

The catalog is full of external links. The link checker verifies they still
resolve — but carefully, so it never becomes a flaky gate on normal development.

Source: [`lib/linkcheck/`](../lib/linkcheck/) and
[`scripts/check-links.ts`](../scripts/check-links.ts).

## Behaviour

- **Timeout.** Each request is bounded by `AbortSignal.timeout` (default 15s in
  the CLI).
- **Bounded concurrency.** A fixed-size worker pool (default 6) checks many URLs
  at once without hammering any host or the local machine.
- **Retries with backoff.** Transient failures (network errors, timeouts, `5xx`,
  `429`) are retried; definitive failures like `404` are not.
- **Redirect handling.** Redirects are followed manually, counted, and capped
  (default 5) so redirect loops are detected instead of hanging.
- **Method fallback.** A `HEAD` request is tried first; if the server answers
  `405`/`501`, it falls back to `GET`.
- **User-Agent.** Requests send a descriptive `User-Agent`
  (`build-your-own-data-stack-link-checker/0.1`).

Results preserve input order and are summarised as `ok / total / broken`. The CLI
exits non-zero if anything is broken.

## Safety (SSRF protection)

Fetching arbitrary URLs is dangerous: a malicious or mistaken link could point at
an internal address and turn the checker into a server-side request forgery
(SSRF) vector. Before **every** request — and before following **every** redirect
target — the checker applies the shared public-URL policy in
[`lib/net/url-policy.ts`](../lib/net/url-policy.ts):

- HTTPS only; no `username`/`password`; no non-default port.
- Hostname must not be `localhost`, `*.localhost`, `.local`, or `.internal`.
- Only DNS hostnames are accepted; IPv4/IPv6 **IP-literal URLs are rejected**
  (`unsafe-address`), so SNI and certificate verification always apply to a real
  domain.
- The hostname is resolved **at connection time** by a custom `lookup` handed to
  `node:https.request`, and **all** A/AAAA results must be public. Private,
  loopback, link-local, unspecified, multicast, CGNAT, and other reserved
  IPv4/IPv6 ranges are rejected (see [`lib/net/ip.ts`](../lib/net/ip.ts)). Because
  the socket uses this resolver, there is no second, unvalidated DNS query, so a
  rebound address can never be connected to (no TOCTOU gap). The original
  hostname is kept for TLS SNI and certificate verification — we never dial a bare
  IP with verification disabled. The timeout covers DNS, connection, and response.
- A redirect that downgrades HTTPS→HTTP is rejected outright.

Failures use stable, machine-readable reasons: `unsafe-url`, `unsafe-host`,
`unsafe-address`, and `insecure-redirect`. These are never retried. URL
credentials, if ever present, are stripped before logging.

The DNS resolver and the transport are injectable, which is how the unit tests
cover the entire policy — every private address range, empty and erroring
resolutions, mixed public/private A/AAAA results, redirect downgrades, and
public→private redirects (asserting the socket never connects and that exactly one
DNS resolution happens) — without any real network access. The production
transport ([`lib/linkcheck/transport.ts`](../lib/linkcheck/transport.ts)) is a
thin `node:https.request` wrapper whose security-relevant options are built and
tested in `buildRequestOptions`.

## Running it

```bash
npm run links:check
```

This **uses the network** and is meant for manual runs and the scheduled GitHub
Action — not for the unit test suite.

## Why it is not in the unit tests

Unit tests must be fast and deterministic. A test that hits real websites would
fail whenever a third-party site is briefly down, rate-limits us, or changes a
redirect — noise that has nothing to do with our code.

Instead:

- The checker's **logic** is unit-tested with an injected in-memory transport and
  an injected DNS resolver (see [testing.md](testing.md)) — covering redirects,
  timeouts, retries, method fallback, concurrency, and the full SSRF policy
  (rebinding, public→private redirects, IP-literal rejection) with zero external
  traffic. The production `node:https` transport has its own offline regression
  tests in [`tests/transport.test.ts`](../tests/transport.test.ts).
- The checker's **real-world runs** happen in
  [`.github/workflows/link-check.yml`](../.github/workflows/link-check.yml),
  which runs on a schedule and on manual dispatch — never on every pull request.
