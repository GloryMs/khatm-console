# issuerClients

Issuer-client (M2M) management for the caller's own tenant (spec FS-2.7a
D10, KH-2.8.1/2.8.2-BE) — the console admin plane for the `khi_` API keys
connectors use to issue via `POST /api/v1/credentials`.

**Routes:** `/clients` (`ClientsPage`), self-gated on `key:manage` via
`RequireScope` (matches `KeyManagementPage`'s pattern) — deliberately
narrower than `tenant:admin` since the key is signing-grade material.

**Queries/mutations** (`hooks.ts`): `useIssuerClients` → `GET
/api/v1/issuer-clients`; `useCreateIssuerClient`, `useRotateIssuerClient`,
`useSuspendIssuerClient`, `useResumeIssuerClient`, `useRevokeIssuerClient`
— every mutation invalidates the list. A create/rotate result's one-time
`apiKey`/`holderHmacSecret` are held only in `ClientsPage`'s local state
(`RevealSecretsDialog`) and never enter the query cache.

The parent-organisation on-behalf-of view of a direct child's issuer
clients lives in `features/org` (`OrgChildPage`'s "Issuer clients" tab),
reusing this feature's `ClientList`/dialog components against
`org/api.ts`'s child-scoped endpoints.
