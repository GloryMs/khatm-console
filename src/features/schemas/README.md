# schemas

Read-only credential schema list — this session's proof-of-life screen: it
exercises cookie auth, the generated client, i18n, and the contract pipeline
end-to-end.

**Routes:** `/schemas` (`SchemasPage`), behind `RequireAuth`.

**Queries:** `useSchemas` → `GET /api/v1/schemas` (`schemasKeys.list()`).

Full schema authoring (create/version, KH-1.1.1) is a later session; this is
list-only.
