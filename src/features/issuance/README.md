# issuance

Issue screen for creating one credential from a published schema and handing the
one-time claim code to a wallet.

- Route: `/issue`, guarded by `RequireScope('issue')`.
- `api.ts` wraps generated contract calls only: schema list/detail, issue, and
  claim-code mint.
- `claimsDef.ts` parses `claimsDefJson` into `ClaimField[]` for `IssueForm`.
- `IssueForm.tsx` renders holder pseudo_ref, defaults, and dynamic claim fields.
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
