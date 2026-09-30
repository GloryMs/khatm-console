import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/api/errors';
import { useErrorMessage } from '@/api/useErrorMessage';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TemporaryPasswordDialog } from '@/components/ui/TemporaryPasswordDialog';
import { TypeToConfirmDialog } from '@/components/ui/TypeToConfirmDialog';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { RequireScope } from '@/features/auth/RequireScope';
import {
  CreateUserDialog,
  type CreateUserFormValues,
} from '@/features/users/components/CreateUserDialog';
import { UserList } from '@/features/users/components/UserList';
import type { CreateUserResponse, UserSummary } from '@/features/tenants/api';
import { useSchemas } from '@/features/schemas/hooks';
import { ClientList } from '@/features/issuerClients/components/ClientList';
import {
  CreateClientDialog,
  type CreateClientSubmitValues,
} from '@/features/issuerClients/components/CreateClientDialog';
import { RevealSecretsDialog } from '@/features/issuerClients/components/RevealSecretsDialog';
import { RotateDialog } from '@/features/issuerClients/components/RotateDialog';
import type { IssuerClientResponse } from '@/features/issuerClients/api';
import { ChildSchemaList } from './components/ChildSchemaList';
import { OnBehalfOfBanner } from './components/OnBehalfOfBanner';
import {
  useChildIssuerClients,
  useChildren,
  useChildSchemas,
  useChildUsers,
  useCreateChildIssuerClient,
  useCreateChildUser,
  useDisableChildUser,
  useResetChildUserPassword,
  useResumeChildIssuerClient,
  useRevokeChildIssuerClient,
  useRotateChildIssuerClient,
  useSuspendChildIssuerClient,
} from './hooks';
import styles from './OrgChildPage.module.css';

const LAST_ADMIN_ERROR_CODE = 'KH-USR-0423';

type ChildTab = 'users' | 'schemas' | 'issuerClients';

interface RevealState {
  keyPrefix: string;
  apiKey: string;
  retiringClientId?: string;
}

export function OrgChildPage() {
  return (
    <RequireScope scope="org:admin">
      <OrgChildPageBody />
    </RequireScope>
  );
}

function OrgChildPageBody() {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const localize = useLocalizedText();
  const params = useParams<{ id: string }>();
  const childId = params.id;

  // No single "get one child" endpoint exists — org:admin only ever sees its
  // own direct children, so the child's display name/slug is resolved from
  // the already-fetched children list rather than a dedicated fetch.
  const children = useChildren();
  const child = children.data?.find((c) => c.id === childId);

  const [activeTab, setActiveTab] = useState<ChildTab>('users');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [disableTarget, setDisableTarget] = useState<UserSummary | null>(null);
  const [resetTarget, setResetTarget] = useState<UserSummary | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<CreateUserResponse | null>(null);

  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<IssuerClientResponse | null>(null);
  const [suspendClientTarget, setSuspendClientTarget] = useState<IssuerClientResponse | null>(null);
  const [resumeClientTarget, setResumeClientTarget] = useState<IssuerClientResponse | null>(null);
  const [revokeClientTarget, setRevokeClientTarget] = useState<IssuerClientResponse | null>(null);
  const [revealState, setRevealState] = useState<RevealState | null>(null);

  const childUsers = useChildUsers(activeTab === 'users' ? childId : undefined);
  const childSchemas = useChildSchemas(activeTab === 'schemas' ? childId : undefined);
  const childIssuerClients = useChildIssuerClients(
    activeTab === 'issuerClients' ? childId : undefined,
  );
  const schemas = useSchemas();
  const createChildUser = useCreateChildUser();
  const disableChildUser = useDisableChildUser();
  const resetChildUserPassword = useResetChildUserPassword();
  const createIssuerClient = useCreateChildIssuerClient(childId ?? '');
  const rotateIssuerClient = useRotateChildIssuerClient(childId ?? '');
  const suspendIssuerClient = useSuspendChildIssuerClient(childId ?? '');
  const resumeIssuerClient = useResumeChildIssuerClient(childId ?? '');
  const revokeIssuerClient = useRevokeChildIssuerClient(childId ?? '');

  const resolveActionError = (error: unknown): string | undefined => {
    if (!error) return undefined;
    if (isApiError(error) && error.code === LAST_ADMIN_ERROR_CODE) {
      return t('users.lastAdminGuard.explanation');
    }
    return resolveError(error);
  };

  const onCreateUserSubmit = async (values: CreateUserFormValues) => {
    if (!childId) return;
    try {
      const result = await createChildUser.mutateAsync({
        childId,
        req: {
          username: values.username,
          displayNameI18n: { en: values.nameEn, ar: values.nameAr },
          roles: values.roles,
        },
      });
      setCreateUserOpen(false);
      createChildUser.reset();
      setTemporaryPassword(result);
    } catch {
      // surfaced via createChildUser.isError/error in CreateUserDialog
    }
  };

  const onConfirmDisable = async () => {
    if (!childId || !disableTarget?.id) return;
    try {
      await disableChildUser.mutateAsync({ childId, userId: disableTarget.id });
      setDisableTarget(null);
      disableChildUser.reset();
    } catch {
      // surfaced via disableChildUser.isError/error in the confirm dialog
    }
  };

  const onConfirmReset = async () => {
    if (!childId || !resetTarget?.id) return;
    try {
      const result = await resetChildUserPassword.mutateAsync({ childId, userId: resetTarget.id });
      setResetTarget(null);
      resetChildUserPassword.reset();
      setTemporaryPassword(result);
    } catch {
      // surfaced via resetChildUserPassword.isError/error in the confirm dialog
    }
  };

  const onCreateClientSubmit = async (values: CreateClientSubmitValues) => {
    try {
      const result = await createIssuerClient.mutateAsync({
        name: { en: values.nameEn, ar: values.nameAr },
        allowedSchemaIds: values.allowedSchemaIds,
        ...(values.expiresAt ? { expiresAt: values.expiresAt } : {}),
      });
      setCreateClientOpen(false);
      createIssuerClient.reset();
      setRevealState({ keyPrefix: result.keyPrefix ?? '', apiKey: result.apiKey ?? '' });
    } catch {
      // surfaced via createIssuerClient.isError/error in CreateClientDialog
    }
  };

  const onConfirmRotateClient = async (retireAfterHours: number) => {
    if (!rotateTarget?.id) return;
    try {
      const result = await rotateIssuerClient.mutateAsync({
        clientId: rotateTarget.id,
        req: { retireAfterHours },
      });
      const retiringId = rotateTarget.id;
      setRotateTarget(null);
      rotateIssuerClient.reset();
      setRevealState({
        keyPrefix: result.keyPrefix ?? '',
        apiKey: result.apiKey ?? '',
        retiringClientId: retiringId,
      });
    } catch {
      // surfaced via rotateIssuerClient.isError/error in RotateDialog
    }
  };

  const onConfirmSuspendClient = async () => {
    if (!suspendClientTarget?.id) return;
    try {
      await suspendIssuerClient.mutateAsync(suspendClientTarget.id);
      setSuspendClientTarget(null);
      suspendIssuerClient.reset();
    } catch {
      // surfaced via suspendIssuerClient.isError/error in the confirm dialog
    }
  };

  const onConfirmResumeClient = async () => {
    if (!resumeClientTarget?.id) return;
    try {
      await resumeIssuerClient.mutateAsync(resumeClientTarget.id);
      setResumeClientTarget(null);
      resumeIssuerClient.reset();
    } catch {
      // surfaced via resumeIssuerClient.isError/error in the confirm dialog
    }
  };

  const onConfirmRevokeClient = async () => {
    if (!revokeClientTarget?.id) return;
    try {
      await revokeIssuerClient.mutateAsync(revokeClientTarget.id);
      setRevokeClientTarget(null);
      revokeIssuerClient.reset();
    } catch {
      // surfaced via revokeIssuerClient.isError/error in TypeToConfirmDialog
    }
  };

  const childName = child ? localize(child.nameI18n) || child.slug || '' : '';

  return (
    <section className={styles.page}>
      <Link className={styles.back} to="/org">
        {t('org.child.backToOrg')}
      </Link>

      <OnBehalfOfBanner childName={childName} />

      <div className={styles.headRow}>
        <h1 className={styles.title}>{childName || t('common.loading')}</h1>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={activeTab === 'users' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('users')}
        >
          {t('org.child.tabUsers')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'schemas'}
          className={activeTab === 'schemas' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('schemas')}
        >
          {t('org.child.tabSchemas')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'issuerClients'}
          className={activeTab === 'issuerClients' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('issuerClients')}
        >
          {t('org.child.tabIssuerClients')}
        </button>
      </div>

      {activeTab === 'users' && (
        <div className={styles.tabPanel}>
          <div className={styles.actionsRow}>
            <Button variant="primary" onClick={() => setCreateUserOpen(true)}>
              {t('org.child.addUserCta')}
            </Button>
          </div>
          {childUsers.isPending && <p>{t('common.loading')}</p>}
          {childUsers.isError && <ApiErrorBanner error={childUsers.error} />}
          {childUsers.data && (
            <UserList
              users={childUsers.data}
              onDisable={setDisableTarget}
              onResetPassword={setResetTarget}
            />
          )}
        </div>
      )}

      {activeTab === 'schemas' && (
        <div className={styles.tabPanel}>
          <p className={styles.schemaNote}>{t('org.child.schemasReadOnlyNote')}</p>
          {childSchemas.isPending && <p>{t('common.loading')}</p>}
          {childSchemas.isError && <ApiErrorBanner error={childSchemas.error} />}
          {childSchemas.data && <ChildSchemaList schemas={childSchemas.data} />}
        </div>
      )}

      {activeTab === 'issuerClients' && (
        <div className={styles.tabPanel}>
          <div className={styles.actionsRow}>
            <Button variant="primary" onClick={() => setCreateClientOpen(true)}>
              {t('clients.createCta')}
            </Button>
          </div>
          {childIssuerClients.isPending && <p>{t('common.loading')}</p>}
          {childIssuerClients.isError && <ApiErrorBanner error={childIssuerClients.error} />}
          {childIssuerClients.data && (
            <ClientList
              clients={childIssuerClients.data}
              schemas={schemas.data ?? []}
              onRotate={setRotateTarget}
              onSuspend={setSuspendClientTarget}
              onResume={setResumeClientTarget}
              onRevoke={setRevokeClientTarget}
            />
          )}
        </div>
      )}

      {createUserOpen && (
        <CreateUserDialog
          titleId="org-child-create-user-title"
          title={t('org.child.addUserTitle')}
          isSubmitting={createChildUser.isPending}
          error={createChildUser.isError ? createChildUser.error : undefined}
          onSubmit={onCreateUserSubmit}
          onCancel={() => {
            setCreateUserOpen(false);
            createChildUser.reset();
          }}
        />
      )}

      {disableTarget && (
        <ConfirmDialog
          titleId="org-child-disable-confirm-title"
          title={t('users.disableConfirm.title', { username: disableTarget.username ?? '' })}
          body={t('users.disableConfirm.body')}
          confirmLabel={
            disableChildUser.isPending
              ? t('users.disableConfirm.disabling')
              : t('users.disableConfirm.confirm')
          }
          cancelLabel={t('users.disableConfirm.cancel')}
          isBusy={disableChildUser.isPending}
          errorMessage={
            disableChildUser.isError ? resolveActionError(disableChildUser.error) : undefined
          }
          onConfirm={onConfirmDisable}
          onCancel={() => {
            setDisableTarget(null);
            disableChildUser.reset();
          }}
        />
      )}

      {resetTarget && (
        <ConfirmDialog
          titleId="org-child-reset-password-confirm-title"
          title={t('users.resetConfirm.title', { username: resetTarget.username ?? '' })}
          body={t('users.resetConfirm.body')}
          confirmLabel={
            resetChildUserPassword.isPending
              ? t('users.resetConfirm.resetting')
              : t('users.resetConfirm.confirm')
          }
          cancelLabel={t('users.resetConfirm.cancel')}
          isBusy={resetChildUserPassword.isPending}
          errorMessage={
            resetChildUserPassword.isError ? resolveError(resetChildUserPassword.error) : undefined
          }
          onConfirm={onConfirmReset}
          onCancel={() => {
            setResetTarget(null);
            resetChildUserPassword.reset();
          }}
        />
      )}

      {createClientOpen && (
        <CreateClientDialog
          schemas={schemas.data ?? []}
          isSubmitting={createIssuerClient.isPending}
          error={createIssuerClient.isError ? createIssuerClient.error : undefined}
          onSubmit={onCreateClientSubmit}
          onCancel={() => {
            setCreateClientOpen(false);
            createIssuerClient.reset();
          }}
        />
      )}

      {rotateTarget?.id && (
        <RotateDialog
          keyPrefix={rotateTarget.keyPrefix ?? ''}
          isBusy={rotateIssuerClient.isPending}
          error={rotateIssuerClient.isError ? rotateIssuerClient.error : undefined}
          onConfirm={onConfirmRotateClient}
          onCancel={() => {
            setRotateTarget(null);
            rotateIssuerClient.reset();
          }}
        />
      )}

      {suspendClientTarget && (
        <ConfirmDialog
          titleId="org-child-suspend-client-confirm-title"
          title={t('clients.suspendConfirm.title')}
          body={t('clients.suspendConfirm.body')}
          confirmLabel={
            suspendIssuerClient.isPending
              ? t('clients.suspendConfirm.suspending')
              : t('clients.suspendConfirm.confirm')
          }
          cancelLabel={t('clients.suspendConfirm.cancel')}
          isBusy={suspendIssuerClient.isPending}
          errorMessage={
            suspendIssuerClient.isError ? resolveError(suspendIssuerClient.error) : undefined
          }
          onConfirm={onConfirmSuspendClient}
          onCancel={() => {
            setSuspendClientTarget(null);
            suspendIssuerClient.reset();
          }}
        />
      )}

      {resumeClientTarget && (
        <ConfirmDialog
          titleId="org-child-resume-client-confirm-title"
          title={t('clients.resumeConfirm.title')}
          body={t('clients.resumeConfirm.body')}
          confirmLabel={
            resumeIssuerClient.isPending
              ? t('clients.resumeConfirm.resuming')
              : t('clients.resumeConfirm.confirm')
          }
          cancelLabel={t('clients.resumeConfirm.cancel')}
          isBusy={resumeIssuerClient.isPending}
          errorMessage={
            resumeIssuerClient.isError ? resolveError(resumeIssuerClient.error) : undefined
          }
          onConfirm={onConfirmResumeClient}
          onCancel={() => {
            setResumeClientTarget(null);
            resumeIssuerClient.reset();
          }}
        />
      )}

      {revokeClientTarget?.id && (
        <TypeToConfirmDialog
          titleId="org-child-revoke-client-confirm-title"
          title={t('clients.revokeConfirm.title')}
          body={t('clients.revokeConfirm.body')}
          expectedText={revokeClientTarget.keyPrefix ?? ''}
          typePromptLabel={t('clients.revokeConfirm.typePrompt')}
          mismatchLabel={t('clients.revokeConfirm.mismatch')}
          confirmLabel={t('clients.revokeConfirm.confirm')}
          busyLabel={t('clients.revokeConfirm.revoking')}
          cancelLabel={t('clients.revokeConfirm.cancel')}
          isBusy={revokeIssuerClient.isPending}
          onConfirm={onConfirmRevokeClient}
          onCancel={() => {
            setRevokeClientTarget(null);
            revokeIssuerClient.reset();
          }}
        >
          {revokeIssuerClient.isError && <ApiErrorBanner error={revokeIssuerClient.error} />}
        </TypeToConfirmDialog>
      )}

      {revealState && (
        <RevealSecretsDialog
          keyPrefix={revealState.keyPrefix}
          apiKey={revealState.apiKey}
          retiringClientId={revealState.retiringClientId}
          onClose={() => setRevealState(null)}
        />
      )}

      {temporaryPassword?.temporaryPassword && (
        <TemporaryPasswordDialog
          titleId="org-child-temporary-password-title"
          title={t('users.temporaryPassword.title')}
          username={temporaryPassword.username ?? ''}
          password={temporaryPassword.temporaryPassword}
          onClose={() => setTemporaryPassword(null)}
        />
      )}
    </section>
  );
}
