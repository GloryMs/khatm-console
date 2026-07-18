import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { useSchemas } from '../hooks';
import styles from './SchemaList.module.css';

export function SchemaList() {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const { data, isPending, isError, error } = useSchemas();

  if (isPending) return <p>{t('common.loading')}</p>;
  if (isError) return <ApiErrorBanner error={error} />;
  if (data.length === 0) return <p>{t('schemas.empty')}</p>;

  return (
    <ul className={styles.list}>
      {data.map((schema) => (
        <li key={schema.id} className={styles.item}>
          <span className={styles.name}>{localize(schema.nameI18n)}</span>
          <span className={`${styles.meta} ltr-embed`}>
            <span>{t('schemas.version', { version: schema.version })}</span>
            <span className={styles.status}>{schema.status}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
