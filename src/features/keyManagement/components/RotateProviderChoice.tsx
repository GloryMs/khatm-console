import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/ui/Banner';
import { KNOWN_PROVIDERS } from './providers';
import styles from './RotateProviderChoice.module.css';

interface RotateProviderChoiceProps {
  /** The ACTIVE key's own `kid`, shown informationally — the type-to-confirm
   * target is the tenant slug (KH-2.3.C11 D4), not this value, but the
   * operator still needs to see which key they're about to rotate. */
  activeKid: string | undefined;
  /** The ACTIVE key's own provider, if the field is present. */
  currentProvider: string | undefined;
  /** `null` = inherit the current provider (default, sends no `provider`). */
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * The rotate dialog's provider-switch choice (SESSION-C10, spec FS-2.3 D6):
 * "inherit the current provider" (always the default on open, sends no
 * `provider` at all — the literal pre-C10 behavior) plus one explicit option
 * per provider this console knows about ({@link KNOWN_PROVIDERS}). Only an
 * explicit choice that differs from the ACTIVE key's current provider shows
 * a warning — inheriting, or explicitly picking the provider already in use,
 * shows none.
 *
 * Provider values (`SOFT`/`VAULT`) are never spliced into translated prose —
 * only ever their own `.ltr-embed` span, next to a plain-language label —
 * the same convention {@link KeyList} already uses for the column badge, to
 * avoid bidi surprises with Latin tokens inside RTL sentences.
 */
export function RotateProviderChoice({
  activeKid,
  currentProvider,
  value,
  onChange,
}: RotateProviderChoiceProps) {
  const { t } = useTranslation();
  const isSwitch = value !== null && value !== currentProvider;

  return (
    <div className={styles.section}>
      <p className={styles.currentRow}>
        <span>{t('keyManagement.rotate.activeKidLabel')}</span>{' '}
        <span className="ltr-embed">{activeKid}</span>
      </p>
      <p className={styles.currentRow}>
        <span>{t('keyManagement.rotate.provider.currentLabel')}</span>{' '}
        <span className="ltr-embed">{currentProvider ?? t('keyManagement.providerUnknown')}</span>
      </p>

      <fieldset className={styles.fieldset}>
        <legend>{t('keyManagement.rotate.provider.legend')}</legend>
        <label className={styles.option}>
          <input
            type="radio"
            name="rotate-provider"
            checked={value === null}
            onChange={() => onChange(null)}
          />
          {t('keyManagement.rotate.provider.inheritOption')}
        </label>
        {KNOWN_PROVIDERS.map((provider) => (
          <label className={styles.option} key={provider}>
            <input
              type="radio"
              name="rotate-provider"
              checked={value === provider}
              onChange={() => onChange(provider)}
            />
            <span className="ltr-embed">{provider}</span>
          </label>
        ))}
      </fieldset>

      {isSwitch && (
        <Banner tone="warning">
          <p className={styles.switchTarget}>
            <span>{t('keyManagement.rotate.provider.switchTargetLabel')}</span>{' '}
            <span className="ltr-embed">{value}</span>
          </p>
          <p>
            {value === 'VAULT'
              ? t('keyManagement.rotate.provider.warningToVault')
              : t('keyManagement.rotate.provider.warningFromVault')}
          </p>
        </Banner>
      )}
    </div>
  );
}
