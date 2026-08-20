# org

`org:admin` plane (KH-2.6, spec FS-2.5): a parent tenant managing its _direct_
children only — never grandchildren (spec §7). Entity management, not content
— org:admin never reads a child's credentials, proofs, or keys.

**Routes:** `/org` (`OrgPage`, children list + suspend/activate + the
aggregated report) and `/org/children/:id` (`OrgChildPage`, a child's users +
read-only schemas, always showing the "acting on behalf of" banner), both
self-gated with `RequireScope('org:admin')`.

**Queries / mutations:** `useChildren` → `GET /api/v1/org/children`;
`useSuspendChild`/`useActivateChild` → `POST .../children/{id}/suspend|activate`
(suspend is type-to-confirm on the child's slug, activate is a plain confirm);
`useChildUsers`/`useCreateChildUser`/`useDisableChildUser`/
`useResetChildUserPassword` (no lock/unlock/edit-roles/TOTP-reset — the
contract only exposes list/create/disable/reset-password for a child's
users); `useChildSchemas` (read-only); `useOrgReports(window)` →
`GET /api/v1/org/reports` (transitive over the full descendant subtree, per
§7 — unlike every child-targeted mutation here, which stays direct-children-
only). `windows.ts`'s `computeOrgReportWindow` builds the three fixed
calendar presets (month/quarter/year, veto V2 — no free date-picker) in UTC,
not the browser's local timezone, so "start of period" is deterministic.

There is no single "get one child" endpoint — `OrgChildPage` resolves the
child's display name from the already-fetched `useChildren()` list by id.
