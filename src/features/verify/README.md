# verify

Operator tool to verify an SD-JWT credential presentation against the platform.

**Routes:** `/verify` (`VerifyPage`), behind `RequireAuth` (any logged-in
operator — no scope gate; the public-verify story is a later, separate surface).

**Mutations:** `useVerifyPresentation` → `POST /api/v1/credentials/verify`.

The contract always returns HTTP 200 for a well-formed request — a domain
failure is `valid: false`, not an error envelope (only a blank `sdJwt` is a 400).
`VerifyResult` reads the optional status-list fields (`statusListChecked`,
`statusListVersion`, `statusListUri`) defensively: they are absent from the
current contract (KH-1.3 not yet merged) and render only when the server returns
them, so they never cause a crash.
