import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import tableStyles from '@/components/ui/Table.module.css';
import type { SchemaSummary } from '@/features/schemas/api';
import styles from './ManagementList.module.css';

interface ManagementListProps {
  schemas: SchemaSummary[];
  onPublish: (schema: SchemaSummary) => void;
  onArchive: (schema: SchemaSummary) => void;
}

function schemaStatusTone(status: string | undefined): StatusTone {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'ARCHIVED') return 'neutral';
  return 'warning'; // DRAFT — in progress
}

export function ManagementList({ schemas, onPublish, onArchive }: ManagementListProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  if (schemas.length === 0) {
    return <div className="emptyState">{t('schemaManagement.empty')}</div>;
  }

  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th>{t('schemaManagement.columnName')}</th>
          <th className={tableStyles.codeCell}>{t('schemaManagement.columnCode')}</th>
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
              <td className={tableStyles.codeCell}>
                {schema.code} · {t('schemas.version', { version: schema.version })}
              </td>
              <td>
                <StatusBadge tone={schemaStatusTone(schema.status)}>{statusLabel}</StatusBadge>
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
