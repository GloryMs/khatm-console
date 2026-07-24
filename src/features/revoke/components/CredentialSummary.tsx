import { useTranslation } from 'react-i18next';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import type { CredentialView } from '../api';
import styles from './CredentialSummary.module.css';

type DerivedStatus = 'active' | 'revoked' | 'expired';

function deriveStatus(view: CredentialView, now: number): DerivedStatus {
  if (view.revoked) return 'revoked';
  if (view.validTo && new Date(view.validTo).getTime() < now) return 'expired';
  return 'active';
}

const STATUS_TONE: Record<DerivedStatus, StatusTone> = {
  active: 'success',
  revoked: 'danger',
  expired: 'warning',
};

function useFormattedDate(): (iso: string | undefined) => string | null {
  const { i18n } = useTranslation();
  return (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };
}

export function CredentialSummary({ view }: { view: CredentialView }) {
  const { t } = useTranslation();
  const formatDate = useFormattedDate();
  const status = deriveStatus(view, Date.now());

  const statusLabel = t(`revoke.status${status[0].toUpperCase()}${status.slice(1)}`);

  const validToText = formatDate(view.validTo);

  let usesText: string;
  if (view.usesRemaining !== undefined && view.maxUses !== undefined) {
    usesText = t('revoke.usesValue', { remaining: view.usesRemaining, max: view.maxUses });
  } else if (view.maxUses === undefined) {
    usesText = t('revoke.usesUnlimited');
  } else {
    usesText = `${view.usesRemaining ?? ''}`;
  }

  return (
    <div className={styles.summary} data-testid="credential-summary">
      <div className={styles.row}>
        <span className={styles.label}>{t('revoke.schema')}</span>
        <span className={`${styles.value} ltr-embed`}>{view.schemaCode}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t('revoke.ref')}</span>
        <span className={`${styles.value} ltr-embed`}>{view.ref}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t('revoke.status')}</span>
        <StatusBadge tone={STATUS_TONE[status]}>{statusLabel}</StatusBadge>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t('revoke.uses')}</span>
        <span className={`${styles.value} ltr-embed`}>{usesText}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t('revoke.validTo')}</span>
        <span className={styles.value}>{validToText ?? t('revoke.noExpiry')}</span>
      </div>
      {view.revoked && <p className={styles.note}>{t('revoke.alreadyRevokedNote')}</p>}
    </div>
  );
}
