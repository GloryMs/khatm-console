import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/api/useErrorMessage';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TypeToConfirmDialog } from '@/components/ui/TypeToConfirmDialog';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { RequireScope } from '@/features/auth/RequireScope';
import { ChildList } from './components/ChildList';
import { OrgReportsPanel } from './components/OrgReportsPanel';
import type { TenantRef } from './api';
import { useActivateChild, useChildren, useSuspendChild } from './hooks';
import styles from './OrgPage.module.css';

export function OrgPage() {
  return (
    <RequireScope scope="org:admin">
      <OrgPageBody />
    </RequireScope>
  );
}

function OrgPageBody() {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const localize = useLocalizedText();
  const children = useChildren();
  const suspend = useSuspendChild();
  const activate = useActivateChild();
  const [suspendTarget, setSuspendTarget] = useState<TenantRef | null>(null);
  const [activateTarget, setActivateTarget] = useState<TenantRef | null>(null);

  const onConfirmSuspend = async () => {
    if (!suspendTarget?.id) return;
    try {
      await suspend.mutateAsync(suspendTarget.id);
      setSuspendTarget(null);
      suspend.reset();
    } catch {
      // surfaced via suspend.isError/error in the dialog
    }
  };

  const onConfirmActivate = async () => {
    if (!activateTarget?.id) return;
    await activate.mutateAsync(activateTarget.id);
    setActivateTarget(null);
  };

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('org.title')}</h1>
      <p className={styles.help}>{t('org.subtitle')}</p>

      <h2 className={styles.sectionTitle}>{t('org.children.title')}</h2>
      {children.isPending && <p>{t('common.loading')}</p>}
      {children.isError && <ApiErrorBanner error={children.error} />}
      {children.data && (
        <ChildList
          childTenants={children.data}
          onSuspend={setSuspendTarget}
          onActivate={setActivateTarget}
        />
      )}

      <OrgReportsPanel />

      {suspendTarget && (
        <TypeToConfirmDialog
          titleId="org-suspend-child-title"
          title={t('org.suspendConfirm.title', {
            child: localize(suspendTarget.nameI18n) || suspendTarget.slug,
          })}
          body={t('org.suspendConfirm.body')}
          expectedText={suspendTarget.slug ?? ''}
          typePromptLabel={t('org.suspendConfirm.typePrompt')}
          mismatchLabel={t('org.suspendConfirm.mismatch')}
          confirmLabel={t('org.suspendConfirm.confirm')}
          busyLabel={t('org.suspendConfirm.suspending')}
          cancelLabel={t('org.suspendConfirm.cancel')}
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
          titleId="org-activate-child-title"
          title={t('org.activateConfirm.title', {
            child: localize(activateTarget.nameI18n) || activateTarget.slug,
          })}
          body={t('org.activateConfirm.body')}
          confirmLabel={
            activate.isPending
              ? t('org.activateConfirm.activating')
              : t('org.activateConfirm.confirm')
          }
          cancelLabel={t('org.activateConfirm.cancel')}
          isBusy={activate.isPending}
          errorMessage={activate.isError ? resolveError(activate.error) : undefined}
          onConfirm={onConfirmActivate}
          onCancel={() => {
            setActivateTarget(null);
            activate.reset();
          }}
        />
      )}
    </section>
  );
}
