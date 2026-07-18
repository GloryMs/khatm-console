# auth

Console session: login, logout, `me` bootstrap, and route/scope gates.

**Routes:** `/login` (`LoginPage`).

**Queries/mutations:** none via TanStack Query — session state lives in
`AuthProvider` (React context), refetched explicitly via `login`/`logout`,
since it gates routing rather than rendering a list/detail view.

**Exports used elsewhere:** `AuthProvider`, `useAuth`, `RequireAuth` (route
guard), `RequireScope` (scope gate, used by C1+ feature screens).

**Cross-cutting:** reacts to `authBridge`'s unauthorized event (see
`src/auth/authBridge.ts`) so an expired session mid-app drops to `/login`.
