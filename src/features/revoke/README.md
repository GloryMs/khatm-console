# revoke

Look up a credential by its UUID id, show its status summary, and revoke it via
a type-the-id-to-confirm destructive dialog.

**Routes:** `/revoke` (`RevokePage`), behind `RequireAuth` and gated by
`RequireScope('revoke')`.

**Queries / mutations:**

- `useCredential(id)` → `GET /api/v1/credentials/{id}` (`credentialsKeys.detail(id)`).
- `useRevokeCredential` → `POST /api/v1/credentials/{id}/revoke` (invalidates the
  detail query on success so the summary flips to "revoked" in place).

The contract looks credentials up by their **UUID `id`**, not their human-facing
`ref` (the controller parses `{id}` as a UUID). The confirm dialog therefore asks
the operator to retype that id. Not-found / already-revoked / forbidden outcomes
arrive as the platform's localized error envelope and render via the shared error
layer — never client-side re-worded.
