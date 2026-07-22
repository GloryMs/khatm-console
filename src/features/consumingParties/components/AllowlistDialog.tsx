import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { SchemaSummary } from '@/features/schemas/api';
import { computeAllowlistDiff } from '../allowlistDiff';
import type { ConsumingPartyView } from '../api';
import styles from './AllowlistDialog.module.css';

interface AllowlistDialogProps {
  party: ConsumingPartyView;
  schemas: SchemaSummary[];
  isSaving?: boolean;
  error?: unknown;
  onSave: (diff: { toAllow: string[]; toDisallow: string[] }) => void;
  onCancel: () => void;
}

export function AllowlistDialog({
  party,
  schemas,
  isSaving,
  error,
  onSave,
  onCancel,
}: AllowlistDialogProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const initialIds = (party.allowedSchemas ?? []).map((entry) => entry.schemaId ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));

  const toggle = (schemaId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(schemaId)) next.delete(schemaId);
      else next.add(schemaId);
      return next;
    });
  };

  const onConfirmSave = () => {
    onSave(computeAllowlistDiff(initialIds, [...selected]));
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="allowlist-title"
      >
        <h2 id="allowlist-title" className={styles.title}>
          {t('consumingParties.allowlist.title', { code: party.code ?? '' })}
        </h2>
        <p className={styles.body}>{t('consumingParties.allowlist.help')}</p>
        {schemas.length === 0 ? (
          <p className={styles.body}>{t('consumingParties.allowlist.empty')}</p>
        ) : (
          <ul className={styles.list}>
            {schemas.map((schema) => {
              const id = schema.id ?? '';
              return (
                <li key={id} className={styles.row}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} />
                    <span>{localize(schema.nameI18n) || schema.code}</span>
                    <span className={`${styles.meta} ltr-embed`}>{schema.code}</span>
                    <span className={styles.status}>{schema.status}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <ApiErrorBanner error={error} />
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={isSaving}>
            {t('consumingParties.allowlist.cancel')}
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={onConfirmSave}
            disabled={isSaving}
          >
            {isSaving
              ? t('consumingParties.allowlist.saving')
              : t('consumingParties.allowlist.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
