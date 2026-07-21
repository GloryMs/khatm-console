import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useErrorMessage } from '@/api/useErrorMessage';
import { RequireScope } from '@/features/auth/RequireScope';
import type { SchemaSummary } from '@/features/schemas/api';
import { ManagementList } from './components/ManagementList';
import { useArchiveSchema, useManagedSchemas, usePublishSchema } from './hooks';
import styles from './SchemaManagementPage.module.css';

export function SchemaManagementPage() {
  return (
    <RequireScope scope="admin">
      <SchemaManagementPageBody />
    </RequireScope>
  );
}

function SchemaManagementPageBody() {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();
  const schemas = useManagedSchemas();
  const publish = usePublishSchema();
  const archive = useArchiveSchema();
  const [publishTarget, setPublishTarget] = useState<SchemaSummary | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<SchemaSummary | null>(null);

  const onConfirmPublish = async () => {
    if (!publishTarget?.id) return;
    await publish.mutateAsync(publishTarget.id);
    setPublishTarget(null);
  };

  const onConfirmArchive = async () => {
    if (!archiveTarget?.id) return;
    await archive.mutateAsync(archiveTarget.id);
    setArchiveTarget(null);
  };

  return (
    <section className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>{t('schemaManagement.title')}</h1>
        <Link className={styles.createLink} to="/schemas/manage/new">
          {t('schemaManagement.createCta')}
        </Link>
      </div>

      {schemas.isPending && <p>{t('common.loading')}</p>}
      {schemas.isError && <ApiErrorBanner error={schemas.error} />}
      {schemas.data && (
        <ManagementList
          schemas={schemas.data}
          onPublish={setPublishTarget}
          onArchive={setArchiveTarget}
        />
      )}

      {publishTarget && (
        <ConfirmDialog
          titleId="publish-confirm-title"
          title={t('schemaManagement.publishConfirm.title')}
          body={t('schemaManagement.publishConfirm.body')}
          confirmLabel={
            publish.isPending
              ? t('schemaManagement.publishConfirm.publishing')
              : t('schemaManagement.publishConfirm.confirm')
          }
          cancelLabel={t('schemaManagement.publishConfirm.cancel')}
          isBusy={publish.isPending}
          errorMessage={publish.isError ? resolveError(publish.error) : undefined}
          onConfirm={onConfirmPublish}
          onCancel={() => {
            setPublishTarget(null);
            publish.reset();
          }}
        />
      )}

      {archiveTarget && (
        <ConfirmDialog
          titleId="archive-confirm-title"
          title={t('schemaManagement.archiveConfirm.title')}
          body={t('schemaManagement.archiveConfirm.body')}
          confirmLabel={
            archive.isPending
              ? t('schemaManagement.archiveConfirm.archiving')
              : t('schemaManagement.archiveConfirm.confirm')
          }
          cancelLabel={t('schemaManagement.archiveConfirm.cancel')}
          isBusy={archive.isPending}
          errorMessage={archive.isError ? resolveError(archive.error) : undefined}
          onConfirm={onConfirmArchive}
          onCancel={() => {
            setArchiveTarget(null);
            archive.reset();
          }}
        />
      )}
    </section>
  );
}
