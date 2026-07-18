# CONVENTIONS — khatm-console (React/TS)

> Details live in CLAUDE.md sections (rules 1–4). This file adds the mechanical bits.

- `npm run check` = tsc --noEmit + eslint + prettier --check + vitest + i18n parity script.
- Imports order (eslint enforced): react → libs → @/api → @/components → @/features → relative.
- Component file = PascalCase.tsx, one exported component per file; hooks useXxx.ts.
- Query keys: `[feature, entity, params]` tuples, centralized per feature in `api.ts`.
- Dates: display via `Intl.DateTimeFormat(locale)`; API always ISO-8601 UTC.
- Accessibility: every interactive element keyboard-reachable; labels via i18n keys;
  RTL verified for every new screen before PR (checklist item).
- Commits: `feat(issuance): KH-1.1.3 bulk CSV wizard`.
