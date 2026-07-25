# dashboard

Operations dashboard, restyled to the design handoffs
(`design_handoff_khatm_console/Dashboard.dc.html` + `DASHBOARD_HANDOFF.md`),
fully wired to real data as of khatm-platform's KH-1.1.5-BE.

**Routes:** `/dashboard` (`DashboardPage`), any authenticated operator — also
the post-login landing page (`/` redirects here). The signing-keys panel is
admin-scoped (matches the backend endpoint) and shows an "admin required"
state for non-admin operators.

**Queries** (all `src/features/dashboard/hooks.ts`, 60s `staleTime`/
`refetchInterval` unless noted):

- `useStats(windowDays)` → `GET /api/v1/stats` — the 4 KPI cards' values and
  the 3-item secondary stats strip.
- `useDailyStats(windowDays)` → `GET /api/v1/stats/daily`, fetched over
  `windows.ts#computeComparisonWindow` (twice the selected window). One
  response feeds three things via `dailyStats.ts`'s pure helpers: the
  lifecycle chart's per-day bars, the KPI cards' sparkline, and their
  period-over-period delta (`splitDailyEntries`/`sumCounter`/
  `computeDeltaPercent`/`buildSparkline`/`buildChartDays`).
- `useActivity(params)` → `GET /api/v1/activity` — the recent-activity table;
  `event` param drives the All/Issued/Consumed/Revoked tabs.
- `useAttention()` → `GET /api/v1/attention` — the needs-attention panel.
  Only `SCHEMA_DENIED` has type-specific copy (`attention.ts`, verified live
  against the running platform); any other `type` renders through a safe
  generic fallback rather than assuming an unverified shape.
- `useConsumingPartyStats(windowDays)` → `GET /api/v1/stats/consuming-parties`
  — the top-consuming-parties panel, ranked by call volume.
- `useSigningKeyStatuses(enabled)` → `GET /api/v1/admin/signing-keys`
  (5-minute refresh, admin-scoped) — real `kid`/`state`/`validFrom`/
  `validTo`; `enabled` is wired to `hasScope('admin')` so a non-admin
  operator's dashboard never fires a request that can only 403.

**Export:** the toolbar's Export button is real — `csv.ts`'s `buildStatsCsv`
serializes the currently-displayed stats snapshot (window + all 7 counters)
client-side, no new endpoint.

**No remaining placeholders** — see `docs/specs/dashboard-v2-backend-needs.md`
for the research that grounded this wiring (real `khatm-platform` source,
live-verified response shapes) and `docs/STATE.md` for the delivery history.
