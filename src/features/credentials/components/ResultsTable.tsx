import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
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

  const columns: DataTableColumn<CredentialSummary>[] = [
    {
      key: 'ref',
      header: t('credentials.table.ref'),
      code: true,
      cell: (row) => row.ref,
    },
    {
      key: 'schema',
      header: t('credentials.table.schema'),
      cell: (row) => localize(row.schemaName) || row.schemaCode,
    },
    {
      key: 'issuedAt',
      header: t('credentials.table.issuedAt'),
      code: true,
      cell: (row) =>
        row.issuedAt
          ? new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(row.issuedAt))
          : '',
    },
    {
      key: 'status',
      header: t('credentials.table.status'),
      cell: (row) => {
        const status = deriveStatus(row, now);
        return <StatusBadge tone={STATUS_TONE[status]}>{t(STATUS_KEY[status])}</StatusBadge>;
      },
    },
    {
      key: 'uses',
      header: t('credentials.table.uses'),
      cell: (row) =>
        row.usesRemaining !== undefined && row.maxUses !== undefined
          ? t('revoke.usesValue', { remaining: row.usesRemaining, max: row.maxUses })
          : t('revoke.usesUnlimited'),
    },
    {
      key: 'actions',
      header: t('credentials.table.actions'),
      cell: (row) =>
        row.id && (
          <div className={styles.actions}>
            <Link className={styles.action} to={`/revoke?id=${encodeURIComponent(row.id)}`}>
              {t('credentials.rowRevoke')}
            </Link>
            <Link className={styles.action} to={`/consume-sim?id=${encodeURIComponent(row.id)}`}>
              {t('credentials.rowConsume')}
            </Link>
          </div>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id ?? ''}
      emptyState={<EmptyState title={t('credentials.empty')} />}
    />
  );
}
