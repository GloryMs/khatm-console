# dashboard

Pilot-metrics counters (KH-1.5.3): lifecycle counts (issued, claims redeemed,
consumed, verifications passed) and failure counts (revoked, consume denied,
verifications failed) over a 7- or 30-day trailing window.

**Routes:** `/dashboard` (`DashboardPage`), any authenticated operator — also
the post-login landing page (`/` redirects here).

**Queries:** `useStats(windowDays)` → `GET /api/v1/stats`, `staleTime` and
`refetchInterval` both 60s, plus a manual refresh button. Every counter
renders defensively as `0` when the contract marks it optional or the
platform omits it — never crashes.
