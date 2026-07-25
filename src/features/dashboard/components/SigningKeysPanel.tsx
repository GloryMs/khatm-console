import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useAuth } from '@/features/auth/useAuth';
import { useSigningKeyStatuses } from '../hooks';
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

/**
 * Every signing key's lifecycle status from `GET /api/v1/admin/signing-keys`
 * (KH-1.1.5-BE, admin-scoped) — real `state`/`validFrom`/`validTo`, never
 * the JWK material. Unlike the public `/.well-known/jwks.json` this
 * includes RETIRED keys and is only visible to admins.
 */
export function SigningKeysPanel() {
  const { t, i18n } = useTranslation();
  const { hasScope } = useAuth();
  const isAdmin = hasScope('admin');
  const keys = useSigningKeyStatuses(isAdmin);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  return (
    <PanelCard title={t('dashboard.keys.title')}>
      {!isAdmin && (
        <EmptyState
          title={t('dashboard.keys.adminOnlyTitle')}
          body={t('dashboard.keys.adminOnlyBody')}
        />
      )}
      {isAdmin && keys.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {isAdmin && keys.isError && <ApiErrorBanner error={keys.error} />}
      {isAdmin && keys.isSuccess && (keys.data.keys?.length ?? 0) === 0 && (
        <EmptyState title={t('dashboard.keys.emptyTitle')} body={t('dashboard.keys.emptyBody')} />
      )}
      {isAdmin && keys.isSuccess && (keys.data.keys?.length ?? 0) > 0 && (
        <ul className={styles.list}>
          {keys.data.keys?.map((key) => {
            const tone = STATE_TONE[key.state ?? ''] ?? 'neutral';
            const labelKey = STATE_LABEL_KEY[key.state ?? ''];
            return (
              <li key={key.kid} className={styles.row}>
                <div className={styles.head}>
                  <span className={`${styles.kid} ltr-embed`}>{key.kid}</span>
                  <StatusBadge tone={tone}>{labelKey ? t(labelKey) : key.state}</StatusBadge>
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
