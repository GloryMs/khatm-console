# components/ui

Shared, feature-agnostic UI:

- **App shell** — `AppShell`, `Sidebar`, `Topbar`.
- **Session chrome** — `UserChip`, `LanguageSwitcher`, `ThemeSwitcher` (light/dark
  toggle; mirrors `LanguageSwitcher`).
- **Design-system primitives** — `Button` (primary/secondary/ghost/danger variants),
  `StatusBadge` (pill + dot, one tone→color map for every status), shared
  `Table.module.css` (header on `--color-surface-2`, hover rows, `.codeCell` mono +
  tabular + forced-LTR), and the global `.khatm-input` / `.emptyState` classes in
  `src/styles/global.css`. Prefer these over re-declaring per-feature button/badge/
  table/input CSS.
- **App-wide error surfaces** — `ErrorBoundary`, `ApiErrorBanner`, `NoPermission`,
  `FullPageSpinner`.

Nothing here calls the API directly or knows about a specific feature — feature
components import from here, never the reverse. Tokens (palette, fonts, radii,
shadows, type scale, light + dark) live in `src/styles/tokens.css`; the active
theme is set on `<html data-theme>` by `src/theme`.
