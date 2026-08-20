import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { TenantView } from '../api';
import styles from './SetParentDialog.module.css';

export interface SetParentFormValues {
  parentSlug: string;
}

interface SetParentDialogProps {
  /** The tenant whose parent is being set — excluded from its own candidate list. */
  tenant: TenantView;
  /** Every other ACTIVE tenant, as parent candidates. Cycle/depth/self checks stay server-side (KH-TNT-042x). */
  candidates: TenantView[];
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (values: SetParentFormValues) => Promise<unknown>;
  onCancel: () => void;
}

/**
 * Sets or clears a tenant's parent (spec FS-2.5 §2, D1). A blank selection
 * clears the parent (root again); the server is the sole judge of
 * self-parent/cycle/depth/parent-not-active — this dialog only offers ACTIVE
 * tenants other than the one being edited as candidates, it doesn't
 * pre-filter for cycles or depth.
 */
export function SetParentDialog({
  tenant,
  candidates,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: SetParentDialogProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  const schema = z.object({ parentSlug: z.string() });

  const { register, handleSubmit } = useForm<SetParentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { parentSlug: tenant.parentSlug ?? '' },
  });

  const eligible = candidates.filter((candidate) => candidate.slug !== tenant.slug);

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-parent-title"
      >
        <h2 id="set-parent-title" className={styles.title}>
          {t('tenants.setParent.title')}
        </h2>
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="set-parent-slug">
              {t('tenants.setParent.parentSlug')}
            </label>
            <select id="set-parent-slug" {...register('parentSlug')}>
              <option value="">{t('tenants.setParent.noneOption')}</option>
              {eligible.map((candidate) => (
                <option key={candidate.id} value={candidate.slug}>
                  {localize(candidate.nameI18n) || candidate.slug} — {candidate.slug}
                </option>
              ))}
            </select>
            <span className={styles.help}>{t('tenants.setParent.parentSlugHelp')}</span>
          </div>
          <ApiErrorBanner error={error} />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('tenants.setParent.cancel')}
            </button>
            <button type="submit" className={styles.confirm} disabled={isSubmitting}>
              {isSubmitting ? t('tenants.setParent.submitting') : t('tenants.setParent.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
