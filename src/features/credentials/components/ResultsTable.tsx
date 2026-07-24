import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import tableStyles from '@/components/ui/Table.module.css';
import type { CredentialSummary } from '../api';
import styles from './ResultsTable.module.css';

type DerivedStatus = 'active' | 'revoked' | 'expired';

function deriveStatus(row: CredentialSummary, now: number): DerivedStatus {
  if (row.revoked) return 'revoked';
  if (row.validTo && new Date(row.validTo).getTime() < now) return 'expired';
  return 'active';
}

const STATUS_KEY: Record<DerivedStatus, string> = {
  active: 'revoke.statusActive',
  revoked: 'revoke.statusRevoked',
  expired: 'revoke.statusExpired',
};

const STATUS_TONE: Record<DerivedStatus, StatusTone> = {
  active: 'success',
  revoked: 'danger',
  expired: 'warning',
};

interface ResultsTableProps {
  rows: CredentialSummary[];
}

export function ResultsTable({ rows }: ResultsTableProps) {
  const { t, i18n } = useTranslation();
  const localize = useLocalizedText();
  const now = Date.now();

  if (rows.length === 0) {
    return <div className="emptyState">{t('credentials.empty')}</div>;
  }

  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th className={tableStyles.codeCell}>{t('credentials.table.ref')}</th>
          <th>{t('credentials.table.schema')}</th>
          <th>{t('credentials.table.issuedAt')}</th>
          <th>{t('credentials.table.status')}</th>
          <th>{t('credentials.table.uses')}</th>
          <th>{t('credentials.table.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const status = deriveStatus(row, now);
          const issuedAt = row.issuedAt
            ? new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(row.issuedAt))
            : '';
          const usesText =
            row.usesRemaining !== undefined && row.maxUses !== undefined
              ? t('revoke.usesValue', { remaining: row.usesRemaining, max: row.maxUses })
              : t('revoke.usesUnlimited');
          return (
            <tr key={row.id}>
              <td className={tableStyles.codeCell}>{row.ref}</td>
              <td>{localize(row.schemaName) || row.schemaCode}</td>
              <td>{issuedAt}</td>
              <td>
                <StatusBadge tone={STATUS_TONE[status]}>{t(STATUS_KEY[status])}</StatusBadge>
              </td>
              <td>{usesText}</td>
              <td>
                {row.id && (
                  <div className={styles.actions}>
                    <Link className={styles.action} to={`/revoke?id=${encodeURIComponent(row.id)}`}>
                      {t('credentials.rowRevoke')}
                    </Link>
                    <Link
                      className={styles.action}
                      to={`/consume-sim?id=${encodeURIComponent(row.id)}`}
                    >
                      {t('credentials.rowConsume')}
                    </Link>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
