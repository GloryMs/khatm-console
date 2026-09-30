import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { SecretReveal } from '@/components/ui/SecretReveal';
import { copyToClipboard } from '@/components/ui/clipboard';
import styles from './RevealSecretsDialog.module.css';

interface RevealSecretsDialogProps {
  keyPrefix: string;
  apiKey: string;
  /** Only set for the first client of a root tenant (spec FS-2.7a D9). */
  holderHmacSecret?: string;
  /** Only set on a rotate result — the client this one replaces. */
  retiringClientId?: string;
  onClose: () => void;
}

/**
 * The one-time reveal for a freshly created or rotated issuer client (spec
 * FS-2.7a D10 V2/V3) — the `apiKey` and, when present, the tenant's
 * `holderHmacSecret` are shown here and never again. Unlike
 * {@link MintedKeyModal} (consuming parties, a single secret), this dialog
 * has no plain "Done" button: the only way to close it is the explicit
 * "I copied the key — close" action, so an operator can't dismiss it by
 * habit before actually copying the value. Neither secret is passed back to
 * a parent's state once closed — this component owns the last reference to
 * them.
 */
export function RevealSecretsDialog({
  keyPrefix,
  apiKey,
  holderHmacSecret,
  retiringClientId,
  onClose,
}: RevealSecretsDialogProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reveal-secrets-title"
      >
        <h2 id="reveal-secrets-title" className={styles.title}>
          {t('clients.reveal.title')}
        </h2>
        <p className={`${styles.prefixRow} ltr-embed`}>
          {t('clients.reveal.prefixLabel')} {keyPrefix}
        </p>
        {retiringClientId && (
          <p className={styles.retiringNote}>{t('clients.reveal.retiringNote')}</p>
        )}
        <Banner tone="warning">
          <p>{t('clients.reveal.warning')}</p>
        </Banner>

        <SecretReveal
          label={t('clients.reveal.apiKeyLabel')}
          value={apiKey}
          onceLabel={t('common.shownOnce')}
          revealLabel={t('common.reveal')}
          hideLabel={t('common.hide')}
          copyLabel={t('common.copy')}
          copiedMessage={t('common.copied')}
          onCopy={(value) => void copyToClipboard(value)}
        />

        {holderHmacSecret && (
          <>
            <Banner tone="warning">
              <p>{t('clients.reveal.holderSecretWarning')}</p>
            </Banner>
            <SecretReveal
              label={t('clients.reveal.holderSecretLabel')}
              value={holderHmacSecret}
              onceLabel={t('common.shownOnce')}
              revealLabel={t('common.reveal')}
              hideLabel={t('common.hide')}
              copyLabel={t('common.copy')}
              copiedMessage={t('common.copied')}
              onCopy={(value) => void copyToClipboard(value)}
            />
          </>
        )}

        <div className={styles.actions}>
          <Button variant="primary" type="button" onClick={onClose}>
            {t('clients.reveal.confirmCopiedAndClose')}
          </Button>
        </div>
      </div>
    </div>
  );
}
