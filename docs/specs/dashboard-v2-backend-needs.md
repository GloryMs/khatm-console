# Dashboard v2 — backend data needs

> Written for khatm-platform's Claude Code session (paste the "Prompt" section below directly).
> khatm-console's Dashboard v2 (`/dashboard`, PR #11) has 4 panels shipped as real card shells
> with an honest `EmptyState` instead of fabricated numbers, per this repo's P1 no-fabrication
> rule — lifecycle chart, recent activity, needs-attention, top consuming parties. This doc is
> the result of reading the actual khatm-platform source (not guessing) to ground exactly what
> each one needs and where the real gaps are.

## What already exists (no backend work needed)

- **KPI cards + secondary stats**: `GET /api/v1/stats` (`shared.web.StatsController`,
  `shared.audit.AuditService#countActionsInWindow`) — a single-window `GROUP BY action`
  aggregate over `audit_log`. Session-only (`ScopeGuard.requireUserSession()`).
- **Signing keys panel**: `GET /.well-known/jwks.json` — `kid`/`kty` only (verified live), no
  status/expiry. See #4 below — the data to fix this already exists in the DB, just unexposed.

## What's needed — ready-to-paste prompt for khatm-platform's Claude Code

```
I need 4 new read endpoints on khatm-platform to back khatm-console's Dashboard v2, which
currently ships these panels as empty-state placeholders because no backend data exists for
them yet. I've read the relevant source myself first — this is grounded in real code, not a
guess. Please read docs/STATE.md and CLAUDE.md first per the usual protocol, then treat this as
the brief for a new WBS task (suggest KH-1.5.4, continuing KH-1.1.3/FS-1.5.3's stats numbering —
adjust if you track it differently) on branch feat/KH-1.5.4-dashboard-stats-v2. Per this repo's
own rule ("no spec → ask, don't invent"), please draft docs/specs/FS-1.5.4-dashboard-stats-v2.md
first (look at an existing spec like FS-1_2_1-claim-delivery.md for the template/decision-table
style this repo uses) and confirm the approach before implementing — I'd rather you push back or
ask questions than guess on the two open design points flagged below.

BACKGROUND — what already exists, so you don't have to rediscover it:
- `shared.audit.AuditLogEntry`/`AuditLogRepository` (package-private) already record every
  relevant event via `shared.audit.AuditAction`: CREDENTIAL_ISSUED, CREDENTIAL_CONSUMED,
  CREDENTIAL_REVOKED, CONSUME_SCHEMA_DENIED, CREDENTIAL_VERIFY_OK/FAILED, CLAIM_CODE_REDEEMED,
  KEY_ROTATED, etc. Each row has occurred_at, actor_type/actor_id, entity_ref, and a detail
  JSONB blob. `AuditService#countActionsInWindow` is the one existing read of this table.
- `key.domain.IssuerKey` already stores `state` (PENDING/ACTIVE/RETIRING/RETIRED), `validFrom`,
  `validTo` per signing key, fully populated by KeyLifecycleService — currently NOT exposed via
  any endpoint (JwksController only reads the raw public JWK for ACTIVE+RETIRING keys).
- `consumer.api.ConsumingPartyAdmin#list()`/`#get(id)` gives party identity (code + bilingual
  name) already — no usage/call-volume numbers.
- `rbac.security.SecurityConfig` is the single place authorization is wired — path constants +
  `.access(ScopeGuard.requireX(...))` per matcher, not per-controller annotations. New routes
  must be added there explicitly; nothing is protected by default.

### 1. Daily lifecycle breakdown (unblocks: lifecycle chart, and any future KPI trend/delta)
`GET /api/v1/stats/daily?from=&to=` — same actions `/api/v1/stats` already aggregates, but
grouped per day. Mechanical: new `AuditLogRepository` query (`GROUP BY
date_trunc('day', occurred_at), action`, same tenant/window filter as the existing
`countByActionInWindow`), a new `AuditService` method, a new controller method. Same guard as
`/api/v1/stats`. Note `SecurityConfig.STATS_PATH` is currently an exact match
(`"/api/v1/stats"`, no wildcard) — widen it to `/api/v1/stats/**` if you add a sub-path, and
double check nothing later in the matcher chain unintentionally starts matching it too.

### 2. Recent activity feed
`GET /api/v1/activity?limit=20&event=issued,consumed,revoked` (event filter optional) —
reverse-chronological individual events. Mechanical part: new `ORDER BY occurred_at DESC LIMIT`
query, a new AuditService-level method returning DTOs (not the entity — AuditLogEntry is
package-private on purpose), a new controller in shared.web alongside StatsController.

Two real open points here, not mechanical — please design rather than guess:

(a) `entity_ref` isn't display-ready — CREDENTIAL_ISSUED's is the credential `ref`, but
CREDENTIAL_CONSUMED/CREDENTIAL_REVOKED's is the credential `id` (UUID) per AuditAction's own
Javadoc. The feed should resolve a consistent human-readable ref for every row.

(b) Consuming-party attribution has no existing resolution path. CREDENTIAL_CONSUMED is
recorded with detail = null (credential.domain.AtomicConsumptionRecorder) — the only link to
"who consumed it" is audit_log.actor_id, which for an API_KEY actor is the api_key.id, not the
consuming_party.id. rbac.api currently only exposes CurrentActorResolver (resolves the CURRENT
request's actor, not an arbitrary historical actor_id) — there's no cross-module way today to
batch-resolve actor_id -> consuming_party for past rows. This likely needs a new small addition
to rbac.api (e.g. something that resolves a batch of api_key ids to their owner type/id), which
shared/consumer can then join against consumer.api.ConsumingPartyAdmin#get for the display
name. Please design this properly within the Modulith boundary rules (ModulithTest must still
pass) rather than reaching into rbac internals.

CONSUME_SCHEMA_DENIED is the one exception — it already carries detail.party (a raw party id)
directly, so denied-consume rows don't need the actor_id join.

### 3. Needs-attention / anomaly feed
`GET /api/v1/attention` — itemized, actionable anomalies (the console already shows raw counts
from /api/v1/stats, so this shouldn't just repeat those). Three starter item types, all
computable from data that already exists:
- Recent CONSUME_SCHEMA_DENIED events worth flagging (already has detail.party/detail.schemaId).
- Verification failure rate over a threshold vs. a rolling baseline (two
  countActionsInWindow-style calls, current window vs. prior window, no new storage).
- A signing key approaching rotation (needs #4 below: IssuerKey.validTo/state).
This one is the least mechanical of the four — what counts as "worth flagging," what threshold,
computed-on-read vs. a scheduled job — please treat it as a real design question in the spec
doc, not just implement a guess.

### 4. Signing-key status (nearly free — the data already exists)
`GET /api/v1/admin/signing-keys` (admin-scoped — put it under /api/v1/admin/** so it picks up
SecurityConfig's existing ADMIN_PATH wildcard, no new SecurityConfig entry needed). IssuerKey
already has every field needed (kid, state, validFrom, validTo), already populated by
KeyLifecycleService. This is a read-only query + DTO + controller over data that already exists
in the issuer_key table — analogous to JwksController, but for ALL states including RETIRED,
and returning the lifecycle fields instead of the raw JWK.
Response shape: { "keys": [ {"kid": "...", "state": "ACTIVE", "validFrom": "...", "validTo":
"..."} ] }

### Also needed (mechanical once #2's design question is resolved)
`GET /api/v1/stats/consuming-parties?from=&to=` — call volume + success rate per consuming
party for a window. Same actor_id -> party resolution gap as #2(b) blocks this too; solving it
once unblocks both.

GROUND RULES (this repo's own — please actually follow them, not just acknowledge):
- Spring Modulith boundaries are build-enforced (ModulithTest) — go through @NamedInterface api
  packages only; extend one if the lookup you need doesn't exist yet (see #2(b)).
- Every new endpoint: full OpenAPI annotations, an explicit SecurityConfig entry, EN+AR message
  keys for any human-readable text, Javadoc on the exposed API surface.
- docs/api/openapi.json is CI-published and is what khatm-console's `npm run contract:update`
  pulls from — nothing else needed console-side once these ship.
- Update docs/STATE.md at the end per the usual protocol.

Why this matters (context, not something to act on): khatm-console's dashboard already has all
4 panel shells built and wired — once any of #1-#4 exists, wiring the console side to real data
is a small, already-scoped follow-up (khatm-console's docs/STATE.md, "Next up" #5).
```

## Notes for whoever reviews the backend PR

- **#4 (signing-key status) is genuinely low-risk and nearly free** — it's exposing data that's
  already stored and populated, not computing anything new. Good first slice if these get split.
- **#2(b) (party attribution) is the one real architectural decision** — it needs a new
  cross-module lookup that doesn't exist today (`rbac.api` currently only resolves the _current_
  request's actor, not historical `audit_log.actor_id` values). This also blocks the
  "top consuming parties" panel, so solving it once unblocks two panels, not one.
- **#3 (needs-attention) is a product decision as much as an engineering one** — what counts as
  "worth flagging" and at what threshold isn't obvious from existing code; worth a short design
  conversation before implementation, not a mechanical CRUD-over-audit-log task like the others.
