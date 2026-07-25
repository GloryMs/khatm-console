# Handoff: Khatm Console Design System

## Overview
Visual identity + component system for khatm-console (the Khatm management console — platform admins and tenant operators). Covers tokens, typography, core UI patterns, and two fully-worked screens (Issuance — single, Credential search/verify/revoke).

## About the Design Files
The bundled `.dc.html` file is an **HTML design reference** — a live prototype demonstrating look, states, and behavior (including a working light/dark toggle and EN/AR RTL toggle). It is NOT production code and must not be copied verbatim. Your task: **recreate this design in the real khatm-console codebase**, per its existing constraints:
- CSS Modules + design tokens only, **logical properties** (`margin-inline-start`, not `margin-left`) — no Tailwind, no CSS-in-JS, no component-library skin.
- Function components only, no new state/animation libraries.
- Every screen must render correctly in both `<html dir="ltr">` and `<html dir="rtl">` from the same layout/component code — do not fork layouts per language.
- Theme switching via a `data-theme="dark"` attribute on `<html>` (or a wrapping element) — see tokens.css.

## Fidelity
**High-fidelity.** Tokens, colors, type sizes, spacing, radii, and the two mocked screens are final — implement pixel-close using CSS Modules driven by the tokens below. Where the prototype uses inline styles (an authoring artifact of the design tool), translate to CSS Module classes referencing `var(--token)`.

## Files in this bundle
- `tokens.css` — paste into `src/styles/tokens.css` as-is (or merge into your existing token file). Defines `:root` (light) and `[data-theme="dark"]` overrides.
- `Khatm Console Design System.dc.html` — open in a browser (any static server, or directly) for the interactive reference: theme toggle, language toggle (top-right), table-density and primary-hue tweaks. Use it as the visual source of truth alongside this README.

## Design Tokens
See `tokens.css` for exact values. Groups:
- **Base**: `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`, `--color-border-strong`, `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-focus`.
- **Brand (primary, green)**: `--color-primary`, `--color-primary-hover`, `--color-primary-contrast`, `--color-primary-tint`. Base hue 158 (oklch) — verdigris green. Chosen per stakeholder preference for green as primary.
- **Semantic/status**: `--color-success[-tint]`, `--color-info[-tint]`, `--color-warning[-tint]`, `--color-danger[-tint]`, `--color-neutral[-tint]`. Map to credential lifecycle: success→Issued, info→Consumed, danger→Revoked/Failed, warning→Pending.
- **Type**: `--font-sans` (Latin/UI, web-safe: system-ui/Segoe UI/Roboto/Helvetica/Arial), `--font-arabic` (Segoe UI/Tahoma/Geeza Pro/Noto Kufi Arabic/Noto Naskh Arabic), `--font-mono` (ui-monospace/SF Mono/Cascadia Mono/Consolas). No webfonts loaded — required for air-gapped tenant deployments. Scale: `--fs-xs` 11 / `--fs-sm` 12 / `--fs-body` 13.5 / `--fs-h3` 15 / `--fs-h2` 18 / `--fs-h1` 22 / `--fs-display` 32.
- **Shape/spacing**: `--radius-sm/--radius/--radius-lg/--radius-pill`, `--space-1..8`, `--row-height` (32px compact table row; use 44px for a "comfortable" density variant if you build a toggle).
- **Elevation**: `--shadow`, `--shadow-lg` (used sparingly — only on toasts and the shown-once secret card, not on every panel).

## Language / RTL rule
Body text follows `dir` from `<html>`. **Coded values** (credential refs, ids, key fragments, dates in mono) must ALWAYS render LTR and bidi-isolated regardless of page direction:
```css
.codeValue {
  direction: ltr;
  unicode-bidi: isolate;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```
Apply this class to: credential refs (`KHT-9F3A-2C71`), claim codes, API keys, dates in tables, JWKS fragments (future screen).

## Core component patterns

### Status badge/pill
Pill, `border-radius: var(--radius-pill)`, `padding: 2px 9-12px`, `font-size: 11-12px`, `font-weight: 600`, a small 6-7px dot + label, background = `-tint` token, text/dot = base status token. Variants: Issued(success), Consumed(info), Revoked(danger), Failed(danger), Pending(warning). Same pattern reused for generic semantic badges (Success/Warning/Info/Neutral/Danger).

### Buttons
4 kinds, all `border-radius: var(--radius)`, `font-size: 13px`, `font-weight: 600`, `padding: 9px 18px` (14px for ghost):
- Primary: bg `--color-primary`, text `--color-primary-contrast`, hover `--color-primary-hover`.
- Secondary: bg `--color-surface`, border `--color-border-strong`, hover bg `--color-surface-2`.
- Ghost: transparent, text `--color-primary`, hover bg `--color-primary-tint`.
- Danger: bg `--color-danger`, text `#fff`, hover `filter: brightness(.93)`.

### Data table (compact)
`border: 1px solid var(--color-border)`, `border-radius: var(--radius-lg)`, container clips overflow. Header row bg `--color-surface-2`, `font-weight:600`, `color: var(--color-text-muted)` (sortable column active state: `color: var(--color-text)` + a small ▾/▲ indicator in `--color-primary`). Body rows `height: var(--row-height)` (32px), hover bg `--color-surface-2`, cell border-block-end `1px solid var(--color-border)`. Ref/date columns use the coded-value treatment above.

### Form fields
`padding: 9px 11px`, `border: 1px solid var(--color-border-strong)`, `border-radius: var(--radius)`. States: focus → border `--color-focus` + `box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-focus) 22%, transparent)`; error → border+label+helper text in `--color-danger`, background `--color-danger-tint`; valid → border+label+helper in `--color-success` with a ✓ prefix. Selective-disclosure claim fields get a small pill badge next to the label (info-tint).

### Shown-once secret reveal (claim codes, API keys)
Card: `border: 1px solid var(--color-border)`, `border-radius: var(--radius-lg)`, header row with label + a "Shown once" warning-tint pill. Value in a `<code>` box: dashed border (`1px dashed var(--color-border-strong)`), bg `--color-surface-2`, monospace, coded-value LTR treatment, masked by default (`•••• ••••`) with a Reveal/Hide toggle button. Helper caption below: "Stored nowhere in plaintext — shown once." No copy-to-clipboard was mocked; add if useful, same pattern.

### Empty state
Dashed border card (`1px dashed var(--color-border-strong)`), centered, small seal-mark icon (a circle glyph — swap for the real Khatm mark), title (15px/600), body (13px muted, max ~36ch), optional secondary action button.

### Error banner / toast
Banner: inline, `border-radius: var(--radius-lg)`, bg `--color-danger-tint`, `border: 1px solid color-mix(in oklch, var(--color-danger) 40%, transparent)`, leading circular "!" icon (danger bg, white glyph), dismiss button end-aligned.
Toast: floating, `border-radius: var(--radius-lg)`, bg `--color-surface`, `border: 1px solid var(--color-border)`, `box-shadow: var(--shadow-lg)`, leading circular ✓ icon (success bg).

## Screens mocked
### Issuance — single
Two-column panel (`1.2fr / 1fr`, divided by an inline-end border). Left: schema `<select>`, dynamic claim fields (selective-disclosure fields flagged with the info pill), Mint (primary) + Cancel (secondary) buttons. Right (bg `--color-surface-2`): result state — Issued badge, "Credential minted" heading, one-time claim code in a dashed mono box, a QR placeholder (striped square, monospace caption "QR — one-time claim" — real QR image goes here), and a note that the code is delivered out-of-band and shown once.

### Credential search / verify / revoke
Search bar (input + Search primary button) → result card (bg `--color-surface-2`): ref (coded, LTR) + Verified badge (success) header row, then a 3-column meta grid (schema / issued date / consuming party). Below, a distinct danger-bordered "Revoke credential" panel: reason `<select>` + Revoke button (danger).

## Interactions & state (minimal, to replicate)
- Theme toggle and language toggle are page-level state (in the real app: theme from user/tenant pref + system, language from user/tenant locale — not a visible toggle in production unless you want one for QA/demo).
- Secret reveal: boolean toggle per secret instance, defaults to masked.
- No animations beyond simple hover/focus transitions (background-color, border-color, box-shadow) — consistent with "no new animation libraries."

## Not yet designed (flagged, not started)
API-key revocation UI, JWKS/rotation read-only view, configuration management — all next roadmap items; extend the same token/component vocabulary when built (e.g., JWKS key fragments use the same coded-value LTR treatment; rotation status uses the same badge component with Active/Rotating/Expired as new semantic mappings onto success/warning/neutral).


