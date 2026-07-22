import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import styles from './CreatePartyDialog.module.css';

// Mirrors the server's slug pattern (ConsumingPartyAdminService): lowercase
// letters/digits/hyphen/underscore, 2-63 characters, starting alnum.
const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,62}$/;

export interface CreatePartyFormValues {
  code: string;
  nameEn: string;
  nameAr: string;
}

interface CreatePartyDialogProps {
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (values: CreatePartyFormValues) => void;
  onCancel: () => void;
}

export function CreatePartyDialog({
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: CreatePartyDialogProps) {
  const { t } = useTranslation();

  const schema = z.object({
    code: z
      .string()
      .trim()
      .min(1, { message: t('consumingParties.create.codeRequired') })
      .regex(CODE_PATTERN, { message: t('consumingParties.create.codeInvalid') }),
    nameEn: z
      .string()
      .trim()
      .min(1, { message: t('consumingParties.create.nameRequired') }),
    nameAr: z
      .string()
      .trim()
      .min(1, { message: t('consumingParties.create.nameRequired') }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePartyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', nameEn: '', nameAr: '' },
  });

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-party-title"
      >
        <h2 id="create-party-title" className={styles.title}>
          {t('consumingParties.create.title')}
        </h2>
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="party-code">
              {t('consumingParties.create.code')}
            </label>
            <input id="party-code" type="text" autoComplete="off" {...register('code')} />
            <span className={styles.help}>{t('consumingParties.create.codeHelp')}</span>
            {errors.code && <span className={styles.fieldError}>{errors.code.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="party-nameEn">
              {t('consumingParties.create.nameEn')}
            </label>
            <input id="party-nameEn" type="text" autoComplete="off" {...register('nameEn')} />
            {errors.nameEn && <span className={styles.fieldError}>{errors.nameEn.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="party-nameAr">
              {t('consumingParties.create.nameAr')}
            </label>
            <input id="party-nameAr" type="text" autoComplete="off" {...register('nameAr')} />
            {errors.nameAr && <span className={styles.fieldError}>{errors.nameAr.message}</span>}
          </div>
          <ApiErrorBanner error={error} />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('consumingParties.create.cancel')}
            </button>
            <button type="submit" className={styles.confirm} disabled={isSubmitting}>
              {isSubmitting
                ? t('consumingParties.create.submitting')
                : t('consumingParties.create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
