import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { BUILDER_FIELD_TYPES, emptyRow, type BuilderFieldRow } from '../claimsBuilder';
import styles from './SchemaBuilderForm.module.css';

export interface SchemaBuilderFormValues {
  code: string;
  nameEn: string;
  nameAr: string;
  defaultMaxUses: string;
  defaultValidityDays: string;
  defaultValidityHours: string;
  rows: BuilderFieldRow[];
}

export type SchemaBuilderMode = 'create' | 'edit' | 'version';

interface SchemaBuilderFormProps {
  mode: SchemaBuilderMode;
  defaultValues: SchemaBuilderFormValues;
  onSubmit: (values: SchemaBuilderFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  error?: unknown;
}

function buildSchema(t: TFunction, requireCode: boolean) {
  const rowSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: t('schemaManagement.builder.fieldNameRequired') }),
    type: z.enum(['string', 'number', 'date']),
    labelEn: z
      .string()
      .trim()
      .min(1, { message: t('schemaManagement.builder.labelRequired') }),
    labelAr: z
      .string()
      .trim()
      .min(1, { message: t('schemaManagement.builder.labelRequired') }),
    selective: z.boolean(),
  });

  return z.object({
    code: requireCode
      ? z
          .string()
          .trim()
          .min(1, { message: t('schemaManagement.builder.codeRequired') })
      : z.string(),
    nameEn: z
      .string()
      .trim()
      .min(1, { message: t('schemaManagement.builder.nameRequired') }),
    nameAr: z
      .string()
      .trim()
      .min(1, { message: t('schemaManagement.builder.nameRequired') }),
    defaultMaxUses: z.string(),
    defaultValidityDays: z.string(),
    defaultValidityHours: z.string(),
    rows: z
      .array(rowSchema)
      .min(1, { message: t('schemaManagement.builder.atLeastOneField') })
      .superRefine((rows, ctx) => {
        const seen = new Set<string>();
        rows.forEach((row, index) => {
          const key = row.name.trim();
          if (!key) return;
          if (seen.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, 'name'],
              message: t('schemaManagement.builder.duplicateFieldName'),
            });
          }
          seen.add(key);
        });
      }),
  });
}

const SUBMIT_LABEL_KEY: Record<SchemaBuilderMode, string> = {
  create: 'schemaManagement.builder.submitCreate',
  edit: 'schemaManagement.builder.submitEdit',
  version: 'schemaManagement.builder.submitVersion',
};

export function SchemaBuilderForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: SchemaBuilderFormProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t, mode === 'create'), [t, mode]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SchemaBuilderFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'rows' });

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.header}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="schema-code">
            {t('schemaManagement.builder.code')}
          </label>
          {mode === 'create' ? (
            <>
              <span className={styles.help}>{t('schemaManagement.builder.codeHelp')}</span>
              <input id="schema-code" type="text" autoComplete="off" {...register('code')} />
              {errors.code && <span className={styles.fieldError}>{errors.code.message}</span>}
            </>
          ) : (
            <input
              id="schema-code"
              type="text"
              className={`${styles.readOnlyValue} ltr-embed`}
              value={defaultValues.code}
              disabled
              readOnly
            />
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="schema-nameEn">
            {t('schemaManagement.builder.nameEn')}
          </label>
          <input id="schema-nameEn" type="text" autoComplete="off" {...register('nameEn')} />
          {errors.nameEn && <span className={styles.fieldError}>{errors.nameEn.message}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="schema-nameAr">
            {t('schemaManagement.builder.nameAr')}
          </label>
          <input id="schema-nameAr" type="text" autoComplete="off" {...register('nameAr')} />
          {errors.nameAr && <span className={styles.fieldError}>{errors.nameAr.message}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="schema-defaultMaxUses">
            {t('schemaManagement.builder.defaultMaxUses')}
          </label>
          <span className={styles.help}>{t('schemaManagement.builder.defaultMaxUsesHelp')}</span>
          <input
            id="schema-defaultMaxUses"
            type="number"
            min={1}
            autoComplete="off"
            {...register('defaultMaxUses')}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="schema-defaultValidityDays">
            {t('schemaManagement.builder.defaultValidityDays')}
          </label>
          <input
            id="schema-defaultValidityDays"
            type="number"
            min={0}
            autoComplete="off"
            {...register('defaultValidityDays')}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="schema-defaultValidityHours">
            {t('schemaManagement.builder.defaultValidityHours')}
          </label>
          <input
            id="schema-defaultValidityHours"
            type="number"
            min={0}
            max={23}
            autoComplete="off"
            {...register('defaultValidityHours')}
          />
        </div>
      </div>

      <div className={styles.rowsBlock}>
        <div className={styles.rowsHead}>
          <h2 className={styles.rowsTitle}>{t('schemaManagement.builder.fieldsHeading')}</h2>
          <button type="button" className={styles.addButton} onClick={() => append(emptyRow())}>
            {t('schemaManagement.builder.addField')}
          </button>
        </div>
        {errors.rows?.message && <span className={styles.fieldError}>{errors.rows.message}</span>}

        {fields.map((field, index) => (
          <div key={field.id} className={styles.row}>
            <div className={styles.rowFields}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`rows.${index}.name`}>
                  {t('schemaManagement.builder.fieldName')}
                </label>
                <input
                  id={`rows.${index}.name`}
                  type="text"
                  autoComplete="off"
                  {...register(`rows.${index}.name`)}
                />
                {errors.rows?.[index]?.name && (
                  <span className={styles.fieldError}>{errors.rows[index]?.name?.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`rows.${index}.type`}>
                  {t('schemaManagement.builder.fieldType')}
                </label>
                <select id={`rows.${index}.type`} {...register(`rows.${index}.type`)}>
                  {BUILDER_FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`schemaManagement.builder.type${type[0].toUpperCase()}${type.slice(1)}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`rows.${index}.labelEn`}>
                  {t('schemaManagement.builder.fieldLabelEn')}
                </label>
                <input
                  id={`rows.${index}.labelEn`}
                  type="text"
                  autoComplete="off"
                  {...register(`rows.${index}.labelEn`)}
                />
                {errors.rows?.[index]?.labelEn && (
                  <span className={styles.fieldError}>{errors.rows[index]?.labelEn?.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`rows.${index}.labelAr`}>
                  {t('schemaManagement.builder.fieldLabelAr')}
                </label>
                <input
                  id={`rows.${index}.labelAr`}
                  type="text"
                  autoComplete="off"
                  {...register(`rows.${index}.labelAr`)}
                />
                {errors.rows?.[index]?.labelAr && (
                  <span className={styles.fieldError}>{errors.rows[index]?.labelAr?.message}</span>
                )}
              </div>
              <div className={styles.checkboxField}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register(`rows.${index}.selective`)} />
                  {t('schemaManagement.builder.fieldSelective')}
                </label>
              </div>
            </div>
            <div className={styles.rowActions}>
              <button
                type="button"
                className={styles.rowActionButton}
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
              >
                {t('schemaManagement.builder.moveUp')}
              </button>
              <button
                type="button"
                className={styles.rowActionButton}
                onClick={() => move(index, index + 1)}
                disabled={index === fields.length - 1}
              >
                {t('schemaManagement.builder.moveDown')}
              </button>
              <button type="button" className={styles.removeButton} onClick={() => remove(index)}>
                {t('schemaManagement.builder.removeField')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <ApiErrorBanner error={error} />
      <div className={styles.actions}>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            {t('common.back')}
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? t('schemaManagement.builder.submitting') : t(SUBMIT_LABEL_KEY[mode])}
        </button>
      </div>
    </form>
  );
}
