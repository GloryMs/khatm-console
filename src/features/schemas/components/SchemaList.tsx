import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { useSchemas } from '../hooks';
import styles from './SchemaList.module.css';

function schemaStatusTone(status: string | undefined): StatusTone {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'ARCHIVED') return 'neutral';
  return 'warning'; // DRAFT
}

export function SchemaList() {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const { data, isPending, isError, error } = useSchemas();

  if (isPending) return <p>{t('common.loading')}</p>;
  if (isError) return <ApiErrorBanner error={error} />;
  if (data.length === 0) {
    return <div className="emptyState">{t('schemas.empty')}</div>;
  }

  return (
    <ul className={styles.list}>
      {data.map((schema) => (
        <li key={schema.id} className={styles.item}>
          <span className={styles.name}>{localize(schema.nameI18n)}</span>
          <span className={`${styles.meta} ltr-embed`}>
            <span>{t('schemas.version', { version: schema.version })}</span>
            <StatusBadge tone={schemaStatusTone(schema.status)}>{schema.status}</StatusBadge>
          </span>
        </li>
      ))}
    </ul>
  );
}
