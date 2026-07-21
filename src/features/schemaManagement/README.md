# schemaManagement

Admin-only schema authoring: create/edit/publish/version/archive credential
schemas. Distinct from `features/schemas`, which stays the read-only,
any-operator catalog.

Routes: `/schemas/manage` (list), `/schemas/manage/new` (create),
`/schemas/manage/:id/edit` (DRAFT only), `/schemas/manage/:id/version` (from a
PUBLISHED source), `/schemas/manage/:id` (read-only, ARCHIVED view). All
gated behind `RequireScope('admin')`.

Queries/mutations: `useManagedSchemas` (all statuses), `useManagedSchema(id)`,
`useCreateSchema`, `useUpdateSchema`, `usePublishSchema`, `useArchiveSchema`,
`useCreateSchemaVersion` — every write invalidates the management list, the
`/schemas` catalog, and the Issue picker's published-schemas query.

Note: `ClaimFieldRequest` (the authoring contract) has no per-field
`required` flag, so the builder does not expose one — see STATE.md.
