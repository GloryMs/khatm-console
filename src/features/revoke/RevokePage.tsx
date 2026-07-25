import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { FormField, khatmInputClass } from '@/components/ui/FormField';
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
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get('id');
  const schema = useMemo(
    () => z.object({ id: z.string().min(1, { message: t('revoke.lookupLabel') }) }),
    [t],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LookupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { id: presetId ?? '' },
  });

  // Preloaded from a credential search deep-link (`/revoke?id=...`) — skips
  // the manual lookup step so the operator lands straight on the summary.
  const [activeId, setActiveId] = useState<string | null>(presetId);
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
        <FormField
          label={t('revoke.lookupLabel')}
          htmlFor="revoke-id"
          help={t('revoke.lookupHelp')}
          error={errors.id?.message}
        >
          <input
            id="revoke-id"
            type="text"
            autoComplete="off"
            placeholder={t('revoke.lookupPlaceholder')}
            className={`${khatmInputClass(errors.id ? 'error' : 'default')} ltr-embed`}
            {...register('id')}
          />
        </FormField>
        <Button type="submit" variant="primary" disabled={credentialQuery.isFetching}>
          {credentialQuery.isFetching ? t('revoke.looking') : t('revoke.lookup')}
        </Button>
      </form>

      {activeId && credentialQuery.isError && <ApiErrorBanner error={credentialQuery.error} />}

      {activeId && view && (
        <div className={styles.summaryBlock}>
          {justRevoked && <h2 className={styles.revokedTitle}>{t('revoke.revokedTitle')}</h2>}
          <CredentialSummary view={view} />
          {revoke.isError && <ApiErrorBanner error={revoke.error} />}
          {!view.revoked && (
            <div className={styles.revokePanel}>
              <span className={styles.revokePanelTitle}>{t('revoke.revokeCta')}</span>
              <p className={styles.revokePanelBody}>{t('revoke.revokePanelHint')}</p>
              <Button
                type="button"
                variant="danger"
                onClick={() => setDialogOpen(true)}
                disabled={revoke.isPending}
              >
                {t('revoke.revokeCta')}
              </Button>
            </div>
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
