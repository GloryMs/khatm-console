import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useErrorMessage } from '@/api/useErrorMessage';
import { RequireScope } from '@/features/auth/RequireScope';
import { useSchemas } from '@/features/schemas/hooks';
import { AllowlistDialog } from './components/AllowlistDialog';
import { CreatePartyDialog, type CreatePartyFormValues } from './components/CreatePartyDialog';
import { MintedKeyModal } from './components/MintedKeyModal';
import { PartyList } from './components/PartyList';
import type { ConsumingPartyView, CreateApiKeyResponse } from './api';
import {
  useActivateConsumingParty,
  useAllowSchema,
  useConsumingParties,
  useCreateConsumingParty,
  useDisallowSchema,
  useMintApiKey,
  useSuspendConsumingParty,
} from './hooks';
import styles from './ConsumingPartiesPage.module.css';

export function ConsumingPartiesPage() {
  return (
    <RequireScope scope="admin">
      <ConsumingPartiesPageBody />
    </RequireScope>
  );
}

function ConsumingPartiesPageBody() {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const parties = useConsumingParties();
  const schemas = useSchemas();

  const createParty = useCreateConsumingParty();
  const suspend = useSuspendConsumingParty();
  const activate = useActivateConsumingParty();
  const allowSchemaMutation = useAllowSchema();
  const disallowSchemaMutation = useDisallowSchema();
  const mintKey = useMintApiKey();

  const [createOpen, setCreateOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<ConsumingPartyView | null>(null);
  const [activateTarget, setActivateTarget] = useState<ConsumingPartyView | null>(null);
  const [allowlistTarget, setAllowlistTarget] = useState<ConsumingPartyView | null>(null);
  const [allowlistError, setAllowlistError] = useState<unknown>(null);
  const [isSavingAllowlist, setIsSavingAllowlist] = useState(false);
  const [mintTarget, setMintTarget] = useState<ConsumingPartyView | null>(null);
  const [mintedKey, setMintedKey] = useState<CreateApiKeyResponse | null>(null);

  const onCreateSubmit = async (values: CreatePartyFormValues) => {
    await createParty.mutateAsync({
      code: values.code,
      nameI18n: { en: values.nameEn, ar: values.nameAr },
    });
    setCreateOpen(false);
    createParty.reset();
  };

  const onConfirmSuspend = async () => {
    if (!suspendTarget?.id) return;
    await suspend.mutateAsync(suspendTarget.id);
    setSuspendTarget(null);
  };

  const onConfirmActivate = async () => {
    if (!activateTarget?.id) return;
    await activate.mutateAsync(activateTarget.id);
    setActivateTarget(null);
  };

  const onSaveAllowlist = async (diff: { toAllow: string[]; toDisallow: string[] }) => {
    if (!allowlistTarget?.id) return;
    const id = allowlistTarget.id;
    setAllowlistError(null);
    setIsSavingAllowlist(true);
    try {
      for (const schemaId of diff.toAllow) {
        await allowSchemaMutation.mutateAsync({ id, schemaId });
      }
      for (const schemaId of diff.toDisallow) {
        await disallowSchemaMutation.mutateAsync({ id, schemaId });
      }
      setAllowlistTarget(null);
    } catch (err) {
      setAllowlistError(err);
    } finally {
      setIsSavingAllowlist(false);
    }
  };

  const onConfirmMint = async () => {
    if (!mintTarget?.id) return;
    const result = await mintKey.mutateAsync(mintTarget.id);
    setMintedKey(result);
    setMintTarget(null);
    mintKey.reset();
  };

  return (
    <section className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>{t('consumingParties.title')}</h1>
        <button type="button" className={styles.createButton} onClick={() => setCreateOpen(true)}>
          {t('consumingParties.createCta')}
        </button>
      </div>

      {parties.isPending && <p>{t('common.loading')}</p>}
      {parties.isError && <ApiErrorBanner error={parties.error} />}
      {parties.data && (
        <PartyList
          parties={parties.data}
          onSuspend={setSuspendTarget}
          onActivate={setActivateTarget}
          onManageAllowlist={(party) => {
            setAllowlistError(null);
            setAllowlistTarget(party);
          }}
          onMintKey={setMintTarget}
        />
      )}

      {createOpen && (
        <CreatePartyDialog
          isSubmitting={createParty.isPending}
          error={createParty.isError ? createParty.error : undefined}
          onSubmit={onCreateSubmit}
          onCancel={() => {
            setCreateOpen(false);
            createParty.reset();
          }}
        />
      )}

      {suspendTarget && (
        <ConfirmDialog
          titleId="suspend-confirm-title"
          title={t('consumingParties.suspendConfirm.title')}
          body={t('consumingParties.suspendConfirm.body')}
          confirmLabel={
            suspend.isPending
              ? t('consumingParties.suspendConfirm.suspending')
              : t('consumingParties.suspendConfirm.confirm')
          }
          cancelLabel={t('consumingParties.suspendConfirm.cancel')}
          isBusy={suspend.isPending}
          errorMessage={suspend.isError ? resolveError(suspend.error) : undefined}
          onConfirm={onConfirmSuspend}
          onCancel={() => {
            setSuspendTarget(null);
            suspend.reset();
          }}
        />
      )}

      {activateTarget && (
        <ConfirmDialog
          titleId="activate-confirm-title"
          title={t('consumingParties.activateConfirm.title')}
          body={t('consumingParties.activateConfirm.body')}
          confirmLabel={
            activate.isPending
              ? t('consumingParties.activateConfirm.activating')
              : t('consumingParties.activateConfirm.confirm')
          }
          cancelLabel={t('consumingParties.activateConfirm.cancel')}
          isBusy={activate.isPending}
          errorMessage={activate.isError ? resolveError(activate.error) : undefined}
          onConfirm={onConfirmActivate}
          onCancel={() => {
            setActivateTarget(null);
            activate.reset();
          }}
        />
      )}

      {allowlistTarget && (
        <AllowlistDialog
          party={allowlistTarget}
          schemas={schemas.data ?? []}
          isSaving={isSavingAllowlist}
          error={allowlistError}
          onSave={onSaveAllowlist}
          onCancel={() => {
            setAllowlistTarget(null);
            setAllowlistError(null);
          }}
        />
      )}

      {mintTarget && (
        <ConfirmDialog
          titleId="mint-confirm-title"
          title={t('consumingParties.mintConfirm.title')}
          body={t('consumingParties.mintConfirm.body')}
          confirmLabel={
            mintKey.isPending
              ? t('consumingParties.mintConfirm.minting')
              : t('consumingParties.mintConfirm.confirm')
          }
          cancelLabel={t('consumingParties.mintConfirm.cancel')}
          isBusy={mintKey.isPending}
          errorMessage={mintKey.isError ? resolveError(mintKey.error) : undefined}
          onConfirm={onConfirmMint}
          onCancel={() => {
            setMintTarget(null);
            mintKey.reset();
          }}
        />
      )}

      {mintedKey?.rawKey && (
        <MintedKeyModal rawKey={mintedKey.rawKey} onClose={() => setMintedKey(null)} />
      )}
    </section>
  );
}
