# dashboard

Operations dashboard, restyled to the second design handoff
(`design_handoff_khatm_console/Dashboard.dc.html` + `DASHBOARD_HANDOFF.md`).

**Routes:** `/dashboard` (`DashboardPage`), any authenticated operator — also
the post-login landing page (`/` redirects here).

**Queries:** `useStats(windowDays)` → `GET /api/v1/stats` (7/30-day trailing
window, `staleTime`/`refetchInterval` both 60s + manual refresh) drives the 4
KPI cards and the 3-item secondary stats strip. `useSigningKeys()` →
`GET /.well-known/jwks.json` (5-minute refresh) drives the signing-keys
panel.

**Placeholders, by design:** the lifecycle chart, recent-activity table,
needs-attention panel, and top-consuming-parties panel have no backing API
data yet (no daily time series, no activity feed, no anomaly feed, no
per-party usage stats) and ship as their real card chrome with an
`EmptyState` body rather than fabricated numbers — this repo's P1
no-fabrication rule. See `docs/specs/dashboard-v2-backend-needs.md` for
exactly what each one needs from the platform.

**Export:** the toolbar's Export button is real — `csv.ts`'s `buildStatsCsv`
serializes the currently-displayed stats snapshot (window + all 7 counters)
client-side, no new endpoint.
