import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useErrorMessage } from '@/api/useErrorMessage';
import { RequireScope } from '@/features/auth/RequireScope';
import { CredentialSummary } from './components/CredentialSummary';
import { RevokeConfirmDialog } from './components/RevokeConfirmDialog';
import { useCredential, useRevokeCredential } from './hooks';
import styles from './RevokePage.module.css';

interface LookupFormValues {
  id: string;
}

export function RevokePage() {
  return (
    <RequireScope scope="revoke">
      <RevokePageBody />
    </RequireScope>
  );
}

function RevokePageBody() {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const schema = useMemo(
    () => z.object({ id: z.string().min(1, { message: t('revoke.lookupLabel') }) }),
    [t],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LookupFormValues>({ resolver: zodResolver(schema) });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const credentialQuery = useCredential(activeId);
  const revoke = useRevokeCredential();

  const onLookup = handleSubmit((values) => {
    setActiveId(values.id.trim());
    setDialogOpen(false);
  });

  const onConfirmRevoke = async () => {
    if (!activeId) return;
    await revoke.mutateAsync(activeId);
    setDialogOpen(false);
  };

  const view = credentialQuery.data;
  const justRevoked = revoke.isSuccess && view?.revoked === true && revoke.variables === activeId;
  const revokeErrorMessage = revoke.isError ? resolveError(revoke.error) : undefined;

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('revoke.title')}</h1>

      <form className={styles.form} onSubmit={onLookup} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="revoke-id">
            {t('revoke.lookupLabel')}
          </label>
          <input
            id="revoke-id"
            type="text"
            autoComplete="off"
            placeholder={t('revoke.lookupPlaceholder')}
            {...register('id')}
          />
          {errors.id && <span className={styles.help}>{errors.id.message}</span>}
        </div>
        <button type="submit" className={styles.lookup} disabled={credentialQuery.isFetching}>
          {credentialQuery.isFetching ? t('revoke.looking') : t('revoke.lookup')}
        </button>
      </form>
      <p className={styles.help}>{t('revoke.lookupHelp')}</p>

      {activeId && credentialQuery.isError && <ApiErrorBanner error={credentialQuery.error} />}

      {activeId && view && (
        <div className={styles.summaryBlock}>
          {justRevoked && <h2 className={styles.revokedTitle}>{t('revoke.revokedTitle')}</h2>}
          <CredentialSummary view={view} />
          {revoke.isError && <ApiErrorBanner error={revoke.error} />}
          {!view.revoked && (
            <button
              type="button"
              className={styles.revokeCta}
              onClick={() => setDialogOpen(true)}
              disabled={revoke.isPending}
            >
              {t('revoke.revokeCta')}
            </button>
          )}
        </div>
      )}

      {dialogOpen && view && activeId && (
        <RevokeConfirmDialog
          expectedId={activeId}
          isRevoking={revoke.isPending}
          errorMessage={revokeErrorMessage}
          onConfirm={onConfirmRevoke}
          onCancel={() => setDialogOpen(false)}
        />
      )}
    </section>
  );
}
