import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField, khatmInputClass } from '@/components/ui/FormField';
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
      <FormField label={t('credentials.filters.ref')} htmlFor="cred-ref">
        <input
          id="cred-ref"
          type="text"
          autoComplete="off"
          className={khatmInputClass()}
          {...register('ref')}
        />
      </FormField>
      <FormField label={t('credentials.filters.pseudoRef')} htmlFor="cred-pseudoRef">
        <input
          id="cred-pseudoRef"
          type="text"
          autoComplete="off"
          className={khatmInputClass()}
          {...register('pseudoRef')}
        />
      </FormField>
      <FormField label={t('credentials.filters.schema')} htmlFor="cred-schema">
        <select id="cred-schema" className={khatmInputClass()} {...register('schemaId')}>
          <option value="">{t('credentials.filters.schemaAny')}</option>
          {schemas.map((schema) => (
            <option key={schema.id} value={schema.id}>
              {localize(schema.nameI18n) || schema.code}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('credentials.filters.revoked')} htmlFor="cred-revoked">
        <select id="cred-revoked" className={khatmInputClass()} {...register('revoked')}>
          <option value="any">{t('credentials.filters.revokedAny')}</option>
          <option value="yes">{t('credentials.filters.revokedYes')}</option>
          <option value="no">{t('credentials.filters.revokedNo')}</option>
        </select>
      </FormField>
      <div className={styles.actions}>
        <Button type="submit" variant="primary">
          {t('credentials.filters.search')}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          {t('credentials.filters.reset')}
        </Button>
      </div>
    </form>
  );
}
