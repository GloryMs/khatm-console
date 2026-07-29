import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ApiError } from '@/api/errors';
import { useErrorMessage } from '@/api/useErrorMessage';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import type { TenantDeployMode, TenantType } from '../api';
import styles from './CreateTenantDialog.module.css';

// Mirrors the server's slug pattern (TenantAdminService, same shape as the
// consuming-party code): lowercase letters/digits/hyphen/underscore, 2-63
// characters, starting alnum.
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{1,62}$/;

const TENANT_TYPES: TenantType[] = ['GOVERNMENT', 'EDUCATION', 'PRIVATE', 'OTHER'];
const DEPLOY_MODES: TenantDeployMode[] = ['SAAS', 'ONPREM', 'FEDERATED'];

// The two tenant-onboarding errors the brief calls out for inline slug-field
// display, rather than the generic banner alone (KH-TNT-0400 / KH-TNT-0409).
const SLUG_ERROR_CODES = new Set(['KH-TNT-0400', 'KH-TNT-0409']);

export interface CreateTenantFormValues {
  slug: string;
  nameEn: string;
  nameAr: string;
  type: TenantType | '';
  deployMode: TenantDeployMode;
  addInitialAdmin: boolean;
  initialAdminUsername: string;
  initialAdminNameEn: string;
  initialAdminNameAr: string;
}

interface CreateTenantDialogProps {
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (values: CreateTenantFormValues) => Promise<unknown>;
  onCancel: () => void;
}

export function CreateTenantDialog({
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: CreateTenantDialogProps) {
  const { t } = useTranslation();
  const resolveError = useErrorMessage();

  const schema = z
    .object({
      slug: z
        .string()
        .trim()
        .min(1, { message: t('tenants.create.slugRequired') })
        .regex(SLUG_PATTERN, { message: t('tenants.create.slugInvalid') }),
      nameEn: z
        .string()
        .trim()
        .min(1, { message: t('tenants.create.nameRequired') }),
      nameAr: z
        .string()
        .trim()
        .min(1, { message: t('tenants.create.nameRequired') }),
      type: z.enum(TENANT_TYPES as [TenantType, ...TenantType[]], {
        errorMap: () => ({ message: t('tenants.create.typeRequired') }),
      }),
      deployMode: z.enum(DEPLOY_MODES as [TenantDeployMode, ...TenantDeployMode[]]),
      addInitialAdmin: z.boolean(),
      initialAdminUsername: z.string().trim(),
      initialAdminNameEn: z.string().trim(),
      initialAdminNameAr: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      if (!values.addInitialAdmin) return;
      if (!values.initialAdminUsername) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['initialAdminUsername'],
          message: t('tenants.create.initialAdminUsernameRequired'),
        });
      }
      if (!values.initialAdminNameEn || !values.initialAdminNameAr) {
        const message = t('tenants.create.initialAdminNameRequired');
        if (!values.initialAdminNameEn) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['initialAdminNameEn'], message });
        }
        if (!values.initialAdminNameAr) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['initialAdminNameAr'], message });
        }
      }
    });

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: '',
      nameEn: '',
      nameAr: '',
      type: '',
      deployMode: 'SAAS',
      addInitialAdmin: false,
      initialAdminUsername: '',
      initialAdminNameEn: '',
      initialAdminNameAr: '',
    },
  });

  const addInitialAdmin = watch('addInitialAdmin');

  // Mirrors LoginForm's field-mapping idiom: the parent owns the mutation
  // (so its `error`/`isSubmitting` still drive the banner below exactly like
  // every other dialog in this codebase), but KH-TNT-0400/0409 additionally
  // need to land on the slug field specifically — caught here since this is
  // the only place with a `setError` handle.
  const onFormSubmit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError && err.code && SLUG_ERROR_CODES.has(err.code)) {
        setError('slug', { message: resolveError(err) });
      }
    }
  });

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tenant-title"
      >
        <h2 id="create-tenant-title" className={styles.title}>
          {t('tenants.create.title')}
        </h2>
        <form className={styles.form} onSubmit={onFormSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tenant-slug">
              {t('tenants.create.slug')}
            </label>
            <input id="tenant-slug" type="text" autoComplete="off" {...register('slug')} />
            <span className={styles.help}>{t('tenants.create.slugHelp')}</span>
            {errors.slug && <span className={styles.fieldError}>{errors.slug.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tenant-nameEn">
              {t('tenants.create.nameEn')}
            </label>
            <input id="tenant-nameEn" type="text" autoComplete="off" {...register('nameEn')} />
            {errors.nameEn && <span className={styles.fieldError}>{errors.nameEn.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tenant-nameAr">
              {t('tenants.create.nameAr')}
            </label>
            <input id="tenant-nameAr" type="text" autoComplete="off" {...register('nameAr')} />
            {errors.nameAr && <span className={styles.fieldError}>{errors.nameAr.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tenant-type">
              {t('tenants.create.type')}
            </label>
            <select id="tenant-type" {...register('type')}>
              <option value="">{t('tenants.create.typePlaceholder')}</option>
              {TENANT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`tenants.type.${type}`)}
                </option>
              ))}
            </select>
            {errors.type && <span className={styles.fieldError}>{errors.type.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tenant-deployMode">
              {t('tenants.create.deployMode')}
            </label>
            <select id="tenant-deployMode" {...register('deployMode')}>
              {DEPLOY_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {t(`tenants.deployMode.${mode}`)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" {...register('addInitialAdmin')} />
              {t('tenants.create.addInitialAdmin')}
            </label>
            <span className={styles.help}>{t('tenants.create.addInitialAdminHelp')}</span>
          </div>
          {addInitialAdmin && (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="tenant-initialAdminUsername">
                  {t('tenants.create.initialAdminUsername')}
                </label>
                <input
                  id="tenant-initialAdminUsername"
                  type="text"
                  autoComplete="off"
                  {...register('initialAdminUsername')}
                />
                {errors.initialAdminUsername && (
                  <span className={styles.fieldError}>{errors.initialAdminUsername.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="tenant-initialAdminNameEn">
                  {t('tenants.create.initialAdminNameEn')}
                </label>
                <input
                  id="tenant-initialAdminNameEn"
                  type="text"
                  autoComplete="off"
                  {...register('initialAdminNameEn')}
                />
                {errors.initialAdminNameEn && (
                  <span className={styles.fieldError}>{errors.initialAdminNameEn.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="tenant-initialAdminNameAr">
                  {t('tenants.create.initialAdminNameAr')}
                </label>
                <input
                  id="tenant-initialAdminNameAr"
                  type="text"
                  autoComplete="off"
                  {...register('initialAdminNameAr')}
                />
                {errors.initialAdminNameAr && (
                  <span className={styles.fieldError}>{errors.initialAdminNameAr.message}</span>
                )}
              </div>
            </>
          )}
          <ApiErrorBanner error={error} />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('tenants.create.cancel')}
            </button>
            <button type="submit" className={styles.confirm} disabled={isSubmitting}>
              {isSubmitting ? t('tenants.create.submitting') : t('tenants.create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
