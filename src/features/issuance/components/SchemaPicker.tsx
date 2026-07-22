import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { SchemaSummary } from '../api';
import styles from './SchemaPicker.module.css';

interface SchemaPickerProps {
  schemas: SchemaSummary[];
  onPick: (schema: SchemaSummary) => void;
}

/**
 * Lists PUBLISHED schemas for a picker step. Shared by the single-issue flow
 * (`IssuePage`) and the bulk issuance wizard (`BulkIssuePage`) — both issue
 * against the same kind of schema, so the picker step is identical.
 */
export function SchemaPicker({ schemas, onPick }: SchemaPickerProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  if (schemas.length === 0) return <p className={styles.help}>{t('issue.noSchemas')}</p>;

  return (
    <ul className={styles.schemaList}>
      {schemas.map((schema) => {
        const label = localize(schema.nameI18n) || schema.code || schema.id || '';
        return (
          <li key={schema.id}>
            <button type="button" className={styles.schemaButton} onClick={() => onPick(schema)}>
              <span className={styles.schemaName}>{label}</span>
              <span className={`${styles.schemaMeta} ltr-embed`}>
                <span>{schema.code}</span>
                <span>{t('schemas.version', { version: schema.version })}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
