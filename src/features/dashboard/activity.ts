import type { StatusTone } from '@/components/ui/StatusBadge';

/** The `AuditAction` names `/api/v1/activity` can return, per its own OpenAPI description. */
export type ActivityAction =
  | 'CREDENTIAL_ISSUED'
  | 'CREDENTIAL_CONSUMED'
  | 'CREDENTIAL_REVOKED'
  | 'CONSUME_SCHEMA_DENIED'
  | 'CLAIM_CODE_REDEEMED'
  | 'CREDENTIAL_VERIFY_OK'
  | 'CREDENTIAL_VERIFY_FAILED';

interface ActionMeta {
  labelKey: string;
  tone: StatusTone;
}

const ACTION_META: Record<string, ActionMeta> = {
  CREDENTIAL_ISSUED: { labelKey: 'dashboard.activity.events.issued', tone: 'success' },
  CREDENTIAL_CONSUMED: { labelKey: 'dashboard.activity.events.consumed', tone: 'info' },
  CREDENTIAL_REVOKED: { labelKey: 'dashboard.activity.events.revoked', tone: 'danger' },
  CONSUME_SCHEMA_DENIED: { labelKey: 'dashboard.activity.events.denied', tone: 'danger' },
  CLAIM_CODE_REDEEMED: { labelKey: 'dashboard.activity.events.claimRedeemed', tone: 'info' },
  CREDENTIAL_VERIFY_OK: { labelKey: 'dashboard.activity.events.verifyOk', tone: 'success' },
  CREDENTIAL_VERIFY_FAILED: { labelKey: 'dashboard.activity.events.verifyFailed', tone: 'danger' },
};

/** Localization key + badge tone for one activity action; a safe neutral fallback for anything unrecognized. */
export function activityActionMeta(action: string | undefined): ActionMeta {
  const meta = action ? ACTION_META[action] : undefined;
  return meta ?? { labelKey: 'dashboard.activity.events.other', tone: 'neutral' };
}

export interface ActivityTabDef {
  key: string;
  labelKey: string;
  /** `undefined` = every action (the "All" tab). */
  event?: ActivityAction;
}

export const ACTIVITY_TABS: ActivityTabDef[] = [
  { key: 'all', labelKey: 'dashboard.activity.tabs.all' },
  { key: 'issued', labelKey: 'dashboard.activity.tabs.issued', event: 'CREDENTIAL_ISSUED' },
  { key: 'consumed', labelKey: 'dashboard.activity.tabs.consumed', event: 'CREDENTIAL_CONSUMED' },
  { key: 'revoked', labelKey: 'dashboard.activity.tabs.revoked', event: 'CREDENTIAL_REVOKED' },
];
