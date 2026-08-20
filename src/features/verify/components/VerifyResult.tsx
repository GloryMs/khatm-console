import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { HashCompare } from './HashCompare';
import type { VerifyResponse } from '../api';
import styles from './VerifyResult.module.css';

/** A disclosed claim shaped like a hex digest (spec FS-2.4 D3's `doc_sha256` convention) can be locally re-verified — session veto V1. */
const HEX_DIGEST_PATTERN = /^[0-9a-f]{64}$/i;

/**
 * The optional status-list fields the KH-1.3 lane may add to `VerifyResponse`.
 * They are absent from the current contract, so they are read defensively and
 * rendered only when the server actually returns them — never a crash.
 */
interface StatusListExtras {
  statusListChecked?: boolean;
  statusListVersion?: number;
  statusListUri?: string;
}

function renderClaimValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function VerifyResult({ result }: { result: VerifyResponse }) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  const claims = (result.claims ?? {}) as Record<string, unknown>;
  const claimEntries = Object.entries(claims).filter(([, v]) => v !== undefined);
  const extras = result as VerifyResponse & StatusListExtras;
  const reasonText = result.reasonMessage ?? result.reason;

  return (
    <div className={styles.result} data-testid="verify-result">
      <div className={styles.head}>
        <StatusBadge tone={result.valid ? 'success' : 'danger'}>
          {result.valid ? t('verify.valid') : t('verify.invalid')}
        </StatusBadge>
        {result.revoked !== undefined && (
          <span className={styles.note}>
            {result.revoked ? t('verify.revoked') : t('verify.notRevoked')}
          </span>
        )}
      </div>

      {reasonText && (
        <div className={styles.row}>
          <span className={styles.rowLabel}>{t('verify.reason')}</span>
          <span className={styles.value}>{reasonText}</span>
        </div>
      )}

      {result.usesRemaining !== undefined && (
        <div className={styles.row}>
          <span className={styles.rowLabel}>{t('verify.usesRemaining')}</span>
          <span className={`${styles.value} ltr-embed`}>{result.usesRemaining}</span>
        </div>
      )}

      <div className={styles.row}>
        <span className={styles.rowLabel}>{t('verify.disclosedClaims')}</span>
        {claimEntries.length === 0 ? (
          <span className={styles.note}>{t('verify.noClaims')}</span>
        ) : (
          <ul className={styles.claims}>
            {claimEntries.map(([key, value]) => {
              const rendered = renderClaimValue(value);
              const isDigest = typeof value === 'string' && HEX_DIGEST_PATTERN.test(value);
              return (
                <li key={key} className={styles.claimRow}>
                  <div className={styles.claim}>
                    <span className={`${styles.claimKey} ltr-embed`}>{key}</span>
                    <span className={`${styles.value} ltr-embed`}>{rendered}</span>
                  </div>
                  {isDigest && <HashCompare expectedDigest={rendered} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {(result.issuerLineage ?? []).length > 0 && (
        <div className={styles.row}>
          <span className={styles.rowLabel}>{t('verify.issuerLineage.label')}</span>
          <span className={styles.value}>
            {(result.issuerLineage ?? []).map((entry, index) => (
              <span key={entry.slug ?? index}>
                {index > 0 && ' — '}
                {localize(entry.nameI18n) || <span className="ltr-embed">{entry.slug}</span>}
              </span>
            ))}
          </span>
        </div>
      )}

      {(extras.statusListChecked !== undefined ||
        extras.statusListVersion !== undefined ||
        extras.statusListUri !== undefined) && (
        <div className={styles.meta}>
          {extras.statusListChecked !== undefined && (
            <span>
              {t('verify.statusChecked')}: {extras.statusListChecked ? '✓' : '✗'}
            </span>
          )}
          {extras.statusListVersion !== undefined && (
            <span className="ltr-embed">
              {t('verify.statusVersion')}: {extras.statusListVersion}
            </span>
          )}
          {extras.statusListUri && (
            <span className="ltr-embed">
              {t('verify.statusUri')}: {extras.statusListUri}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
