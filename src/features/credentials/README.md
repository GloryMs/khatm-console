# credentials

Console-facing credential search (`/credentials`, any authenticated
operator) — proof/status metadata rows only, never claim content (P1).

Route: `/credentials`. Query: `useCredentialSearch(filters)` →
`GET /api/v1/credentials`, filters (ref/pseudoRef exact, schemaId, tri-state
revoked) AND-combined server-side, page size 20.

Each row's Revoke action deep-links to `/revoke?id=<id>`, which preloads
`RevokePage`'s lookup — closes the previous "know the id up front" gap.

`FilterBar` uses the shared `FormField`/`khatmInputClass`; `ResultsTable` renders
through the shared `DataTable` (compact, 32px rows) with an `EmptyState` for no
matches.
