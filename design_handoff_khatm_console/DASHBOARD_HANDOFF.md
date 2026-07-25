# Handoff: Dashboard redesign (update only — tokens/components already implemented)

## Context
The design system (tokens.css, StatusBadge, Button, DataTable, form fields, etc.) is already implemented in the codebase from the prior handoff. This update is **Dashboard-only**: a full restyle/relayout of the existing screen, not a rebuild of the design system.

## Target location
`src/features/dashboard/components/` — update the existing Dashboard component(s) in place. Do not scaffold a new token or CSS-Modules setup; reuse what's already there.

## Data
Keep all existing data hooks/endpoints/state wiring as-is. This is restyle + relayout only — map existing data into the new layout/visuals, don't change data-fetching logic.

## What's new in this design (vs. current Dashboard)
- **App shell**: sidebar (240px, nav with active/badge states) + topbar (breadcrumb, page title, search with ⌘K hint, theme/lang segmented toggles, notification button, primary "Issue" action) + scrollable main — CSS Grid `side/top/main` areas.
- **Toolbar row**: headline + last-updated timestamp, range segmented control (7d/30d/90d/Custom), Export/Refresh buttons.
- **KPI cards** (Issued/Consumed/Verifications passed/Revoked): icon chip, big tabular-figure value + delta (success/muted), inline sparkline, footer caption. Left accent bar in the metric's status color.
- **Lifecycle bar chart**: stacked daily bars (issued/consumed/revoked) with gridlines and axis labels — placeholder-quality (literal divs); flag as a candidate for a real chart approach if the team wants one.
- **Signing-key health cards**: status dot, name, kid (coded/LTR), status label + expiry, thin rotation-progress bar.
- **Recent activity table**: tabs (All/Issued/Consumed/Revoked), same DataTable pattern (32px rows, coded refs, status badges).
- **Needs-attention panel**: colored glyph + title + body + CTA, for anomalies.
- **Top consuming parties**: initials chip, name, call count + success rate, inline progress bar.

Reuse the existing StatusBadge/Button/DataTable/coded-value components for the KPI deltas, activity table, and key/party rows — don't create parallel variants.

## Reference
Open `Dashboard.dc.html` in a browser for exact layout, spacing, and states (light/dark, EN/AR toggle included in the file for reference only — production Dashboard doesn't need its own toggle unless you want one for QA).

## Suggested prompt for Claude Code
> Update the existing Dashboard in `src/features/dashboard/components/` to match the new design in `design_handoff_khatm_console/Dashboard.dc.html` (open it in a browser as the visual reference) and `DASHBOARD_HANDOFF.md` for what's new. This is a restyle/relayout only — keep all existing data hooks and endpoints, just remap the data into the new layout. Reuse the already-implemented design-system tokens and components (StatusBadge, Button, DataTable, coded-value LTR treatment) from the prior handoff — don't recreate them. Build the new app shell (sidebar + topbar + main), KPI cards with sparklines, the lifecycle bar chart, signing-key health cards, recent activity table with tabs, needs-attention panel, and top consuming parties list, all via CSS Modules + logical properties, verified in both `dir="ltr"`/`dir="rtl"` and light/dark themes. Flag the bar chart and sparklines as placeholder-quality if you think a real charting approach would serve better.
