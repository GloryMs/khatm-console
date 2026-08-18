import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/features/auth/useAuth';
import { TotpEnrollDialog } from './components/TotpEnrollDialog';
import styles from './SecuritySettingsPage.module.css';

/**
 * Self-service security settings (spec FS-2.2 V1): enroll TOTP for the
 * caller's own account, or view its status (KH-2.4x, `MeResponse.totpEnabled`
 * — closes the C7c gap where this always showed the same enroll/re-enroll
 * action because the status wasn't readable yet; see README).
 *
 * `totpEnabled === true` hides the enroll CTA rather than leaving it up and
 * misleading: `POST /users/me/totp/enroll` refuses with 409 (KH-USR-1409)
 * once TOTP is already active — self-service re-enroll was never actually
 * possible, only untested until now. Resetting an already-active enrollment
 * is admin-mediated (`features/users`/`features/tenants`), not this page.
 *
 * While `totpEnabled` is not yet known (should not normally happen — the
 * route only renders once `RequireAuth` has a session — but the field is
 * optional in the contract) the badge shows a checking state rather than
 * assuming "disabled": a false "not enabled" reading is a worse failure mode
 * than a brief loading state.
 */
export function SecuritySettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const totpEnabled = user?.totpEnabled;

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('security.title')}</h1>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{t('security.totp.title')}</h2>
        <p className={styles.help}>{t('security.totp.description')}</p>
        {totpEnabled === undefined && (
          <StatusBadge tone="neutral">{t('security.totp.statusChecking')}</StatusBadge>
        )}
        {totpEnabled === true && (
          <StatusBadge tone="success">{t('security.totp.statusEnabled')}</StatusBadge>
        )}
        {totpEnabled === false && (
          <StatusBadge tone="neutral">{t('security.totp.statusDisabled')}</StatusBadge>
        )}
        {totpEnabled === true && <p className={styles.help}>{t('security.totp.resetByAdmin')}</p>}
        {totpEnabled === false && (
          <div>
            <Button variant="primary" onClick={() => setEnrollOpen(true)}>
              {t('security.totp.enrollCta')}
            </Button>
          </div>
        )}
      </div>
      {enrollOpen && <TotpEnrollDialog onClose={() => setEnrollOpen(false)} />}
    </section>
  );
}
