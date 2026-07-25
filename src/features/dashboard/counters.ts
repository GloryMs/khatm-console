import type { KpiTone } from './components/KpiCard';
import type { StatsCounters } from './api';

export type CounterKey = keyof StatsCounters;

export interface KpiDef {
  key: CounterKey;
  labelKey: string;
  /** Decorative glyph for the icon chip — no icon library, matches the design guide's own plain glyphs. */
  icon: string;
  tone: KpiTone;
}

/**
 * The four headline counters shown as KPI cards, in display order. Mirrors
 * the design guide's KPI row exactly (Issued/Consumed/Verified/Revoked) —
 * one from each of the old lifecycle/attention groupings.
 */
export const PRIMARY_KPIS: KpiDef[] = [
  { key: 'issued', labelKey: 'dashboard.counters.issued', icon: '✚', tone: 'primary' },
  { key: 'consumed', labelKey: 'dashboard.counters.consumed', icon: '↓', tone: 'info' },
  { key: 'verifyOk', labelKey: 'dashboard.counters.verifyOk', icon: '✓', tone: 'success' },
  { key: 'revoked', labelKey: 'dashboard.counters.revoked', icon: '⊘', tone: 'danger' },
];

/**
 * The remaining three counters the platform reports that don't have their
 * own KPI card in the new layout (claim-code redemption isn't in the
 * design guide's KPI row at all; consume-denied/verify-failed feed the
 * guide's narrative "needs attention" copy rather than a raw count) —
 * shown as a compact secondary stats strip so no real counter goes unshown.
 */
export const SECONDARY_COUNTERS: { key: CounterKey; labelKey: string }[] = [
  { key: 'claimsRedeemed', labelKey: 'dashboard.counters.claimsRedeemed' },
  { key: 'consumeDenied', labelKey: 'dashboard.counters.consumeDenied' },
  { key: 'verifyFailed', labelKey: 'dashboard.counters.verifyFailed' },
];

/**
 * Defensive lookup: a counter the contract marks optional, or one the
 * platform returns 0-with-note for, always renders as 0 — never crashes
 * (same defensive stance as the C1 status-list fields).
 */
export function resolveCounterValue(counters: StatsCounters | undefined, key: CounterKey): number {
  return counters?.[key] ?? 0;
}
