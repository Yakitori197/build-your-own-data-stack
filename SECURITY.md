# Security Policy

## Scope

This project is a **static website generated from structured data**. It has no
backend, no accounts, no database, and requires no API keys. As a result its
runtime attack surface is small. The most relevant concerns are:

- Vulnerabilities in build/tooling dependencies.
- A catalog link that has been hijacked or now points somewhere unsafe.
- Any accidental inclusion of a secret or of tracking/analytics code (there
  should be none).

## Reporting a vulnerability

Please report suspected vulnerabilities **privately**:

- Preferred: use GitHub's **"Report a vulnerability"** button under the
  repository's **Security** tab (private vulnerability reporting).
- Do **not** open a public issue for a security report.

Please include what you found, how to reproduce it, and its potential impact.
We aim to acknowledge reports promptly and to fix confirmed issues as quickly as
is practical, then disclose responsibly.

## Our practices

- `npm audit` and `npm audit --omit=dev` are expected to report **zero**
  vulnerabilities, and both run in CI.
- Dependency updates are automated via Dependabot.
- No secrets, tokens, or credentials are stored in this repository; examples and
  tests use only fictional data.
- External links open with `rel="noopener noreferrer"`, and catalog links are
  re-checked on a schedule.
- The link checker is hardened against SSRF (see below).

## Link safety (SSRF)

The link checker and catalog validation share one public-URL policy
([`lib/net/url-policy.ts`](lib/net/url-policy.ts)). A URL is only fetched when it:

- uses HTTPS,
- carries no `username`/`password`,
- uses no non-default port,
- has no `localhost`, `*.localhost`, `.local`, or `.internal` hostname,
- is a **DNS hostname, not a raw IP literal** — IPv4 and IPv6 literals are
  rejected outright (`unsafe-address`) so TLS SNI/certificate verification stays
  meaningful, and
- does not resolve to a private, loopback, link-local, unspecified, multicast,
  CGNAT, or otherwise non-public IPv4/IPv6 address.

DNS validation happens **at the moment of connection**, not as a separate
pre-flight step. Each request is built as a `node:https.request` with a custom
`lookup` (`createSecureLookup`) that resolves the hostname, requires **all**
A/AAAA results to be public, and hands only validated addresses to the socket.
Because this is the socket's own resolver, the transport performs no second,
unvalidated DNS query — closing the DNS-rebinding / TOCTOU gap where a checked
address could differ from the one actually connected to. The original hostname is
kept intact, so TLS SNI and certificate verification still use the real domain
(we never connect to a bare IP with verification disabled). The same guard
applies to the initial request, every redirect target, the HEAD→GET fallback, and
every retry; an HTTPS→HTTP downgrade is rejected; and the request timeout covers
DNS, connection, and response. Failures return stable, machine-readable reasons
(`unsafe-url`, `unsafe-host`, `unsafe-address`, `insecure-redirect`). The DNS
resolver and the transport are injectable, so the test suite exercises all of
this — including rebinding and public→private redirects — offline. URL
credentials are stripped before anything is logged.
