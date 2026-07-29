import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { TemporaryPasswordDialog } from '@/components/ui/TemporaryPasswordDialog';
import { RequireScope } from '@/features/auth/RequireScope';
import { CreateTenantDialog, type CreateTenantFormValues } from './components/CreateTenantDialog';
import { TenantList } from './components/TenantList';
import type { InitialAdminRequest, TenantType } from './api';
import { useCreateTenant, useTenants } from './hooks';
import styles from './TenantsPage.module.css';

export function TenantsPage() {
  return (
    <RequireScope scope="platform:admin">
      <TenantsPageBody />
    </RequireScope>
  );
}

function TenantsPageBody() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenants = useTenants();
  const createTenant = useCreateTenant();
  const [createOpen, setCreateOpen] = useState(false);
  const [initialAdminPassword, setInitialAdminPassword] = useState<{
    username: string;
    temporaryPassword: string;
  } | null>(null);
  const [pendingNavigateId, setPendingNavigateId] = useState<string | null>(null);

  const onCreateSubmit = async (values: CreateTenantFormValues) => {
    const initialAdmin: InitialAdminRequest | undefined = values.addInitialAdmin
      ? {
          username: values.initialAdminUsername,
          displayNameI18n: { en: values.initialAdminNameEn, ar: values.initialAdminNameAr },
        }
      : undefined;
    const created = await createTenant.mutateAsync({
      slug: values.slug,
      nameI18n: { en: values.nameEn, ar: values.nameAr },
      type: values.type as TenantType,
      deployMode: values.deployMode,
      initialAdmin,
    });
    setCreateOpen(false);
    createTenant.reset();
    // The one-time temporary password must be shown before navigating away —
    // the platform never returns it again (spec FS-2.2 D6).
    if (created.initialAdmin?.temporaryPassword) {
      setInitialAdminPassword({
        username: created.initialAdmin.username ?? initialAdmin?.username ?? '',
        temporaryPassword: created.initialAdmin.temporaryPassword,
      });
      setPendingNavigateId(created.id ?? null);
    } else {
      navigate(`/tenants/${created.id}`);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>{t('tenants.title')}</h1>
        <button type="button" className={styles.createButton} onClick={() => setCreateOpen(true)}>
          {t('tenants.createCta')}
        </button>
      </div>

      {tenants.isPending && <p>{t('common.loading')}</p>}
      {tenants.isError && <ApiErrorBanner error={tenants.error} />}
      {tenants.data && <TenantList tenants={tenants.data} />}

      {createOpen && (
        <CreateTenantDialog
          isSubmitting={createTenant.isPending}
          error={createTenant.isError ? createTenant.error : undefined}
          onSubmit={onCreateSubmit}
          onCancel={() => {
            setCreateOpen(false);
            createTenant.reset();
          }}
        />
      )}

      {initialAdminPassword && (
        <TemporaryPasswordDialog
          titleId="initial-admin-password-title"
          title={t('tenants.create.initialAdminPasswordTitle')}
          username={initialAdminPassword.username}
          password={initialAdminPassword.temporaryPassword}
          onClose={() => {
            setInitialAdminPassword(null);
            if (pendingNavigateId) navigate(`/tenants/${pendingNavigateId}`);
          }}
        />
      )}
    </section>
  );
}
