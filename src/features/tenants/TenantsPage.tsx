import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { RequireScope } from '@/features/auth/RequireScope';
import { CreateTenantDialog, type CreateTenantFormValues } from './components/CreateTenantDialog';
import { TenantList } from './components/TenantList';
import type { TenantType } from './api';
import { useCreateTenant, useTenants } from './hooks';
import styles from './TenantsPage.module.css';

export function TenantsPage() {
  return (
    <RequireScope scope="admin">
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

  const onCreateSubmit = async (values: CreateTenantFormValues) => {
    const created = await createTenant.mutateAsync({
      slug: values.slug,
      nameI18n: { en: values.nameEn, ar: values.nameAr },
      type: values.type as TenantType,
      deployMode: values.deployMode,
    });
    setCreateOpen(false);
    createTenant.reset();
    navigate(`/tenants/${created.id}`);
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
    </section>
  );
}
