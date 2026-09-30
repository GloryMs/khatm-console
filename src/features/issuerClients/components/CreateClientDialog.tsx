import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { FormField, khatmInputClass } from '@/components/ui/FormField';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { SchemaSummary } from '@/features/schemas/api';
import styles from './CreateClientDialog.module.css';

const formSchema = z.object({
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  expiresAt: z.string(),
});

export type CreateClientFormValues = z.infer<typeof formSchema>;

export interface CreateClientSubmitValues {
  nameEn: string;
  nameAr: string;
  allowedSchemaIds: string[];
  /** ISO 8601, omitted entirely when left blank. */
  expiresAt?: string;
}

interface CreateClientDialogProps {
  schemas: SchemaSummary[];
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (values: CreateClientSubmitValues) => void;
  onCancel: () => void;
}

/**
 * Creates an issuer client (spec FS-2.7a D10 D1): both-language name, an
 * optional multi-select of the schemas this client is allowed to issue
 * (deny-by-default — an empty selection is valid and means "none yet"), and
 * an optional expiry. The submit result carries no secret — the platform
 * mints the key/holder secret server-side; the caller opens
 * {@link RevealSecretsDialog} with the mutation's resolved value.
 */
export function CreateClientDialog({
  schemas,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: CreateClientDialogProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const [selectedSchemaIds, setSelectedSchemaIds] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nameEn: '', nameAr: '', expiresAt: '' },
  });

  const toggleSchema = (schemaId: string) => {
    setSelectedSchemaIds((prev) => {
      const next = new Set(prev);
      if (next.has(schemaId)) next.delete(schemaId);
      else next.add(schemaId);
      return next;
    });
  };

  const submit = (values: CreateClientFormValues) => {
    const expiresAt = values.expiresAt.trim();
    onSubmit({
      nameEn: values.nameEn,
      nameAr: values.nameAr,
      allowedSchemaIds: [...selectedSchemaIds],
      ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
    });
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-client-title"
      >
        <h2 id="create-client-title" className={styles.title}>
          {t('clients.create.title')}
        </h2>
        <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
          <FormField
            label={t('clients.create.nameEn')}
            htmlFor="client-nameEn"
            error={errors.nameEn && t('clients.create.nameRequired')}
          >
            <input
              id="client-nameEn"
              type="text"
              autoComplete="off"
              className={khatmInputClass(errors.nameEn ? 'error' : 'default')}
              {...register('nameEn')}
            />
          </FormField>
          <FormField
            label={t('clients.create.nameAr')}
            htmlFor="client-nameAr"
            error={errors.nameAr && t('clients.create.nameRequired')}
          >
            <input
              id="client-nameAr"
              type="text"
              autoComplete="off"
              className={khatmInputClass(errors.nameAr ? 'error' : 'default')}
              {...register('nameAr')}
            />
          </FormField>
          <FormField
            label={t('clients.create.expiresAt')}
            htmlFor="client-expiresAt"
            help={t('clients.create.expiresAtHelp')}
          >
            <input
              id="client-expiresAt"
              type="datetime-local"
              className={`${khatmInputClass()} ltr-embed`}
              {...register('expiresAt')}
            />
          </FormField>
          <FormField label={t('clients.create.allowedSchemas')} htmlFor="client-schemas">
            {schemas.length === 0 ? (
              <p>{t('clients.create.noSchemas')}</p>
            ) : (
              <ul id="client-schemas" className={styles.schemaList}>
                {schemas.map((schema) => {
                  const id = schema.id ?? '';
                  return (
                    <li key={id} className={styles.schemaRow}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedSchemaIds.has(id)}
                          onChange={() => toggleSchema(id)}
                        />{' '}
                        {localize(schema.nameI18n) || schema.code}{' '}
                        <span className={`${styles.schemaCode} ltr-embed`}>{schema.code}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </FormField>
          <ApiErrorBanner error={error} />
          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
              {t('clients.create.cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('clients.create.submitting') : t('clients.create.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
