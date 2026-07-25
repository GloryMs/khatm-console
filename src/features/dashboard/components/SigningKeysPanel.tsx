import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useSigningKeys } from '../hooks';
import { PanelCard } from './PanelCard';
import styles from './SigningKeysPanel.module.css';

/**
 * Real data from `/.well-known/jwks.json` — every key currently published
 * for verification. No expiry/rotation-percentage fields exist in that
 * response, so unlike the design guide's mock this doesn't show a status
 * label, expiry date, or rotation progress bar — only what's verifiable:
 * a key id is currently published. See
 * `docs/specs/dashboard-v2-backend-needs.md` for the fields a real
 * key-health view would need.
 */
export function SigningKeysPanel() {
  const { t } = useTranslation();
  const keys = useSigningKeys();

  return (
    <PanelCard title={t('dashboard.keys.title')}>
      {keys.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {keys.isError && <ApiErrorBanner error={keys.error} />}
      {keys.isSuccess && keys.data.length === 0 && (
        <EmptyState title={t('dashboard.keys.emptyTitle')} body={t('dashboard.keys.emptyBody')} />
      )}
      {keys.isSuccess && keys.data.length > 0 && (
        <ul className={styles.list}>
          {keys.data.map((key) => (
            <li key={key.kid} className={styles.row}>
              <span className={styles.dot} aria-hidden="true" />
              <span className={`${styles.kid} ltr-embed`}>{key.kid}</span>
              <span className={styles.kty}>{key.kty}</span>
              <StatusBadge tone="success">{t('dashboard.keys.published')}</StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
