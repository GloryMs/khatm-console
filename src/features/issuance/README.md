# issuance

Issue screen for creating one credential from a published schema and handing the
one-time claim code to a wallet.

- Route: `/issue`, guarded by `RequireScope('issue')`.
- `api.ts` wraps generated contract calls only: schema list/detail, issue, and
  claim-code mint.
- `claimsDef.ts` parses `claimsDefJson` into `ClaimField[]` for `IssueForm`.
- `IssueForm.tsx` renders the holder reference, defaults, and dynamic claim
  fields. `holderRef` is optional (KH-2.8.2 veto V1-b): left blank, the
  platform generates one; if typed, it must be 64 hex characters
  (`@/lib/holderRef`) or the field shows `issue.holderRefInvalid`. Normalized
  (trimmed, lowercased) and omitted entirely from the request when blank —
  never sent as `""`. `IssuePage`'s success screen always shows
  `IssueResponse.holderRef` (generated or supplied) alongside the credential
  ref.
- Selective-disclosure badges use `SchemaDetail.sdFields`; required validation
  remains driven by `claims_def.required`.
- Schema defaults prefill max uses and ISO-8601 validity display minutes.
- Submit sequence: issue with picked `schemaCode`, then mint claim code by id.
- Success renders credential ref, one-time claim code, expiry, and QR v1.
- QR payload uses `qrPayload.ts`: exact `{v:1,api,code}` JSON plus
  `VITE_QR_API_BASE` localhost warning.
- Layout follows the design guide's two-column Issuance screen (`IssuePage.module.css`'s
  `.grid`/`.left`/`.right`): form left, result right (bg `--color-surface-2`, `EmptyState`
  until minted). The claim code renders via the shared `SecretReveal` (masked by default);
  `IssueForm` fields use the shared `FormField`/`khatmInputClass`.
