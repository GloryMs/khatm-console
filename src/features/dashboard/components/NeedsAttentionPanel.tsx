import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { AttentionEntry } from '../api';
import { asSchemaDeniedDetail } from '../attention';
import { useAttention } from '../hooks';
import { PanelCard } from './PanelCard';
import styles from './NeedsAttentionPanel.module.css';

function ItemBody({ item }: { item: AttentionEntry }) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  if (item.type === 'SCHEMA_DENIED') {
    const detail = asSchemaDeniedDetail(item.detail);
    return (
      <>
        <span className={styles.itemTitle}>
          {t('dashboard.attention.types.schemaDenied.title')}
        </span>
        <span className={styles.itemBody}>
          {t('dashboard.attention.types.schemaDenied.body', {
            party: detail.partyName ? localize(detail.partyName) : (detail.partyCode ?? '—'),
            schema: detail.schemaCode ?? '—',
          })}
        </span>
      </>
    );
  }

  return (
    <>
      <span className={styles.itemTitle}>{t('dashboard.attention.types.other.title')}</span>
      <span className={styles.itemBody}>{t('dashboard.attention.types.other.body')}</span>
    </>
  );
}

const GLYPH_BY_TYPE: Record<string, string> = {
  SCHEMA_DENIED: '!',
};

/**
 * Itemized, actionable anomalies from `GET /api/v1/attention` (KH-1.1.5-BE)
 * — computed on read from the audit trail. Only `SCHEMA_DENIED` is rendered
 * with type-specific copy (its `detail` shape was verified live against the
 * running platform); any other `type` the backend adds later still renders
 * safely via a generic fallback instead of crashing on an unrecognized shape.
 */
export function NeedsAttentionPanel() {
  const { t, i18n } = useTranslation();
  const attention = useAttention();
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const items = attention.data?.items ?? [];

  return (
    <PanelCard
      title={t('dashboard.attention.title')}
      action={
        attention.isSuccess &&
        items.length > 0 && <span className={styles.countBadge}>{items.length}</span>
      }
    >
      {attention.isPending && <p className={styles.help}>{t('common.loading')}</p>}
      {attention.isError && <ApiErrorBanner error={attention.error} />}
      {attention.isSuccess && items.length === 0 && (
        <EmptyState
          title={t('dashboard.attention.emptyTitle')}
          body={t('dashboard.attention.emptyBody')}
        />
      )}
      {attention.isSuccess && items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item, index) => (
            <li key={index} className={styles.item}>
              <span className={styles.glyph} aria-hidden="true">
                {GLYPH_BY_TYPE[item.type ?? ''] ?? '•'}
              </span>
              <div className={styles.itemText}>
                <ItemBody item={item} />
                {item.occurredAt && (
                  <span className={`${styles.itemWhen} ltr-embed`}>
                    {dateFormat.format(new Date(item.occurredAt))}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
