import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import tableStyles from '@/components/ui/Table.module.css';
import type { TenantView } from '../api';
import styles from './TenantList.module.css';

interface TenantListProps {
  tenants: TenantView[];
}

export function TenantList({ tenants }: TenantListProps) {
  const { t, i18n } = useTranslation();
  const localize = useLocalizedText();

  if (tenants.length === 0) {
    return <div className="emptyState">{t('tenants.empty')}</div>;
  }

  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th className={tableStyles.codeCell}>{t('tenants.columnSlug')}</th>
          <th>{t('tenants.columnName')}</th>
          <th>{t('tenants.columnType')}</th>
          <th>{t('tenants.columnParent')}</th>
          <th>{t('tenants.columnStatus')}</th>
          <th>{t('tenants.columnCreatedAt')}</th>
        </tr>
      </thead>
      <tbody>
        {tenants.map((tenant) => {
          const id = tenant.id ?? '';
          const isActive = tenant.status === 'ACTIVE';
          const tone: StatusTone = isActive ? 'success' : 'warning';
          const createdAt = tenant.createdAt
            ? new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(tenant.createdAt))
            : '';
          return (
            <tr key={id}>
              <td className={tableStyles.codeCell}>
                <Link className={styles.link} to={`/tenants/${id}`}>
                  {tenant.slug}
                </Link>
              </td>
              <td>{localize(tenant.nameI18n) || tenant.slug}</td>
              <td>{tenant.type ? t(`tenants.type.${tenant.type}`) : ''}</td>
              <td>
                {tenant.parentSlug ? (
                  localize(tenant.parentNameI18n) || (
                    <span className="ltr-embed">{tenant.parentSlug}</span>
                  )
                ) : (
                  <span className={styles.noParent}>{t('tenants.noParent')}</span>
                )}
              </td>
              <td>
                <StatusBadge tone={tone}>
                  {isActive ? t('tenants.statusActive') : t('tenants.statusSuspended')}
                </StatusBadge>
              </td>
              <td>{createdAt}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
