import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { changeMyPassword } from '../api';
import { useAuth } from '../useAuth';
import styles from './ChangePasswordForm.module.css';

function buildSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t('auth.changePassword.currentRequired')),
      newPassword: z
        .string()
        .min(8, t('auth.changePassword.newMinLength'))
        .max(128, t('auth.changePassword.newMinLength')),
      confirmPassword: z.string().min(1, t('auth.changePassword.confirmRequired')),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: t('auth.changePassword.mismatch'),
      path: ['confirmPassword'],
    });
}

type ChangePasswordFormValues = z.infer<ReturnType<typeof buildSchema>>;

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(err);
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.field}>
        <span>{t('auth.changePassword.currentPassword')}</span>
        <input
          type="password"
          autoComplete="current-password"
          className={`khatm-input${errors.currentPassword ? ' khatm-input--error' : ''}`}
          {...register('currentPassword')}
        />
        {errors.currentPassword && (
          <span className={styles.fieldError}>{errors.currentPassword.message}</span>
        )}
      </label>
      <label className={styles.field}>
        <span>{t('auth.changePassword.newPassword')}</span>
        <input
          type="password"
          autoComplete="new-password"
          className={`khatm-input${errors.newPassword ? ' khatm-input--error' : ''}`}
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <span className={styles.fieldError}>{errors.newPassword.message}</span>
        )}
      </label>
      <label className={styles.field}>
        <span>{t('auth.changePassword.confirmPassword')}</span>
        <input
          type="password"
          autoComplete="new-password"
          className={`khatm-input${errors.confirmPassword ? ' khatm-input--error' : ''}`}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <span className={styles.fieldError}>{errors.confirmPassword.message}</span>
        )}
      </label>
      <ApiErrorBanner error={submitError} />
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? t('auth.changePassword.submitting') : t('auth.changePassword.submit')}
      </Button>
    </form>
  );
}
