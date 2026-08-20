import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { TemporaryPasswordDialog } from '@/components/ui/TemporaryPasswordDialog';
import { Toast } from '@/components/ui/Toast';
import { copyToClipboard } from '@/components/ui/clipboard';
import { useErrorMessage } from '@/api/useErrorMessage';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { RequireScope } from '@/features/auth/RequireScope';
import {
  CreateUserDialog,
  type CreateUserFormValues,
} from '@/features/users/components/CreateUserDialog';
import { UserList } from '@/features/users/components/UserList';
import type { CreateUserResponse, UserSummary } from './api';
import { buildTenantJwksUrl } from './jwks';
import { SetParentDialog, type SetParentFormValues } from './components/SetParentDialog';
import { TenantList } from './components/TenantList';
import {
  useActivateTenant,
  useCreateUserInTenant,
  useResetTotpInTenant,
  useSetParentTenant,
  useSuspendTenant,
  useTenant,
  useTenantUsers,
  useTenants,
} from './hooks';
import styles from './TenantDetailPage.module.css';

type DetailTab = 'details' | 'users';

export function TenantDetailPage() {
  return (
    <RequireScope scope="platform:admin">
      <TenantDetailPageBody />
    </RequireScope>
  );
}

function TenantDetailPageBody() {
  const { t, i18n } = useTranslation();
  const resolveError = useErrorMessage();
  const localize = useLocalizedText();
  const params = useParams<{ id: string }>();
  const tenant = useTenant(params.id);
  const allTenants = useTenants();
  const suspend = useSuspendTenant();
  const activate = useActivateTenant();
  const createUserInTenant = useCreateUserInTenant();
  const resetTotpInTenant = useResetTotpInTenant();
  const setParentTenant = useSetParentTenant();
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('details');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null);
  const [resetTotpTarget, setResetTotpTarget] = useState<UserSummary | null>(null);
  const [setParentOpen, setSetParentOpen] = useState(false);
  const tenantUsers = useTenantUsers(activeTab === 'users' ? params.id : undefined);

  if (tenant.isPending) return <p>{t('common.loading')}</p>;
  if (tenant.isError) return <ApiErrorBanner error={tenant.error} />;
  if (!tenant.data) return null;

  const data = tenant.data;
  const id = data.id ?? '';
  const isActive = data.status === 'ACTIVE';
  const tone: StatusTone = isActive ? 'success' : 'warning';
  const createdAt = data.createdAt
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(data.createdAt),
      )
    : '';
  const jwksUrl = data.slug ? buildTenantJwksUrl(data.slug) : '';
  const children = allTenants.data?.filter((other) => other.parentSlug === data.slug) ?? [];
  const parentCandidates = allTenants.data?.filter((other) => other.status === 'ACTIVE') ?? [];

  const onSetParentSubmit = async (values: SetParentFormValues) => {
    try {
      await setParentTenant.mutateAsync({ id, parentSlug: values.parentSlug || undefined });
      setSetParentOpen(false);
      setParentTenant.reset();
    } catch {
      // surfaced via setParentTenant.isError/error in SetParentDialog
    }
  };

  const onConfirm = async () => {
    if (confirmAction === 'suspend') {
      await suspend.mutateAsync(id);
    } else if (confirmAction === 'activate') {
      await activate.mutateAsync(id);
    }
    setConfirmAction(null);
  };

  const activeMutation = confirmAction === 'suspend' ? suspend : activate;

  const onCreateUserSubmit = async (values: CreateUserFormValues) => {
    const result = await createUserInTenant.mutateAsync({
      tenantId: id,
      req: {
        username: values.username,
        displayNameI18n: { en: values.nameEn, ar: values.nameAr },
        roles: values.roles,
      },
    });
    setCreateUserOpen(false);
    createUserInTenant.reset();
    setCreatedUser(result);
  };

  const onConfirmResetTotp = async () => {
    if (!resetTotpTarget?.id || !id) return;
    try {
      await resetTotpInTenant.mutateAsync({ tenantId: id, userId: resetTotpTarget.id });
      setResetTotpTarget(null);
      resetTotpInTenant.reset();
    } catch {
      // surfaced via resetTotpInTenant.isError/error in the confirm dialog
    }
  };

  return (
    <section className={styles.page}>
      <Link className={styles.back} to="/tenants">
        {t('tenants.detail.backToList')}
      </Link>

      <div className={styles.headRow}>
        <h1 className={styles.title}>{localize(data.nameI18n) || data.slug}</h1>
        <StatusBadge tone={tone}>
          {isActive ? t('tenants.statusActive') : t('tenants.statusSuspended')}
        </StatusBadge>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'details'}
          className={activeTab === 'details' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('details')}
        >
          {t('tenants.detail.tabDetails')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={activeTab === 'users' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('users')}
        >
          {t('tenants.detail.tabUsers')}
        </button>
      </div>

      {activeTab === 'details' && (
        <>
          <div className={styles.fieldGrid}>
            <span className={styles.fieldLabel}>{t('tenants.columnSlug')}</span>
            <span className={`${styles.fieldValue} ltr-embed`}>{data.slug}</span>

            <span className={styles.fieldLabel}>{t('tenants.detail.nameEn')}</span>
            <span className={styles.fieldValue}>{data.nameI18n?.en}</span>

            <span className={styles.fieldLabel}>{t('tenants.detail.nameAr')}</span>
            <span className={styles.fieldValue}>{data.nameI18n?.ar}</span>

            <span className={styles.fieldLabel}>{t('tenants.columnType')}</span>
            <span className={styles.fieldValue}>
              {data.type ? t(`tenants.type.${data.type}`) : ''}
            </span>

            <span className={styles.fieldLabel}>{t('tenants.detail.deployMode')}</span>
            <span className={styles.fieldValue}>
              {data.deployMode ? t(`tenants.deployMode.${data.deployMode}`) : ''}
            </span>

            <span className={styles.fieldLabel}>{t('tenants.columnCreatedAt')}</span>
            <span className={styles.fieldValue}>{createdAt}</span>
          </div>

          <div className={styles.jwksCard}>
            <h2 className={styles.fieldLabel}>{t('tenants.detail.jwksTitle')}</h2>
            <p>{t('tenants.detail.jwksHelp')}</p>
            <div className={styles.jwksRow}>
              <a
                className={`${styles.jwksLink} ltr-embed`}
                href={jwksUrl}
                target="_blank"
                rel="noreferrer"
              >
                {jwksUrl}
              </a>
              <Button
                variant="secondary"
                onClick={() => {
                  void copyToClipboard(jwksUrl);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
              >
                {t('common.copy')}
              </Button>
            </div>
            {copied && <Toast tone="success">{t('common.copied')}</Toast>}
          </div>

          <div className={styles.jwksCard}>
            <h2 className={styles.fieldLabel}>{t('tenants.detail.hierarchyTitle')}</h2>
            {data.parentSlug ? (
              <p>
                {t('tenants.detail.parentLabel', {
                  parent: localize(data.parentNameI18n) || data.parentSlug,
                })}
              </p>
            ) : (
              <p>{t('tenants.detail.noParent')}</p>
            )}
            <div className={styles.actionsRow}>
              <Button variant="secondary" onClick={() => setSetParentOpen(true)}>
                {data.parentSlug
                  ? t('tenants.detail.actionChangeParent')
                  : t('tenants.detail.actionSetParent')}
              </Button>
            </div>

            <h2 className={styles.fieldLabel}>{t('tenants.detail.childrenTitle')}</h2>
            {children.length === 0 ? (
              <p>{t('tenants.detail.noChildren')}</p>
            ) : (
              <TenantList tenants={children} />
            )}
          </div>

          <div className={styles.actionsRow}>
            {isActive ? (
              <Button variant="secondary" onClick={() => setConfirmAction('suspend')}>
                {t('tenants.detail.actionSuspend')}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setConfirmAction('activate')}>
                {t('tenants.detail.actionActivate')}
              </Button>
            )}
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className={styles.usersTab}>
          <Banner tone="info">
            <p>
              {t('tenants.detail.onBehalfOfNotice', {
                tenant: localize(data.nameI18n) || data.slug,
              })}
            </p>
          </Banner>
          <div className={styles.actionsRow}>
            <Button variant="primary" onClick={() => setCreateUserOpen(true)}>
              {t('tenants.detail.addUserCta')}
            </Button>
          </div>
          {tenantUsers.isPending && <p>{t('common.loading')}</p>}
          {tenantUsers.isError && <ApiErrorBanner error={tenantUsers.error} />}
          {tenantUsers.data && (
            <UserList users={tenantUsers.data} onResetTotp={setResetTotpTarget} />
          )}
        </div>
      )}

      {createUserOpen && (
        <CreateUserDialog
          titleId="on-behalf-of-create-user-title"
          title={t('tenants.detail.addUserTitle')}
          isSubmitting={createUserInTenant.isPending}
          error={createUserInTenant.isError ? createUserInTenant.error : undefined}
          onSubmit={onCreateUserSubmit}
          onCancel={() => {
            setCreateUserOpen(false);
            createUserInTenant.reset();
          }}
        />
      )}

      {createdUser?.temporaryPassword && (
        <TemporaryPasswordDialog
          titleId="on-behalf-of-temporary-password-title"
          title={t('users.temporaryPassword.title')}
          username={createdUser.username ?? ''}
          password={createdUser.temporaryPassword}
          onClose={() => setCreatedUser(null)}
        />
      )}

      {resetTotpTarget && (
        <ConfirmDialog
          titleId="reset-totp-confirm-title"
          title={t('users.resetTotpConfirm.title', { username: resetTotpTarget.username ?? '' })}
          body={t('users.resetTotpConfirm.body')}
          confirmLabel={
            resetTotpInTenant.isPending
              ? t('users.resetTotpConfirm.resetting')
              : t('users.resetTotpConfirm.confirm')
          }
          cancelLabel={t('users.resetTotpConfirm.cancel')}
          isBusy={resetTotpInTenant.isPending}
          errorMessage={
            resetTotpInTenant.isError ? resolveError(resetTotpInTenant.error) : undefined
          }
          onConfirm={onConfirmResetTotp}
          onCancel={() => {
            setResetTotpTarget(null);
            resetTotpInTenant.reset();
          }}
        />
      )}

      {setParentOpen && (
        <SetParentDialog
          tenant={data}
          candidates={parentCandidates}
          isSubmitting={setParentTenant.isPending}
          error={setParentTenant.isError ? setParentTenant.error : undefined}
          onSubmit={onSetParentSubmit}
          onCancel={() => {
            setSetParentOpen(false);
            setParentTenant.reset();
          }}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          titleId="tenant-status-confirm-title"
          title={
            confirmAction === 'suspend'
              ? t('tenants.suspendConfirm.title')
              : t('tenants.activateConfirm.title')
          }
          body={
            confirmAction === 'suspend'
              ? t('tenants.suspendConfirm.body')
              : t('tenants.activateConfirm.body')
          }
          confirmLabel={
            activeMutation.isPending
              ? confirmAction === 'suspend'
                ? t('tenants.suspendConfirm.suspending')
                : t('tenants.activateConfirm.activating')
              : confirmAction === 'suspend'
                ? t('tenants.suspendConfirm.confirm')
                : t('tenants.activateConfirm.confirm')
          }
          cancelLabel={
            confirmAction === 'suspend'
              ? t('tenants.suspendConfirm.cancel')
              : t('tenants.activateConfirm.cancel')
          }
          isBusy={activeMutation.isPending}
          errorMessage={activeMutation.isError ? resolveError(activeMutation.error) : undefined}
          onConfirm={onConfirm}
          onCancel={() => {
            setConfirmAction(null);
            suspend.reset();
            activate.reset();
          }}
        />
      )}
    </section>
  );
}
