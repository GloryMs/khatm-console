import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField, khatmInputClass } from '@/components/ui/FormField';
import { copyToClipboard } from '@/components/ui/clipboard';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { isKnownFieldType, isSelective, type ClaimField } from '@/features/issuance/claimsDef';
import type { AttestedIssueFormValues } from '../request';
import styles from './DetailsForm.module.css';

const ATTESTATION_NOTE_MAX = 500;

export interface DetailsFormDefaults {
  maxUses?: string;
  validMinutes?: string;
}

interface DetailsFormProps {
  digestHex: string;
  fields: ClaimField[];
  sdFields?: readonly string[];
  defaults?: DetailsFormDefaults;
  /** When set (returning from the review step), used verbatim instead of `defaults` — preserves what the operator already typed. */
  initialValues?: AttestedIssueFormValues;
  onSubmit: (values: AttestedIssueFormValues) => void;
  onChangeFile: () => void;
  onBack?: () => void;
}

function buildSchema(fields: ClaimField[], t: TFunction, localize: (text: unknown) => string) {
  const claimShape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    const label = localize(field.labelI18n) || field.name;
    let stringSchema: z.ZodString = z.string();
    if (field.required) {
      stringSchema = stringSchema.min(1, {
        message: t('issue.fieldRequired', { field: label }),
      });
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
    attestationNote: z
      .string()
      .max(ATTESTATION_NOTE_MAX, { message: t('issueAttested.details.noteTooLong') }),
  });
}

function defaultValues(
  fields: ClaimField[],
  defaults: DetailsFormDefaults | undefined,
): AttestedIssueFormValues {
  const claims: Record<string, string> = {};
  for (const field of fields) claims[field.name] = '';
  return {
    holderRef: '',
    maxUses: defaults?.maxUses ?? '',
    validMinutes: defaults?.validMinutes ?? '',
    claims,
    attestationNote: '',
  };
}

/**
 * Step: the attested-document field form. Every claim field renders exactly
 * like the standard `IssueForm` except `doc_sha256`, which never appears
 * here — it's shown above, locked, as the digest computed by `ScanStep`
 * (spec FS-2.4 item 2: never operator-typed, never editable).
 */
export function DetailsForm({
  digestHex,
  fields,
  sdFields = [],
  defaults,
  initialValues,
  onSubmit,
  onChangeFile,
  onBack,
}: DetailsFormProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const schema = useMemo(
    () => buildSchema(fields, t, localize as (text: unknown) => string),
    [fields, t, localize],
  );

  const formDefaults = useMemo(
    () => initialValues ?? defaultValues(fields, defaults),
    [fields, defaults, initialValues],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AttestedIssueFormValues>({
    resolver: zodResolver(schema),
    defaultValues: formDefaults,
  });

  const unknownTypeFields = fields.filter((f) => !isKnownFieldType(f.type));
  if (import.meta.env.DEV && unknownTypeFields.length) {
    console.warn(
      `DetailsForm: ${unknownTypeFields.length} claim field(s) have unknown type and render as text.`,
      unknownTypeFields.map((f) => `${f.name}:${f.type}`),
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField label={t('issueAttested.details.digestLabel')} htmlFor="attested-digest">
        <div className={styles.digestRow}>
          <code id="attested-digest" className={`${styles.digestValue} ltr-embed`}>
            {digestHex}
          </code>
          <Button type="button" variant="secondary" onClick={() => void copyToClipboard(digestHex)}>
            {t('common.copy')}
          </Button>
          <Button type="button" variant="ghost" onClick={onChangeFile}>
            {t('issueAttested.details.changeFile')}
          </Button>
        </div>
      </FormField>

      <div className={styles.staticFields}>
        <FormField
          label={t('issue.holderRef')}
          htmlFor="attested-holderRef"
          help={t('issue.holderRefHelp')}
          error={errors.holderRef?.message}
        >
          <input
            id="attested-holderRef"
            type="text"
            autoComplete="off"
            className={khatmInputClass(errors.holderRef ? 'error' : 'default')}
            {...register('holderRef')}
          />
        </FormField>
        <FormField
          label={t('issue.maxUses')}
          htmlFor="attested-maxUses"
          help={t('issue.maxUsesHelp')}
        >
          <input
            id="attested-maxUses"
            type="number"
            min={1}
            autoComplete="off"
            className={khatmInputClass()}
            {...register('maxUses')}
          />
        </FormField>
        <FormField
          label={t('issue.validMinutes')}
          htmlFor="attested-validMinutes"
          help={t('issue.validMinutesHelp')}
        >
          <input
            id="attested-validMinutes"
            type="number"
            min={1}
            autoComplete="off"
            className={khatmInputClass()}
            {...register('validMinutes')}
          />
        </FormField>
      </div>

      {fields.map((field) => {
        const label = localize(field.labelI18n) || field.name;
        const inputType =
          field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
        const inputId = `attested-claim-${field.name}`;
        const fieldError = errors.claims?.[field.name]?.message;
        const badge = (
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
        );
        return (
          <FormField
            key={field.name}
            label={label}
            htmlFor={inputId}
            badge={badge}
            error={fieldError}
          >
            <input
              id={inputId}
              type={inputType}
              autoComplete="off"
              className={khatmInputClass(fieldError ? 'error' : 'default')}
              {...register(`claims.${field.name}`)}
            />
          </FormField>
        );
      })}

      <FormField
        label={t('issueAttested.details.attestationNote')}
        htmlFor="attested-note"
        help={t('issueAttested.details.attestationNoteHelp')}
        error={errors.attestationNote?.message}
      >
        <textarea
          id="attested-note"
          autoComplete="off"
          maxLength={ATTESTATION_NOTE_MAX}
          className={khatmInputClass(errors.attestationNote ? 'error' : 'default')}
          {...register('attestationNote')}
        />
      </FormField>

      <div className={styles.actions}>
        {onBack && (
          <Button variant="secondary" type="button" onClick={onBack}>
            {t('issue.cancel')}
          </Button>
        )}
        <Button variant="primary" type="submit">
          {t('issueAttested.details.continueToReview')}
        </Button>
      </div>
    </form>
  );
}
