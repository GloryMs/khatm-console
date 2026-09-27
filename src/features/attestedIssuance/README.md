# attestedIssuance

The non-automated issuer portal (spec FS-2.4, session C9): scan → hash →
attest → issue, for tenants whose archive is paper/scanned rather than a
system of record. A dedicated flow, not a branch of `issuance` (session veto
V3) — `requires_attestation` schemas never appear in the standard `/issue` or
`/issue/bulk` pickers (`issuance/api.ts` filters them out); they only ever
issue here.

**Route:** `/issue/attested` (`AttestedIssuePage`), self-gated with
`RequireScope('issue')` — same scope as standard issuance, no new scope
(spec D8).

**Flow (`AttestedIssuePage`'s own step state, not `react-router`):** schema
pick (attested schemas only, `useAttestedSchemas`) → `ScanStep` (hash
client-side via `features/attestation`, file reference dropped immediately
after — veto V2) → `DetailsForm` (schema's other claim fields + the
request-level `attestation.note`; `doc_sha256` is locked to the computed
digest, never operator-typed) → `ReviewStep` (acknowledgment checkbox +
`TypeToConfirmDialog` keyed on the digest's first 8 hex chars) → issue + mint,
reusing `issuance`'s `useIssueAndMintCredential`.

No `api.ts` here — every network call (`getIssueSchema`, `issueCredential`,
`mintClaimCode`) is the exact one `issuance` already wraps; `hooks.ts` only
re-exports. `claimFields.ts` splits a schema's claims into the `doc_sha256`
convention field (FS-2.4 D3) and everything else; `request.ts` builds the
exact `IssueRequest` body, always injecting the computed digest and always
sending a (possibly empty) `attestation` object.

**`holderRef` (KH-2.8.2 veto V1-b, session C13a):** optional for this
human-operated flow — `DetailsForm` only shape-checks it when non-blank
(`@/lib/holderRef#isValidHolderRef`, `issue.holderRefInvalid`), and
`request.ts` normalizes (trim + lowercase) and omits it entirely from the
request when left blank, letting the platform generate one. `ReviewStep`
shows either the typed value or `issue.holderRefNotProvided`; the success
screen always shows `IssueResponse.holderRef` (generated or supplied) plus a
copy button, and now passes the raw thrown error to `ApiErrorBanner` (via
`TypeToConfirmDialog`'s `children` slot) instead of a pre-resolved string, so
`code`/`traceId` show for a rejected confirm (e.g. `KH-ISS-0400`) same as
every other error surface (work rule 3).

The D1 no-file-egress guarantee has its own test,
`attestation.no-file-egress.test.ts` — spies on `fetch` across a full
scan-to-issue run and asserts no request ever carries the file's bytes.
