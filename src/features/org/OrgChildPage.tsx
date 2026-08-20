import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/api/errors';
import { useErrorMessage } from '@/api/useErrorMessage';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TemporaryPasswordDialog } from '@/components/ui/TemporaryPasswordDialog';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { RequireScope } from '@/features/auth/RequireScope';
import {
  CreateUserDialog,
  type CreateUserFormValues,
} from '@/features/users/components/CreateUserDialog';
import { UserList } from '@/features/users/components/UserList';
import type { CreateUserResponse, UserSummary } from '@/features/tenants/api';
import { ChildSchemaList } from './components/ChildSchemaList';
import { OnBehalfOfBanner } from './components/OnBehalfOfBanner';
import {
  useChildren,
  useChildSchemas,
  useChildUsers,
  useCreateChildUser,
  useDisableChildUser,
  useResetChildUserPassword,
} from './hooks';
import styles from './OrgChildPage.module.css';

const LAST_ADMIN_ERROR_CODE = 'KH-USR-0423';

type ChildTab = 'users' | 'schemas';

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

  const childUsers = useChildUsers(activeTab === 'users' ? childId : undefined);
  const childSchemas = useChildSchemas(activeTab === 'schemas' ? childId : undefined);
  const createChildUser = useCreateChildUser();
  const disableChildUser = useDisableChildUser();
  const resetChildUserPassword = useResetChildUserPassword();

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
