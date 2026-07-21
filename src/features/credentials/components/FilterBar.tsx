import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { SchemaSummary } from '@/features/schemas/api';
import { BLANK_FILTERS, type FilterFormValues } from '../queryParams';
import styles from './FilterBar.module.css';

const filterSchema = z.object({
  ref: z.string(),
  pseudoRef: z.string(),
  schemaId: z.string(),
  revoked: z.enum(['any', 'yes', 'no']),
});

interface FilterBarProps {
  schemas: SchemaSummary[];
  onSearch: (values: FilterFormValues) => void;
}

export function FilterBar({ schemas, onSearch }: FilterBarProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: BLANK_FILTERS,
  });

  const onReset = () => {
    reset(BLANK_FILTERS);
    onSearch(BLANK_FILTERS);
  };

  return (
    <form className={styles.bar} onSubmit={handleSubmit(onSearch)} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cred-ref">
          {t('credentials.filters.ref')}
        </label>
        <input id="cred-ref" type="text" autoComplete="off" {...register('ref')} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cred-pseudoRef">
          {t('credentials.filters.pseudoRef')}
        </label>
        <input id="cred-pseudoRef" type="text" autoComplete="off" {...register('pseudoRef')} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cred-schema">
          {t('credentials.filters.schema')}
        </label>
        <select id="cred-schema" {...register('schemaId')}>
          <option value="">{t('credentials.filters.schemaAny')}</option>
          {schemas.map((schema) => (
            <option key={schema.id} value={schema.id}>
              {localize(schema.nameI18n) || schema.code}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cred-revoked">
          {t('credentials.filters.revoked')}
        </label>
        <select id="cred-revoked" {...register('revoked')}>
          <option value="any">{t('credentials.filters.revokedAny')}</option>
          <option value="yes">{t('credentials.filters.revokedYes')}</option>
          <option value="no">{t('credentials.filters.revokedNo')}</option>
        </select>
      </div>
      <div className={styles.actions}>
        <button type="submit" className={styles.searchButton}>
          {t('credentials.filters.search')}
        </button>
        <button type="button" className={styles.resetButton} onClick={onReset}>
          {t('credentials.filters.reset')}
        </button>
      </div>
    </form>
  );
}
