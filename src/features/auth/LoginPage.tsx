import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import type { LoginChallengeResponse } from './api';
import { LoginForm } from './components/LoginForm';
import { TotpChallengeForm } from './components/TotpChallengeForm';
import { useAuth } from './useAuth';
import styles from './LoginPage.module.css';

interface LoginLocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const location = useLocation();
  const [challenge, setChallenge] = useState<LoginChallengeResponse | null>(null);

  if (status === 'authenticated') {
    const state = location.state as LoginLocationState | null;
    return <Navigate to={state?.from?.pathname ?? '/'} replace />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.topBar}>
        <LanguageSwitcher />
      </div>
      <div className={styles.card}>
        <p className={styles.brand}>{t('app.brand')}</p>
        <h1 className={styles.title}>
          {challenge ? t('auth.totpChallenge.title') : t('auth.login.title')}
        </h1>
        {challenge ? (
          <TotpChallengeForm
            challengeId={challenge.challengeId ?? ''}
            onBack={() => setChallenge(null)}
          />
        ) : (
          <LoginForm onTotpRequired={setChallenge} />
        )}
      </div>
    </main>
  );
}
