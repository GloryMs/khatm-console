# Dashboard v2 — backend data needs

> Written for the khatm-platform team. The console's dashboard redesign
> (`feat/dashboard-redesign`, `src/features/dashboard/`) implements every
> panel the design guide (`design_handoff_khatm_console/Dashboard.dc.html`)
> calls for, but four of them have no backing data today and ship as an
> empty-state placeholder card instead of fabricated numbers — this
> console's own "P1: proofs, not content" / no-fabrication rule (CLAUDE.md)
> forbids inventing figures for anything the API doesn't actually report.
> This doc lists what each placeholder needs to go live.

## What's already covered

- **KPI cards** (Issued / Consumed / Verifications passed / Revoked) and the
  **secondary stats strip** (claim codes redeemed / consume denied /
  verifications failed): `GET /api/v1/stats` already provides all seven
  counters for a `from`/`to` window. No change needed.
- **Signing keys panel**: `GET /.well-known/jwks.json` already provides
  `kid`/`kty` for every ACTIVE + RETIRING key. See "Nice to have" below for
  what would upgrade this panel specifically.

## 1. Daily lifecycle breakdown (blocks: lifecycle chart, KPI sparklines/deltas)

`GET /api/v1/stats` returns one aggregate per window; the design guide's
chart needs a **daily** series, and each KPI card's delta (`▲ 12.4% vs.
prev period`) and sparkline need it too.

Suggested shape — a new endpoint or an optional `?groupBy=day` on the
existing one:

```jsonc
GET /api/v1/stats?from=...&to=...&groupBy=day
{
  "window": { "from": "...", "to": "..." },
  "days": [
    { "date": "2026-07-01", "counters": { "issued": 42, "consumed": 30, "revoked": 1, ... } },
    ...
  ]
}
```

A previous-period aggregate (same span, immediately prior) would additionally
unblock the KPI cards' `vs. prev period` delta without a full time series, if
the daily breakdown isn't prioritized first.

## 2. Recent activity feed (blocks: recent activity table)

A paginated, reverse-chronological feed of individual lifecycle events —
issued / claim redeemed / consumed / verified / consume denied / revoked —
each with enough to render one row:

```jsonc
GET /api/v1/activity?limit=20&event=issued,consumed,revoked  // event filter optional, for the tabs
{
  "items": [
    { "ref": "KHT-9F3A-2C71", "event": "issued", "consumingParty": "Ministry of Interior", "at": "2026-07-25T14:02:00Z" },
    ...
  ]
}
```

Almost certainly a read model over the existing audit log — the platform
already logs every one of these events (used to compute `/api/v1/stats`
today).

## 3. Needs-attention / anomaly feed (blocks: needs-attention panel)

Itemized, actionable anomalies — not raw counts (the console already shows
those in the secondary stats strip). The design guide's three example items:

- A consume denial worth flagging (e.g. against a suspended/invalid key).
- Verification failure rate over a threshold vs. a rolling baseline.
- A signing key approaching rotation (needs field 4 below to exist at all).

```jsonc
GET /api/v1/attention
{
  "items": [
    { "type": "consume_denied", "title": "...", "body": "...", "ctaHref": "..." },
    ...
  ]
}
```

This is the least trivial of the four — it implies either server-side
threshold/anomaly logic or a documented client-side rule set the console
could compute from raw data if the platform exposes it instead (e.g. a
per-party denial count and a verification-failure-rate-with-baseline
endpoint, letting the console decide what's "attention-worthy"). Worth a
design conversation before building, not just an API stub.

## 4. Per-consuming-party usage stats (blocks: top consuming parties)

Call volume and success rate per consuming party, for a given window. The
`/consumers` admin list already has party identity (name, code) but no
usage numbers at all.

```jsonc
GET /api/v1/stats/consuming-parties?from=...&to=...
{
  "parties": [
    { "partyId": "...", "name_i18n": { "en": "...", "ar": "..." }, "calls": 2410, "successRate": 0.998 },
    ...
  ]
}
```

## Nice to have: signing-key status/expiry

`/.well-known/jwks.json` is a standard JWK Set (no status/expiry/rotation
fields — verified against the live local stack, single key returned:
`{kty, kid, crv, x, y}` only). The console's "Key management UI (rotation
status, JWKS view)" is already an open roadmap item (CLAUDE.md scope map) —
whenever that lands, an admin-only endpoint exposing per-`kid` status
(ACTIVE/RETIRING/RETIRED), activation/expiry dates, and rotation progress
would let the signing-keys panel show the status label, expiry, and
progress bar the design guide mocks, instead of just "a kid is published."
