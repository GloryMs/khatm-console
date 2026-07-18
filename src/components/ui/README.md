# components/ui

Shared, feature-agnostic UI: app shell (`AppShell`, `Sidebar`, `Topbar`),
session chrome (`UserChip`, `LanguageSwitcher`), and the app-wide error
surfaces (`ErrorBoundary`, `ApiErrorBanner`, `NoPermission`,
`FullPageSpinner`).

Nothing here calls the API directly or knows about a specific feature —
feature components import from here, never the reverse.
