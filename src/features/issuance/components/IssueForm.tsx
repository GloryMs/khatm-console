import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { isKnownFieldType, isSelective, type ClaimField } from '../claimsDef';
import styles from './IssueForm.module.css';

/** Collected issue values. `claims` keys are the schema's field names. */
export interface IssueFormValues {
  holderRef: string;
  maxUses: string;
  validMinutes: string;
  claims: Record<string, string>;
}

export interface IssueFormDefaults {
  maxUses?: string;
  validMinutes?: string;
}

interface IssueFormProps {
  fields: ClaimField[];
  onSubmit: (values: IssueFormValues) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
  error?: unknown;
  defaults?: IssueFormDefaults;
  sdFields?: readonly string[];
}

function buildSchema(fields: ClaimField[], t: TFunction, localize: (text: unknown) => string) {
  const claimShape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    const label = localize(field.labelI18n) || field.name;
    // `.min` must run on the ZodString before any `.refine` wraps it in ZodEffects.
    let stringSchema: z.ZodString = z.string();
    if (field.required) {
      stringSchema = stringSchema.min(1, { message: t('issue.fieldRequired', { field: label }) });
    }
    let fieldSchema: z.ZodTypeAny = stringSchema;
    if (field.type === 'number') {
      fieldSchema = stringSchema.refine((value) => value === '' || /^-?\d+(\.\d+)?$/.test(value), {
        message: t('issue.fieldInvalidNumber', { field: label }),
      });
    } else if (field.type === 'date') {
      fieldSchema = stringSchema.refine(
        (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
        { message: t('issue.fieldInvalidDate', { field: label }) },
      );
    }
    claimShape[field.name] = fieldSchema;
  }

  return z.object({
    holderRef: z.string().min(1, { message: t('issue.holderRefRequired') }),
    maxUses: z.string(),
    validMinutes: z.string(),
    claims: z.object(claimShape),
  });
}

function defaultValues(
  fields: ClaimField[],
  defaults: IssueFormDefaults | undefined,
): IssueFormValues {
  const claims: Record<string, string> = {};
  for (const field of fields) claims[field.name] = '';
  return {
    holderRef: '',
    maxUses: defaults?.maxUses ?? '',
    validMinutes: defaults?.validMinutes ?? '',
    claims,
  };
}

export function IssueForm({
  fields,
  onSubmit,
  onBack,
  isSubmitting,
  error,
  defaults,
  sdFields = [],
}: IssueFormProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const schema = useMemo(
    () => buildSchema(fields, t, localize as (text: unknown) => string),
    [fields, t, localize],
  );

  const formDefaults = useMemo(() => defaultValues(fields, defaults), [fields, defaults]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(schema),
    defaultValues: formDefaults,
  });

  // Render unknown field types as text, with one dev-only warning so an author
  // notices the gap (work rule: tolerate, don't crash).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const unknown = fields.filter((f) => !isKnownFieldType(f.type));
    if (unknown.length) {
      console.warn(
        `IssueForm: ${unknown.length} claim field(s) have unknown type and render as text.`,
        unknown.map((f) => `${f.name}:${f.type}`),
      );
    }
  }, [fields]);

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.staticFields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="issue-holderRef">
            {t('issue.holderRef')}
          </label>
          <span className={styles.help}>{t('issue.holderRefHelp')}</span>
          <input id="issue-holderRef" type="text" autoComplete="off" {...register('holderRef')} />
          {errors.holderRef && (
            <span className={styles.fieldError}>{errors.holderRef.message}</span>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="issue-maxUses">
            {t('issue.maxUses')}
          </label>
          <span className={styles.help}>{t('issue.maxUsesHelp')}</span>
          <input
            id="issue-maxUses"
            type="number"
            min={1}
            autoComplete="off"
            {...register('maxUses')}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="issue-validMinutes">
            {t('issue.validMinutes')}
          </label>
          <span className={styles.help}>{t('issue.validMinutesHelp')}</span>
          <input
            id="issue-validMinutes"
            type="number"
            min={1}
            autoComplete="off"
            {...register('validMinutes')}
          />
        </div>
      </div>

      {fields.map((field) => {
        const label = localize(field.labelI18n) || field.name;
        const inputType =
          field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
        const inputId = `issue-claim-${field.name}`;
        return (
          <div key={field.name} className={styles.field}>
            <span className={styles.fieldHead}>
              <label className={styles.label} htmlFor={inputId}>
                {label}
              </label>
              <span className={styles.badges}>
                {field.required && (
                  <span className={`${styles.badge} ${styles.badgeRequired}`}>
                    {t('issue.requiredField')}
                  </span>
                )}
                {isSelective(field, sdFields) && (
                  <span className={`${styles.badge} ${styles.badgeSelective}`}>
                    {t('issue.selectiveDisclosure')}
                  </span>
                )}
              </span>
            </span>
            <input
              id={inputId}
              type={inputType}
              autoComplete="off"
              {...register(`claims.${field.name}`)}
            />
            {errors.claims?.[field.name] && (
              <span className={styles.fieldError}>{errors.claims[field.name]?.message}</span>
            )}
          </div>
        );
      })}

      <ApiErrorBanner error={error} />
      <div className={styles.actions}>
        {onBack && (
          <button type="button" onClick={onBack} disabled={isSubmitting}>
            {t('common.back')}
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? t('issue.submitting') : t('issue.submit')}
        </button>
      </div>
    </form>
  );
}
