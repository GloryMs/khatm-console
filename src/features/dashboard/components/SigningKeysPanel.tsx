import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useAuth } from '@/features/auth/useAuth';
import { useSigningKeyStatuses } from '@/features/keyManagement/hooks';
import { PanelCard } from './PanelCard';
import styles from './SigningKeysPanel.module.css';

const STATE_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  RETIRING: 'warning',
  PENDING: 'info',
  RETIRED: 'neutral',
};

const STATE_LABEL_KEY: Record<string, string> = {
  ACTIVE: 'dashboard.keys.states.active',
  RETIRING: 'dashboard.keys.states.retiring',
  PENDING: 'dashboard.keys.states.pending',
  RETIRED: 'dashboard.keys.states.retired',
};

// Same SOFT/VAULT mapping as keyManagement/components/KeyList.tsx — duplicated per this
// feature's own i18n/tone conventions rather than a cross-feature import (2026-08-03 precedent).
const PROVIDER_TONE: Record<string, StatusTone> = {
  SOFT: 'neutral',
  VAULT: 'success',
};

/**
 * Read-only signing-key lifecycle glance from `GET /api/v1/admin/signing-keys`
 * (KH-1.1.5-BE, `key:manage`-scoped) — real `state`/`validFrom`/`validTo`,
 * never the public JWK or any private material. Unlike the public
 * `/.well-known/jwks.json` this includes RETIRED keys.
 *
 * Rotate/retire actions moved to their own `/key-management` page 2026-08-03
 * per Majd's request (see `docs/STATE.md`) — every other irreversible admin
 * action in this console (Users, Tenants, Consuming Parties) lives on its
 * own scoped page rather than inside a dashboard card. This panel shares its
 * query (`useSigningKeyStatuses`, from the `keyManagement` feature) with that
 * page, so a rotate/retire done there refreshes this glance too.
 */
export function SigningKeysPanel() {
  const { t, i18n } = useTranslation();
  const { hasScope } = useAuth();
  const canViewKeys = hasScope('key:manage');
  const keys = useSigningKeyStatuses(canViewKeys);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  return (
    <PanelCard
      title={t('dashboard.keys.title')}
      action={
        canViewKeys && (
          <Link to="/key-management" className={styles.manageLink}>
            {t('dashboard.keys.manageLink')}
          </Link>
        )
      }
    >
      {!canViewKeys && (
        <EmptyState
          title={t('dashboard.keys.adminOnlyTitle')}
          body={t('dashboard.keys.adminOnlyBody')}
        />
      )}
      {canViewKeys && keys.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {canViewKeys && keys.isError && <ApiErrorBanner error={keys.error} />}
      {canViewKeys && keys.isSuccess && (keys.data.keys?.length ?? 0) === 0 && (
        <EmptyState title={t('dashboard.keys.emptyTitle')} body={t('dashboard.keys.emptyBody')} />
      )}
      {canViewKeys && keys.isSuccess && (keys.data.keys?.length ?? 0) > 0 && (
        <ul className={styles.list}>
          {keys.data.keys?.map((key) => {
            const tone = STATE_TONE[key.state ?? ''] ?? 'neutral';
            const labelKey = STATE_LABEL_KEY[key.state ?? ''];
            return (
              <li key={key.kid} className={styles.row}>
                <div className={styles.head}>
                  <span className={`${styles.kid} ltr-embed`}>{key.kid}</span>
                  <StatusBadge tone={tone}>{labelKey ? t(labelKey) : key.state}</StatusBadge>
                  <StatusBadge tone={PROVIDER_TONE[key.provider ?? ''] ?? 'neutral'}>
                    {key.provider ? (
                      <span className="ltr-embed">{key.provider}</span>
                    ) : (
                      t('dashboard.keys.providerUnknown')
                    )}
                  </StatusBadge>
                </div>
                <div className={styles.meta}>
                  <span>
                    {t('dashboard.keys.validFrom')}{' '}
                    <span className="ltr-embed">
                      {key.validFrom ? dateFormat.format(new Date(key.validFrom)) : '—'}
                    </span>
                  </span>
                  <span>
                    {t('dashboard.keys.validTo')}{' '}
                    <span className="ltr-embed">
                      {key.validTo
                        ? dateFormat.format(new Date(key.validTo))
                        : t('dashboard.keys.noExpiry')}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
}
