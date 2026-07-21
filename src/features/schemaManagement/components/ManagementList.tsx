import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { SchemaSummary } from '@/features/schemas/api';
import styles from './ManagementList.module.css';

interface ManagementListProps {
  schemas: SchemaSummary[];
  onPublish: (schema: SchemaSummary) => void;
  onArchive: (schema: SchemaSummary) => void;
}

function statusBadgeClass(status: string | undefined, styles_: typeof styles): string {
  if (status === 'PUBLISHED') return styles_.statusPublished;
  if (status === 'ARCHIVED') return styles_.statusArchived;
  return styles_.statusDraft;
}

export function ManagementList({ schemas, onPublish, onArchive }: ManagementListProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  if (schemas.length === 0) return <p>{t('schemaManagement.empty')}</p>;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>{t('schemaManagement.columnName')}</th>
          <th className="ltr-embed">{t('schemaManagement.columnCode')}</th>
          <th>{t('schemaManagement.columnStatus')}</th>
          <th>{t('schemaManagement.columnActions')}</th>
        </tr>
      </thead>
      <tbody>
        {schemas.map((schema) => {
          const id = schema.id ?? '';
          const statusLabel =
            schema.status === 'PUBLISHED'
              ? t('schemaManagement.statusPublished')
              : schema.status === 'ARCHIVED'
                ? t('schemaManagement.statusArchived')
                : t('schemaManagement.statusDraft');
          return (
            <tr key={id}>
              <td>{localize(schema.nameI18n)}</td>
              <td className="ltr-embed">
                {schema.code} · {t('schemas.version', { version: schema.version })}
              </td>
              <td>
                <span className={`${styles.status} ${statusBadgeClass(schema.status, styles)}`}>
                  {statusLabel}
                </span>
              </td>
              <td>
                <div className={styles.actions}>
                  {schema.status === 'DRAFT' && (
                    <>
                      <Link className={styles.action} to={`/schemas/manage/${id}/edit`}>
                        {t('schemaManagement.actionEdit')}
                      </Link>
                      <button
                        type="button"
                        className={styles.action}
                        onClick={() => onPublish(schema)}
                      >
                        {t('schemaManagement.actionPublish')}
                      </button>
                    </>
                  )}
                  {schema.status === 'PUBLISHED' && (
                    <>
                      <Link className={styles.action} to={`/schemas/manage/${id}/version`}>
                        {t('schemaManagement.actionNewVersion')}
                      </Link>
                      <button
                        type="button"
                        className={styles.action}
                        onClick={() => onArchive(schema)}
                      >
                        {t('schemaManagement.actionArchive')}
                      </button>
                    </>
                  )}
                  {schema.status === 'ARCHIVED' && (
                    <Link className={styles.action} to={`/schemas/manage/${id}`}>
                      {t('schemaManagement.actionView')}
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
