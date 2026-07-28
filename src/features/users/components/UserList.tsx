import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import tableStyles from '@/components/ui/Table.module.css';
import { roleLabelKey } from '../roles';
import type { UserSummary } from '../api';
import styles from './UserList.module.css';

interface UserListProps {
  users: UserSummary[];
  onEditRoles: (user: UserSummary) => void;
  onLock: (user: UserSummary) => void;
  onUnlock: (user: UserSummary) => void;
  onDisable: (user: UserSummary) => void;
  onResetPassword: (user: UserSummary) => void;
}

const STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  LOCKED: 'warning',
  DISABLED: 'danger',
};

const STATUS_LABEL_KEY: Record<string, string> = {
  ACTIVE: 'users.status.ACTIVE',
  LOCKED: 'users.status.LOCKED',
  DISABLED: 'users.status.DISABLED',
};

export function UserList({
  users,
  onEditRoles,
  onLock,
  onUnlock,
  onDisable,
  onResetPassword,
}: UserListProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  if (users.length === 0) {
    return <div className="emptyState">{t('users.empty')}</div>;
  }

  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th className={tableStyles.codeCell}>{t('users.columnUsername')}</th>
          <th>{t('users.columnName')}</th>
          <th>{t('users.columnRoles')}</th>
          <th>{t('users.columnStatus')}</th>
          <th>{t('users.columnActions')}</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const id = user.id ?? '';
          const status = user.status ?? 'ACTIVE';
          const tone = STATUS_TONE[status] ?? 'neutral';
          return (
            <tr key={id}>
              <td className={`${tableStyles.codeCell} ltr-embed`}>{user.username}</td>
              <td>{localize(user.displayNameI18n) || user.username}</td>
              <td>
                <div className={styles.chips}>
                  {(user.roles ?? []).length === 0 ? (
                    <span className={styles.noChips}>{t('users.noRoles')}</span>
                  ) : (
                    (user.roles ?? []).map((role) => (
                      <span key={role} className={styles.chip}>
                        {t(roleLabelKey(role))}
                      </span>
                    ))
                  )}
                </div>
              </td>
              <td>
                <StatusBadge tone={tone}>
                  {STATUS_LABEL_KEY[status] ? t(STATUS_LABEL_KEY[status]) : t('common.unknown')}
                </StatusBadge>
              </td>
              <td>
                <div className={styles.actions}>
                  <button type="button" className={styles.action} onClick={() => onEditRoles(user)}>
                    {t('users.actionEditRoles')}
                  </button>
                  {status === 'ACTIVE' && (
                    <button type="button" className={styles.action} onClick={() => onLock(user)}>
                      {t('users.actionLock')}
                    </button>
                  )}
                  {status !== 'DISABLED' && (
                    <button type="button" className={styles.action} onClick={() => onDisable(user)}>
                      {t('users.actionDisable')}
                    </button>
                  )}
                  {status !== 'ACTIVE' && (
                    <button type="button" className={styles.action} onClick={() => onUnlock(user)}>
                      {t('users.actionUnlock')}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => onResetPassword(user)}
                  >
                    {t('users.actionResetPassword')}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
