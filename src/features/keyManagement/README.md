# keyManagement

Signing-key lifecycle management for the caller's own tenant (spec FS-2.3,
session KH-2.3a-BE/C8) — moved off the dashboard onto its own page 2026-08-03
per Majd's request (see `docs/STATE.md`).

**Routes:** `/key-management` (`KeyManagementPage`), self-gated on `key:manage`
via `RequireScope` (matches `UsersPage`'s pattern) — no permission otherwise.

**Queries/mutations** (`hooks.ts`):

- `useSigningKeyStatuses(enabled)` → `GET /api/v1/admin/signing-keys` — every
  key's `kid`/`state`/`validFrom`/`validTo`. Same query key
  (`keyManagementKeys.list()`) as the dashboard's read-only
  `SigningKeysPanel` glance, so a rotate/retire here refreshes that panel too.
- `useRotateKey()` → `POST /api/v1/admin/signing-keys/rotate` — gated behind
  a `TypeToConfirmDialog` keyed off the current ACTIVE key's `kid` (no
  tenant-slug field exists anywhere in the contract for the caller's own
  session — see STATE.md for the substitution rationale). Since SESSION-C10,
  the dialog also offers an explicit provider choice
  (`RotateProviderChoice`) — inherit (default, sends no `provider`) or an
  explicit `SOFT`/`VAULT` (`RotateKeyRequest.provider`, the SOFT->Vault
  migration mechanism, spec FS-2.3 D6) — with a warning when the pick differs
  from the ACTIVE key's current provider.
- `useRetireKey()` → `POST /api/v1/admin/signing-keys/{kid}/retire` — staged
  through `RetireKeyDialog` for the `khatm.keys.min-retiring-age` guard
  (`KH-KEY-0422` explained inline; forcing needs a second, severe confirm).

The `provider` column (`KeyList.tsx`) has existed since KH-2.3b-BE landed
(SESSION-C8b, 2026-08-04) — `SigningKeyView.provider`/`RotateKeyResponse.provider`
are both in the contract, free-text (no server-side enum). `KNOWN_PROVIDERS`
(`components/KeyList.tsx`) is this console's own list of providers it can
offer explicitly, not a contract-derived enum.
