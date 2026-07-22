import { useTranslation } from 'react-i18next';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { ConsumingPartyView } from '../api';
import styles from './PartyList.module.css';

interface PartyListProps {
  parties: ConsumingPartyView[];
  onSuspend: (party: ConsumingPartyView) => void;
  onActivate: (party: ConsumingPartyView) => void;
  onManageAllowlist: (party: ConsumingPartyView) => void;
  onMintKey: (party: ConsumingPartyView) => void;
}

export function PartyList({
  parties,
  onSuspend,
  onActivate,
  onManageAllowlist,
  onMintKey,
}: PartyListProps) {
  const { t, i18n } = useTranslation();
  const localize = useLocalizedText();

  if (parties.length === 0) return <p>{t('consumingParties.empty')}</p>;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>{t('consumingParties.columnName')}</th>
          <th className="ltr-embed">{t('consumingParties.columnCode')}</th>
          <th>{t('consumingParties.columnStatus')}</th>
          <th>{t('consumingParties.columnAllowedSchemas')}</th>
          <th>{t('consumingParties.columnCreatedAt')}</th>
          <th>{t('consumingParties.columnActions')}</th>
        </tr>
      </thead>
      <tbody>
        {parties.map((party) => {
          const id = party.id ?? '';
          const isActive = party.status === 'ACTIVE';
          const createdAt = party.createdAt
            ? new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(party.createdAt))
            : '';
          return (
            <tr key={id}>
              <td>{localize(party.nameI18n) || party.code}</td>
              <td className="ltr-embed">{party.code}</td>
              <td>
                <span
                  className={`${styles.status} ${isActive ? styles.statusActive : styles.statusSuspended}`}
                >
                  {isActive
                    ? t('consumingParties.statusActive')
                    : t('consumingParties.statusSuspended')}
                </span>
              </td>
              <td>
                <div className={styles.chips}>
                  {(party.allowedSchemas ?? []).length === 0 ? (
                    <span className={styles.noChips}>{t('consumingParties.noAllowedSchemas')}</span>
                  ) : (
                    (party.allowedSchemas ?? []).map((entry) => (
                      <span key={entry.schemaId} className={`${styles.chip} ltr-embed`}>
                        {entry.schemaCode}
                      </span>
                    ))
                  )}
                </div>
              </td>
              <td>{createdAt}</td>
              <td>
                <div className={styles.actions}>
                  {isActive ? (
                    <button
                      type="button"
                      className={styles.action}
                      onClick={() => onSuspend(party)}
                    >
                      {t('consumingParties.actionSuspend')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.action}
                      onClick={() => onActivate(party)}
                    >
                      {t('consumingParties.actionActivate')}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => onManageAllowlist(party)}
                  >
                    {t('consumingParties.actionAllowlist')}
                  </button>
                  <button type="button" className={styles.action} onClick={() => onMintKey(party)}>
                    {t('consumingParties.actionMintKey')}
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
