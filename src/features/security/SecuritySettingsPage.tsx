import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { TotpEnrollDialog } from './components/TotpEnrollDialog';
import styles from './SecuritySettingsPage.module.css';

/**
 * Self-service security settings (spec FS-2.2 V1): enroll or re-enroll TOTP
 * for the caller's own account. No status badge — the contract exposes no
 * "is TOTP active" signal for the caller's own account (see README), so this
 * always offers the same enroll/re-enroll action rather than guessing.
 */
export function SecuritySettingsPage() {
  const { t } = useTranslation();
  const [enrollOpen, setEnrollOpen] = useState(false);

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('security.title')}</h1>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{t('security.totp.title')}</h2>
        <p className={styles.help}>{t('security.totp.description')}</p>
        <p className={styles.help}>{t('security.totp.statusUnknown')}</p>
        <div>
          <Button variant="primary" onClick={() => setEnrollOpen(true)}>
            {t('security.totp.enrollCta')}
          </Button>
        </div>
      </div>
      {enrollOpen && <TotpEnrollDialog onClose={() => setEnrollOpen(false)} />}
    </section>
  );
}
