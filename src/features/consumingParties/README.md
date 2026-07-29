# consumingParties

Admin-only plane for consuming parties: register, activate/suspend, manage
each party's schema allowlist (deny-by-default), and mint one-time-shown
API keys.

**Routes:** `/consumers` (`ConsumingPartiesPage`), self-gated with
`RequireScope('consumer:manage')` (spec FS-2.2 D2 — replaces the former
coarse `admin` scope; same pattern as `schemaManagement`).

**Queries / mutations:** `useConsumingParties` → `GET
/api/v1/admin/consuming-parties`; `useCreateConsumingParty`,
`useActivateConsumingParty`, `useSuspendConsumingParty`, `useAllowSchema`,
`useDisallowSchema`, `useMintApiKey` — every mutation invalidates the list.
Allowlist edits are diffed client-side (`allowlistDiff.ts`) into the
matching allow/disallow calls.

Minted keys are shown exactly once (`MintedKeyModal`) and never enter the
TanStack Query cache — only local component state, cleared on close.
