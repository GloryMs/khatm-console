import type { StatsCounters } from './api';

export type CounterKey = keyof StatsCounters;

export interface CounterGroupDef {
  titleKey: string;
  counters: { key: CounterKey; labelKey: string }[];
}

/** Credentials moving through their normal lifecycle. */
export const LIFECYCLE_GROUP: CounterGroupDef = {
  titleKey: 'dashboard.groups.lifecycle',
  counters: [
    { key: 'issued', labelKey: 'dashboard.counters.issued' },
    { key: 'claimsRedeemed', labelKey: 'dashboard.counters.claimsRedeemed' },
    { key: 'consumed', labelKey: 'dashboard.counters.consumed' },
    { key: 'verifyOk', labelKey: 'dashboard.counters.verifyOk' },
  ],
};

/** Outcomes worth an operator's attention: revocations and failures. */
export const ATTENTION_GROUP: CounterGroupDef = {
  titleKey: 'dashboard.groups.attention',
  counters: [
    { key: 'revoked', labelKey: 'dashboard.counters.revoked' },
    { key: 'consumeDenied', labelKey: 'dashboard.counters.consumeDenied' },
    { key: 'verifyFailed', labelKey: 'dashboard.counters.verifyFailed' },
  ],
};

/**
 * Defensive lookup: a counter the contract marks optional, or one the
 * platform returns 0-with-note for, always renders as 0 — never crashes
 * (same defensive stance as the C1 status-list fields).
 */
export function resolveCounterValue(counters: StatsCounters | undefined, key: CounterKey): number {
  return counters?.[key] ?? 0;
}
