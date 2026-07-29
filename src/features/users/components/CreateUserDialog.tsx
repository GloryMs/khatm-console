import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { TENANT_ROLES, roleLabelKey } from '../roles';
import styles from './CreateUserDialog.module.css';

export interface CreateUserFormValues {
  username: string;
  nameEn: string;
  nameAr: string;
  roles: string[];
}

interface CreateUserDialogProps {
  titleId?: string;
  title: string;
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (values: CreateUserFormValues) => void;
  onCancel: () => void;
}

/**
 * Username + display name (EN/AR) + role multi-select from the fixed
 * seeded catalog (spec FS-2.2 D5) — reused by both the tenant's own Users
 * screen and the platform-admin on-behalf-of tab, which only differ in
 * where `onSubmit` sends the request.
 */
export function CreateUserDialog({
  titleId = 'create-user-title',
  title,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: CreateUserDialogProps) {
  const { t } = useTranslation();

  const schema = z.object({
    username: z
      .string()
      .trim()
      .min(1, { message: t('users.create.usernameRequired') }),
    nameEn: z
      .string()
      .trim()
      .min(1, { message: t('users.create.nameRequired') }),
    nameAr: z
      .string()
      .trim()
      .min(1, { message: t('users.create.nameRequired') }),
    roles: z.array(z.string()).min(1, { message: t('users.create.rolesRequired') }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', nameEn: '', nameAr: '', roles: [] },
  });

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="user-username">
              {t('users.create.username')}
            </label>
            <input id="user-username" type="text" autoComplete="off" {...register('username')} />
            {errors.username && (
              <span className={styles.fieldError}>{errors.username.message}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="user-nameEn">
              {t('users.create.nameEn')}
            </label>
            <input id="user-nameEn" type="text" autoComplete="off" {...register('nameEn')} />
            {errors.nameEn && <span className={styles.fieldError}>{errors.nameEn.message}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="user-nameAr">
              {t('users.create.nameAr')}
            </label>
            <input id="user-nameAr" type="text" autoComplete="off" {...register('nameAr')} />
            {errors.nameAr && <span className={styles.fieldError}>{errors.nameAr.message}</span>}
          </div>
          <fieldset className={styles.field}>
            <legend className={styles.label}>{t('users.create.roles')}</legend>
            <div className={styles.checkboxGroup}>
              {TENANT_ROLES.map((role) => (
                <label key={role} className={styles.checkboxLabel}>
                  <input type="checkbox" value={role} {...register('roles')} />
                  {t(roleLabelKey(role))}
                </label>
              ))}
            </div>
            {errors.roles && <span className={styles.fieldError}>{errors.roles.message}</span>}
          </fieldset>
          <ApiErrorBanner error={error} />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('users.create.cancel')}
            </button>
            <button type="submit" className={styles.confirm} disabled={isSubmitting}>
              {isSubmitting ? t('users.create.submitting') : t('users.create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
