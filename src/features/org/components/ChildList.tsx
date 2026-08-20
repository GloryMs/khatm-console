import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import tableStyles from '@/components/ui/Table.module.css';
import type { TenantRef } from '../api';
import styles from './ChildList.module.css';

interface ChildListProps {
  childTenants: TenantRef[];
  onSuspend: (child: TenantRef) => void;
  onActivate: (child: TenantRef) => void;
}

export function ChildList({ childTenants, onSuspend, onActivate }: ChildListProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  if (childTenants.length === 0) {
    return <div className="emptyState">{t('org.children.empty')}</div>;
  }

  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th className={tableStyles.codeCell}>{t('org.children.columnSlug')}</th>
          <th>{t('org.children.columnName')}</th>
          <th>{t('org.children.columnStatus')}</th>
          <th>{t('org.children.columnActions')}</th>
        </tr>
      </thead>
      <tbody>
        {[...childTenants]
          .sort((a, b) => (a.slug ?? '').localeCompare(b.slug ?? ''))
          .map((child) => {
            const id = child.id ?? '';
            const isActive = child.status === 'ACTIVE';
            const tone: StatusTone = isActive ? 'success' : 'warning';
            return (
              <tr key={id}>
                <td className={tableStyles.codeCell}>
                  <Link className={styles.link} to={`/org/children/${id}`}>
                    {child.slug}
                  </Link>
                </td>
                <td>{localize(child.nameI18n) || child.slug}</td>
                <td>
                  <StatusBadge tone={tone}>
                    {isActive ? t('org.children.statusActive') : t('org.children.statusSuspended')}
                  </StatusBadge>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link className={styles.action} to={`/org/children/${id}`}>
                      {t('org.children.actionManage')}
                    </Link>
                    {isActive ? (
                      <button
                        type="button"
                        className={styles.action}
                        onClick={() => onSuspend(child)}
                      >
                        {t('org.children.actionSuspend')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.action}
                        onClick={() => onActivate(child)}
                      >
                        {t('org.children.actionActivate')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
