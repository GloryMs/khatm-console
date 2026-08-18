import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import tableStyles from '@/components/ui/Table.module.css';
import type { SigningKeyView } from '../api';
import { PROVIDER_TONE } from './providers';

const STATE_TONE: Record<string, StatusTone> = {
  ACTIVE: 'success',
  RETIRING: 'warning',
  PENDING: 'info',
  RETIRED: 'neutral',
};

const STATE_LABEL_KEY: Record<string, string> = {
  ACTIVE: 'keyManagement.states.active',
  RETIRING: 'keyManagement.states.retiring',
  PENDING: 'keyManagement.states.pending',
  RETIRED: 'keyManagement.states.retired',
};

interface KeyListProps {
  keys: SigningKeyView[];
  onRetire: (key: SigningKeyView) => void;
}

/** Full lifecycle table for the Key Management page — Retire shows only on RETIRING rows. */
export function KeyList({ keys, onRetire }: KeyListProps) {
  const { t, i18n } = useTranslation();
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  if (keys.length === 0) {
    return <EmptyState title={t('keyManagement.emptyTitle')} body={t('keyManagement.emptyBody')} />;
  }

  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th className={tableStyles.codeCell}>{t('keyManagement.columnKid')}</th>
          <th>{t('keyManagement.columnState')}</th>
          <th>{t('keyManagement.columnProvider')}</th>
          <th>{t('keyManagement.validFrom')}</th>
          <th>{t('keyManagement.validTo')}</th>
          <th>{t('keyManagement.columnActions')}</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((key) => {
          const tone = STATE_TONE[key.state ?? ''] ?? 'neutral';
          const labelKey = STATE_LABEL_KEY[key.state ?? ''];
          return (
            <tr key={key.kid}>
              <td className={`${tableStyles.codeCell} ltr-embed`}>{key.kid}</td>
              <td>
                <StatusBadge tone={tone}>{labelKey ? t(labelKey) : key.state}</StatusBadge>
              </td>
              <td>
                <StatusBadge tone={PROVIDER_TONE[key.provider ?? ''] ?? 'neutral'}>
                  {key.provider ? (
                    <span className="ltr-embed">{key.provider}</span>
                  ) : (
                    t('keyManagement.providerUnknown')
                  )}
                </StatusBadge>
              </td>
              <td className="ltr-embed">
                {key.validFrom ? dateFormat.format(new Date(key.validFrom)) : '—'}
              </td>
              <td className="ltr-embed">
                {key.validTo
                  ? dateFormat.format(new Date(key.validTo))
                  : t('keyManagement.noExpiry')}
              </td>
              <td>
                {key.state === 'RETIRING' && key.kid && (
                  <Button variant="secondary" type="button" onClick={() => onRetire(key)}>
                    {t('keyManagement.retireCta')}
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
