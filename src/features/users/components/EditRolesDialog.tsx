import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Banner } from '@/components/ui/Banner';
import { isApiError } from '@/api/errors';
import { TENANT_ROLES, roleLabelKey } from '../roles';
import type { UserSummary } from '../api';
import styles from './CreateUserDialog.module.css';

interface EditRolesDialogProps {
  user: UserSummary;
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (roles: string[]) => void;
  onCancel: () => void;
}

/** KH-USR-0423 — the last-active-tenant-admin guard (spec FS-2.2 D5). */
const LAST_ADMIN_ERROR_CODE = 'KH-USR-0423';

export function EditRolesDialog({
  user,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: EditRolesDialogProps) {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<string[]>(user.roles ?? []);

  const isLastAdminError = isApiError(error) && error.code === LAST_ADMIN_ERROR_CODE;

  const toggleRole = (role: string) => {
    setRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    );
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-roles-title"
      >
        <h2 id="edit-roles-title" className={styles.title}>
          {t('users.editRoles.title', { username: user.username ?? '' })}
        </h2>
        <fieldset className={styles.field}>
          <legend className={styles.label}>{t('users.create.roles')}</legend>
          <div className={styles.checkboxGroup}>
            {TENANT_ROLES.map((role) => (
              <label key={role} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {t(roleLabelKey(role))}
              </label>
            ))}
          </div>
        </fieldset>
        {isLastAdminError ? (
          <Banner tone="warning">
            <p>{t('users.lastAdminGuard.explanation')}</p>
          </Banner>
        ) : (
          <ApiErrorBanner error={error} />
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('users.create.cancel')}
          </button>
          <button
            type="button"
            className={styles.confirm}
            disabled={isSubmitting || roles.length === 0}
            onClick={() => onSubmit(roles)}
          >
            {isSubmitting ? t('users.editRoles.saving') : t('users.editRoles.save')}
          </button>
        </div>
        {roles.length === 0 && (
          <span className={styles.fieldError}>{t('users.create.rolesRequired')}</span>
        )}
      </div>
    </div>
  );
}
