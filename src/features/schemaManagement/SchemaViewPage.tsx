import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { RequireScope } from '@/features/auth/RequireScope';
import { fromSchemaDetail } from './claimsBuilder';
import { useManagedSchema } from './hooks';
import styles from './SchemaViewPage.module.css';

export function SchemaViewPage() {
  return (
    <RequireScope scope="admin">
      <SchemaViewPageBody />
    </RequireScope>
  );
}

function SchemaViewPageBody() {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const params = useParams<{ id: string }>();
  const detail = useManagedSchema(params.id ?? null);

  if (detail.isPending) return <p>{t('common.loading')}</p>;
  if (detail.isError) return <ApiErrorBanner error={detail.error} />;
  if (!detail.data) return null;

  const rows = fromSchemaDetail(detail.data);

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{localize(detail.data.nameI18n) || detail.data.code}</h1>
      <p className={`${styles.meta} ltr-embed`}>
        {detail.data.code} · {t('schemas.version', { version: detail.data.version })}
      </p>
      <ul className={styles.fieldList}>
        {rows.map((row) => (
          <li key={row.name} className={styles.fieldItem}>
            <span className={styles.fieldName}>
              {localize({ en: row.labelEn, ar: row.labelAr })}
            </span>
            <span className={`${styles.fieldMeta} ltr-embed`}>
              {row.name} · {row.type}
            </span>
            {row.selective && (
              <span className={styles.badge}>{t('issue.selectiveDisclosure')}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
