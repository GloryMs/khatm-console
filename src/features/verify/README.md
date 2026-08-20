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

The verdict uses the shared `StatusBadge` (success/danger tone); the presentation
textarea uses the shared `FormField`/`khatmInputClass`.

**Issuer lineage (spec FS-2.5 D4, KH-2.6a):** `VerifyResponse.issuerLineage`
is the issuing tenant's _ancestor_ chain only, nearest first — never the
issuing tenant's own name (the contract has no field for that; a verifier
only ever learns the tenant's slug from proofs, never its display name, per
P1). `null` when the credential's ref was unresolvable, `[]` when the
issuing tenant is a root — both render no lineage row at all (clean
absence). Each entry's `nameI18n` is localized normally; a missing name
falls back to the raw `slug`, `.ltr-embed`-wrapped like every other
technical identifier in this app, since Arabic UI + a Latin slug is the one
realistic mixed-bidi case here.
