import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { SchemaSummary } from '@/features/schemas/api';
import type { IssuerClientResponse } from '../api';
import { formatRelativeTime } from '../relativeTime';
import styles from './ClientList.module.css';

const STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  RETIRING: 'info',
  REVOKED: 'neutral',
};

const STATUS_LABEL_KEY: Record<string, string> = {
  ACTIVE: 'clients.status.active',
  SUSPENDED: 'clients.status.suspended',
  RETIRING: 'clients.status.retiring',
  REVOKED: 'clients.status.revoked',
};

interface ClientListProps {
  clients: IssuerClientResponse[];
  schemas: SchemaSummary[];
  onRotate: (client: IssuerClientResponse) => void;
  onSuspend: (client: IssuerClientResponse) => void;
  onResume: (client: IssuerClientResponse) => void;
  onRevoke: (client: IssuerClientResponse) => void;
}

/**
 * The issuer-client table (spec FS-2.7a D10 V6): name, key prefix, status,
 * allowed schemas, and a relative last-use timestamp, with the lifecycle
 * actions legal for each status (server-enforced too — a stale row can still
 * 409, surfaced via the acting dialog's own error banner). Shared between
 * the tenant's own `/clients` page and the org on-behalf-of child tab.
 */
export function ClientList({
  clients,
  schemas,
  onRotate,
  onSuspend,
  onResume,
  onRevoke,
}: ClientListProps) {
  const { t, i18n } = useTranslation();
  const localize = useLocalizedText();
  const schemaById = new Map(schemas.map((schema) => [schema.id ?? '', schema]));

  if (clients.length === 0) {
    return <EmptyState title={t('clients.emptyTitle')} body={t('clients.emptyBody')} />;
  }

  const columns: DataTableColumn<IssuerClientResponse>[] = [
    {
      key: 'name',
      header: t('clients.columnName'),
      cell: (client) => (
        <div className={styles.name}>
          <span className={styles.nameText}>{localize(client.name) || client.keyPrefix}</span>
        </div>
      ),
    },
    {
      key: 'keyPrefix',
      header: t('clients.columnKeyPrefix'),
      code: true,
      cell: (client) => client.keyPrefix,
    },
    {
      key: 'status',
      header: t('clients.columnStatus'),
      cell: (client) => {
        const tone = STATUS_TONE[client.status ?? ''] ?? 'neutral';
        const labelKey = STATUS_LABEL_KEY[client.status ?? ''];
        return <StatusBadge tone={tone}>{labelKey ? t(labelKey) : client.status}</StatusBadge>;
      },
    },
    {
      key: 'allowedSchemas',
      header: t('clients.columnAllowedSchemas'),
      cell: (client) => {
        const ids = client.allowedSchemaIds ?? [];
        if (ids.length === 0) {
          return <span className={styles.noChips}>{t('clients.noAllowedSchemas')}</span>;
        }
        return (
          <div className={styles.schemaChips}>
            {ids.map((id) => (
              <span key={id} className={`${styles.chip} ltr-embed`}>
                {schemaById.get(id)?.code ?? id}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'lastUsedAt',
      header: t('clients.columnLastUsed'),
      cell: (client) =>
        client.lastUsedAt
          ? formatRelativeTime(client.lastUsedAt, i18n.language)
          : t('clients.neverUsed'),
    },
    {
      key: 'actions',
      header: t('clients.columnActions'),
      cell: (client) => (
        <div className={styles.actions}>
          {client.status === 'ACTIVE' && (
            <>
              <Button variant="secondary" type="button" onClick={() => onRotate(client)}>
                {t('clients.actionRotate')}
              </Button>
              <Button variant="secondary" type="button" onClick={() => onSuspend(client)}>
                {t('clients.actionSuspend')}
              </Button>
            </>
          )}
          {client.status === 'SUSPENDED' && (
            <Button variant="primary" type="button" onClick={() => onResume(client)}>
              {t('clients.actionResume')}
            </Button>
          )}
          {(client.status === 'ACTIVE' ||
            client.status === 'SUSPENDED' ||
            client.status === 'RETIRING') && (
            <Button variant="danger" type="button" onClick={() => onRevoke(client)}>
              {t('clients.actionRevoke')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={clients}
      rowKey={(client) => client.id ?? client.keyPrefix ?? ''}
    />
  );
}
