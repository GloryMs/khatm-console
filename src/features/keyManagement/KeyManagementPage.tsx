import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { TypeToConfirmDialog } from '@/components/ui/TypeToConfirmDialog';
import { useErrorMessage } from '@/api/useErrorMessage';
import { RequireScope } from '@/features/auth/RequireScope';
import { KeyList } from './components/KeyList';
import { RetireKeyDialog } from './components/RetireKeyDialog';
import { useRetireKey, useRotateKey, useSigningKeyStatuses } from './hooks';
import type { SigningKeyView } from './api';
import styles from './KeyManagementPage.module.css';

export function KeyManagementPage() {
  return (
    <RequireScope scope="key:manage">
      <KeyManagementPageBody />
    </RequireScope>
  );
}

/**
 * Full-page signing-key lifecycle management (spec FS-2.3 C8, moved off the
 * dashboard per Majd's request 2026-08-03 — see `docs/STATE.md`): rotate the
 * tenant's ACTIVE key (hardened type-to-confirm) and retire RETIRING keys
 * (staged for the `khatm.keys.min-retiring-age` guard). Shares its query
 * (`keyManagementKeys.list()`) with the dashboard's read-only glance panel,
 * so either surface reflects a rotate/retire done from the other.
 */
function KeyManagementPageBody() {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const keys = useSigningKeyStatuses(true);
  const rotateKey = useRotateKey();
  const retireKey = useRetireKey();

  const [rotateOpen, setRotateOpen] = useState(false);
  const [retireTarget, setRetireTarget] = useState<SigningKeyView | null>(null);

  const activeKid = keys.data?.keys?.find((k) => k.state === 'ACTIVE')?.kid;

  const closeRotate = () => {
    setRotateOpen(false);
    rotateKey.reset();
  };

  const onConfirmRotate = async () => {
    try {
      await rotateKey.mutateAsync();
      closeRotate();
    } catch {
      // surfaced via rotateKey.isError/error in TypeToConfirmDialog
    }
  };

  const closeRetire = () => {
    setRetireTarget(null);
    retireKey.reset();
  };

  const onConfirmRetire = async (force: boolean) => {
    if (!retireTarget?.kid) return;
    try {
      await retireKey.mutateAsync({ kid: retireTarget.kid, force });
      closeRetire();
    } catch {
      // surfaced via retireKey.isError/error in RetireKeyDialog
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.headRow}>
        <div>
          <h1 className={styles.title}>{t('keyManagement.title')}</h1>
          <p className={styles.intro}>{t('keyManagement.intro')}</p>
        </div>
        <Button
          variant="danger"
          type="button"
          disabled={!activeKid}
          title={activeKid ? undefined : t('keyManagement.rotate.noActiveKey')}
          onClick={() => setRotateOpen(true)}
        >
          {t('keyManagement.rotate.cta')}
        </Button>
      </div>

      {keys.isPending && <p>{t('common.loading')}</p>}
      {keys.isError && <ApiErrorBanner error={keys.error} />}
      {keys.isSuccess && <KeyList keys={keys.data.keys ?? []} onRetire={setRetireTarget} />}

      {rotateOpen && activeKid && (
        <TypeToConfirmDialog
          titleId="rotate-key-confirm-title"
          title={t('keyManagement.rotate.title')}
          body={t('keyManagement.rotate.body')}
          expectedText={activeKid}
          typePromptLabel={t('keyManagement.rotate.typePrompt')}
          mismatchLabel={t('keyManagement.rotate.mismatch')}
          confirmLabel={t('keyManagement.rotate.confirm')}
          busyLabel={t('keyManagement.rotate.rotating')}
          cancelLabel={t('keyManagement.rotate.cancel')}
          isBusy={rotateKey.isPending}
          errorMessage={rotateKey.isError ? resolveError(rotateKey.error) : undefined}
          onConfirm={onConfirmRotate}
          onCancel={closeRotate}
        />
      )}

      {retireTarget?.kid && (
        <RetireKeyDialog
          kid={retireTarget.kid}
          isBusy={retireKey.isPending}
          error={retireKey.isError ? retireKey.error : undefined}
          onConfirm={onConfirmRetire}
          onCancel={closeRetire}
        />
      )}
    </section>
  );
}
