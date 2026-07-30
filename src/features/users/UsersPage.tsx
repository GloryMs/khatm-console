import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TemporaryPasswordDialog } from '@/components/ui/TemporaryPasswordDialog';
import { useErrorMessage } from '@/api/useErrorMessage';
import { isApiError } from '@/api/errors';
import { RequireScope } from '@/features/auth/RequireScope';
import { CreateUserDialog, type CreateUserFormValues } from './components/CreateUserDialog';
import { EditRolesDialog } from './components/EditRolesDialog';
import { UserList } from './components/UserList';
import type { CreateUserResponse, UserSummary } from './api';
import {
  useCreateUser,
  useDisableUser,
  useLockUser,
  useReplaceRoles,
  useResetPassword,
  useResetTotp,
  useUnlockUser,
  useUsers,
} from './hooks';
import styles from './UsersPage.module.css';

const LAST_ADMIN_ERROR_CODE = 'KH-USR-0423';

export function UsersPage() {
  return (
    <RequireScope scope="tenant:admin">
      <UsersPageBody />
    </RequireScope>
  );
}

function UsersPageBody() {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const users = useUsers();

  const createUser = useCreateUser();
  const replaceRoles = useReplaceRoles();
  const lockUser = useLockUser();
  const unlockUser = useUnlockUser();
  const disableUser = useDisableUser();
  const resetPassword = useResetPassword();
  const resetTotp = useResetTotp();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRolesTarget, setEditRolesTarget] = useState<UserSummary | null>(null);
  const [lockTarget, setLockTarget] = useState<UserSummary | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<UserSummary | null>(null);
  const [disableTarget, setDisableTarget] = useState<UserSummary | null>(null);
  const [resetTarget, setResetTarget] = useState<UserSummary | null>(null);
  const [resetTotpTarget, setResetTotpTarget] = useState<UserSummary | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<CreateUserResponse | null>(null);

  /** KH-USR-0423 gets a clear inline explanation, not the generic banner (spec FS-2.2 D5). */
  const resolveActionError = (error: unknown): string | undefined => {
    if (!error) return undefined;
    if (isApiError(error) && error.code === LAST_ADMIN_ERROR_CODE) {
      return t('users.lastAdminGuard.explanation');
    }
    return resolveError(error);
  };

  // Each handler swallows the mutateAsync rejection after letting the
  // mutation's own isError/error state drive the dialog's visible banner
  // (or the KH-USR-0423 inline explanation) — mutateAsync re-throws by
  // design, and nothing else here awaits or catches these fire-and-forget
  // handlers, so leaving it unswallowed would surface as an unhandled
  // rejection on every failed action.
  const onCreateSubmit = async (values: CreateUserFormValues) => {
    try {
      const result = await createUser.mutateAsync({
        username: values.username,
        displayNameI18n: { en: values.nameEn, ar: values.nameAr },
        roles: values.roles,
      });
      setCreateOpen(false);
      createUser.reset();
      setTemporaryPassword(result);
    } catch {
      // surfaced via createUser.isError/error in CreateUserDialog
    }
  };

  const onEditRolesSubmit = async (roles: string[]) => {
    if (!editRolesTarget?.id) return;
    try {
      await replaceRoles.mutateAsync({ id: editRolesTarget.id, roles });
      setEditRolesTarget(null);
      replaceRoles.reset();
    } catch {
      // surfaced via replaceRoles.isError/error in EditRolesDialog
    }
  };

  const onConfirmLock = async () => {
    if (!lockTarget?.id) return;
    try {
      await lockUser.mutateAsync(lockTarget.id);
      setLockTarget(null);
    } catch {
      // surfaced via lockUser.isError/error in the confirm dialog
    }
  };

  const onConfirmUnlock = async () => {
    if (!unlockTarget?.id) return;
    try {
      await unlockUser.mutateAsync(unlockTarget.id);
      setUnlockTarget(null);
    } catch {
      // surfaced via unlockUser.isError/error in the confirm dialog
    }
  };

  const onConfirmDisable = async () => {
    if (!disableTarget?.id) return;
    try {
      await disableUser.mutateAsync(disableTarget.id);
      setDisableTarget(null);
    } catch {
      // surfaced via disableUser.isError/error in the confirm dialog
    }
  };

  const onConfirmReset = async () => {
    if (!resetTarget?.id) return;
    try {
      const result = await resetPassword.mutateAsync(resetTarget.id);
      setResetTarget(null);
      resetPassword.reset();
      setTemporaryPassword(result);
    } catch {
      // surfaced via resetPassword.isError/error in the confirm dialog
    }
  };

  const onConfirmResetTotp = async () => {
    if (!resetTotpTarget?.id) return;
    try {
      await resetTotp.mutateAsync(resetTotpTarget.id);
      setResetTotpTarget(null);
      resetTotp.reset();
    } catch {
      // surfaced via resetTotp.isError/error in the confirm dialog
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>{t('users.title')}</h1>
        <button type="button" className={styles.createButton} onClick={() => setCreateOpen(true)}>
          {t('users.createCta')}
        </button>
      </div>

      {users.isPending && <p>{t('common.loading')}</p>}
      {users.isError && <ApiErrorBanner error={users.error} />}
      {users.data && (
        <UserList
          users={users.data}
          onEditRoles={setEditRolesTarget}
          onLock={setLockTarget}
          onUnlock={setUnlockTarget}
          onDisable={setDisableTarget}
          onResetPassword={setResetTarget}
          onResetTotp={setResetTotpTarget}
        />
      )}

      {createOpen && (
        <CreateUserDialog
          title={t('users.create.title')}
          isSubmitting={createUser.isPending}
          error={createUser.isError ? createUser.error : undefined}
          onSubmit={onCreateSubmit}
          onCancel={() => {
            setCreateOpen(false);
            createUser.reset();
          }}
        />
      )}

      {editRolesTarget && (
        <EditRolesDialog
          user={editRolesTarget}
          isSubmitting={replaceRoles.isPending}
          error={replaceRoles.isError ? replaceRoles.error : undefined}
          onSubmit={onEditRolesSubmit}
          onCancel={() => {
            setEditRolesTarget(null);
            replaceRoles.reset();
          }}
        />
      )}

      {lockTarget && (
        <ConfirmDialog
          titleId="lock-confirm-title"
          title={t('users.lockConfirm.title', { username: lockTarget.username ?? '' })}
          body={t('users.lockConfirm.body')}
          confirmLabel={
            lockUser.isPending ? t('users.lockConfirm.locking') : t('users.lockConfirm.confirm')
          }
          cancelLabel={t('users.lockConfirm.cancel')}
          isBusy={lockUser.isPending}
          errorMessage={lockUser.isError ? resolveActionError(lockUser.error) : undefined}
          onConfirm={onConfirmLock}
          onCancel={() => {
            setLockTarget(null);
            lockUser.reset();
          }}
        />
      )}

      {unlockTarget && (
        <ConfirmDialog
          titleId="unlock-confirm-title"
          title={t('users.unlockConfirm.title', { username: unlockTarget.username ?? '' })}
          body={t('users.unlockConfirm.body')}
          confirmLabel={
            unlockUser.isPending
              ? t('users.unlockConfirm.unlocking')
              : t('users.unlockConfirm.confirm')
          }
          cancelLabel={t('users.unlockConfirm.cancel')}
          isBusy={unlockUser.isPending}
          errorMessage={unlockUser.isError ? resolveError(unlockUser.error) : undefined}
          onConfirm={onConfirmUnlock}
          onCancel={() => {
            setUnlockTarget(null);
            unlockUser.reset();
          }}
        />
      )}

      {disableTarget && (
        <ConfirmDialog
          titleId="disable-confirm-title"
          title={t('users.disableConfirm.title', { username: disableTarget.username ?? '' })}
          body={t('users.disableConfirm.body')}
          confirmLabel={
            disableUser.isPending
              ? t('users.disableConfirm.disabling')
              : t('users.disableConfirm.confirm')
          }
          cancelLabel={t('users.disableConfirm.cancel')}
          isBusy={disableUser.isPending}
          errorMessage={disableUser.isError ? resolveActionError(disableUser.error) : undefined}
          onConfirm={onConfirmDisable}
          onCancel={() => {
            setDisableTarget(null);
            disableUser.reset();
          }}
        />
      )}

      {resetTarget && (
        <ConfirmDialog
          titleId="reset-password-confirm-title"
          title={t('users.resetConfirm.title', { username: resetTarget.username ?? '' })}
          body={t('users.resetConfirm.body')}
          confirmLabel={
            resetPassword.isPending
              ? t('users.resetConfirm.resetting')
              : t('users.resetConfirm.confirm')
          }
          cancelLabel={t('users.resetConfirm.cancel')}
          isBusy={resetPassword.isPending}
          errorMessage={resetPassword.isError ? resolveError(resetPassword.error) : undefined}
          onConfirm={onConfirmReset}
          onCancel={() => {
            setResetTarget(null);
            resetPassword.reset();
          }}
        />
      )}

      {resetTotpTarget && (
        <ConfirmDialog
          titleId="reset-totp-confirm-title"
          title={t('users.resetTotpConfirm.title', { username: resetTotpTarget.username ?? '' })}
          body={t('users.resetTotpConfirm.body')}
          confirmLabel={
            resetTotp.isPending
              ? t('users.resetTotpConfirm.resetting')
              : t('users.resetTotpConfirm.confirm')
          }
          cancelLabel={t('users.resetTotpConfirm.cancel')}
          isBusy={resetTotp.isPending}
          errorMessage={resetTotp.isError ? resolveError(resetTotp.error) : undefined}
          onConfirm={onConfirmResetTotp}
          onCancel={() => {
            setResetTotpTarget(null);
            resetTotp.reset();
          }}
        />
      )}

      {temporaryPassword?.temporaryPassword && (
        <TemporaryPasswordDialog
          titleId="temporary-password-title"
          title={t('users.temporaryPassword.title')}
          username={temporaryPassword.username ?? ''}
          password={temporaryPassword.temporaryPassword}
          onClose={() => setTemporaryPassword(null)}
        />
      )}
    </section>
  );
}
