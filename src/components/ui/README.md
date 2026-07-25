# components/ui

Shared, feature-agnostic UI:

- **App shell** — `AppShell`, `Sidebar`, `Topbar`.
- **Session chrome** — `UserChip`, `LanguageSwitcher`, `ThemeSwitcher` (light/dark
  toggle; mirrors `LanguageSwitcher`).
- **Design-system primitives** — `Button` (primary/secondary/ghost/danger variants),
  `StatusBadge` (pill + dot, one tone→color map for every status), `DataTable`
  (compact, 32px rows via `--row-height`, `code` columns forced mono/LTR),
  `FormField` (+ `khatmInputClass()` helper — label/badge/help/error/valid shell
  around a control you register yourself), `SecretReveal` (the shown-once pattern
  for claim codes and API keys: masked by default, reveal/hide, optional copy),
  `EmptyState` (dashed card, seal glyph, title/body/action), `Banner` (tinted
  alert with a tone icon) and `Toast` (floating confirmation), plus shared
  `Table.module.css` (older per-feature tables not yet migrated to `DataTable`)
  and the global `.khatm-input` / `.emptyState` classes in `src/styles/global.css`.
  Prefer these over re-declaring per-feature button/badge/table/input CSS.
- **App-wide error surfaces** — `ErrorBoundary`, `ApiErrorBanner` (wraps `Banner`),
  `NoPermission`, `FullPageSpinner`.

Nothing here calls the API directly or knows about a specific feature — feature
components import from here, never the reverse. Tokens (palette, fonts, radii,
shadows, type scale, light + dark) live in `src/styles/tokens.css`; the active
theme is set on `<html data-theme>` by `src/theme`.
