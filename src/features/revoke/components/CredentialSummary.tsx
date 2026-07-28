import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { credentialStatusMessageKey, credentialStatusTone } from '@/components/ui/credentialStatus';
import type { CredentialView } from '../api';
import styles from './CredentialSummary.module.css';

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

/**
 * Credential result card for the lookup/verify/revoke flow: a header row
 * (coded ref + status badge) over a meta grid (schema / uses / valid-until —
 * the fields the contract's `CredentialView` actually exposes; there is no
 * `issuedAt` or consuming-party field on this shape, unlike `CredentialSummary`
 * from the search list).
 */
export function CredentialSummary({ view }: { view: CredentialView }) {
  const { t } = useTranslation();
  const formatDate = useFormattedDate();
  const statusMessageKey = credentialStatusMessageKey(view.status);
  const statusLabel = statusMessageKey ? t(statusMessageKey) : t('common.unknown');
  const validToText = formatDate(view.validTo);

  let usesText: string;
  if (view.usesConsumed !== undefined && view.maxUses !== undefined) {
    usesText = t('revoke.usesConsumedValue', { consumed: view.usesConsumed, max: view.maxUses });
  } else if (view.maxUses === undefined) {
    usesText = t('revoke.usesUnlimited');
  } else {
    usesText = `${view.usesConsumed ?? ''}`;
  }

  return (
    <div className={styles.summary} data-testid="credential-summary">
      <div className={styles.head}>
        <span className={`${styles.ref} ltr-embed`}>{view.ref}</span>
        <StatusBadge tone={credentialStatusTone(view.status)}>{statusLabel}</StatusBadge>
      </div>
      <div className={styles.grid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{t('revoke.schema')}</span>
          <span className={`${styles.metaValue} ltr-embed`}>{view.schemaCode}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{t('revoke.uses')}</span>
          <span className={`${styles.metaValue} ltr-embed`}>{usesText}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{t('revoke.validTo')}</span>
          <span className={styles.metaValue}>{validToText ?? t('revoke.noExpiry')}</span>
        </div>
      </div>
      {view.revoked && <p className={styles.note}>{t('revoke.alreadyRevokedNote')}</p>}
    </div>
  );
}
