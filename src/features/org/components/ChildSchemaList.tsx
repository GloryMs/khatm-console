import { useTranslation } from 'react-i18next';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { SchemaSummary } from '@/features/schemas/api';
import styles from './ChildSchemaList.module.css';

function schemaStatusTone(status: string | undefined): StatusTone {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'ARCHIVED') return 'neutral';
  return 'warning'; // DRAFT
}

/** A direct child's schemas, read-only — org:admin views but never manages a child's schemas (spec §3). */
export function ChildSchemaList({ schemas }: { schemas: SchemaSummary[] }) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  if (schemas.length === 0) {
    return <div className="emptyState">{t('org.child.schemasEmpty')}</div>;
  }

  return (
    <ul className={styles.list}>
      {schemas.map((schema) => (
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
