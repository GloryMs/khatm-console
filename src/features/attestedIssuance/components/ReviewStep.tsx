import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { TypeToConfirmDialog } from '@/components/ui/TypeToConfirmDialog';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { ClaimField } from '@/features/issuance/claimsDef';
import type { AttestedIssueFormValues } from '../request';
import styles from './ReviewStep.module.css';

const CONFIRM_PREFIX_LENGTH = 8;

interface ReviewStepProps {
  digestHex: string;
  fileName: string;
  fields: ClaimField[];
  values: AttestedIssueFormValues;
  isBusy: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Step: the final, audited confirmation before `POST /api/v1/credentials/issue`
 * fires (spec FS-2.4 D4). An acknowledgment checkbox gates the "Issue" action;
 * confirming still requires retyping the digest's first 8 hex characters in
 * `TypeToConfirmDialog` (the same irreversible-action pattern C8's key
 * rotation established) — issuance itself isn't undoable, and this is the
 * operator's one legally-meaningful gesture (D4's own wording).
 */
export function ReviewStep({
  digestHex,
  fileName,
  fields,
  values,
  isBusy,
  errorMessage,
  onConfirm,
  onBack,
}: ReviewStepProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const [acknowledged, setAcknowledged] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const expectedText = digestHex.slice(0, CONFIRM_PREFIX_LENGTH);

  return (
    <div className={styles.review}>
      <Banner tone="info">{t('issueAttested.review.neverUploaded')}</Banner>
      <Banner tone="warning">{t('issueAttested.review.guaranteeLimit')}</Banner>

      <dl className={styles.summary}>
        <div className={styles.row}>
          <dt>{t('issueAttested.details.digestLabel')}</dt>
          <dd className="ltr-embed">{digestHex}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('issueAttested.review.fileName')}</dt>
          <dd className="ltr-embed">{fileName}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('issue.holderRef')}</dt>
          <dd>{values.holderRef}</dd>
        </div>
        {fields.map((field) => (
          <div className={styles.row} key={field.name}>
            <dt>{localize(field.labelI18n) || field.name}</dt>
            <dd>{values.claims[field.name] || t('common.unknown')}</dd>
          </div>
        ))}
        {values.attestationNote && (
          <div className={styles.row}>
            <dt>{t('issueAttested.details.attestationNote')}</dt>
            <dd>{values.attestationNote}</dd>
          </div>
        )}
      </dl>

      <label className={styles.acknowledge}>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        {t('issueAttested.review.acknowledge')}
      </label>

      <div className={styles.actions}>
        <Button variant="secondary" type="button" onClick={onBack} disabled={isBusy}>
          {t('issue.cancel')}
        </Button>
        <Button
          variant="primary"
          type="button"
          disabled={!acknowledged}
          onClick={() => setDialogOpen(true)}
        >
          {t('issueAttested.review.issueCta')}
        </Button>
      </div>

      {dialogOpen && (
        <TypeToConfirmDialog
          titleId="attested-issue-confirm-title"
          title={t('issueAttested.review.confirmTitle')}
          body={t('issueAttested.review.confirmBody')}
          expectedText={expectedText}
          typePromptLabel={t('issueAttested.review.typePrompt')}
          mismatchLabel={t('issueAttested.review.mismatch')}
          confirmLabel={t('issueAttested.review.confirmCta')}
          busyLabel={t('issueAttested.review.issuing')}
          cancelLabel={t('issue.cancel')}
          isBusy={isBusy}
          errorMessage={errorMessage}
          onConfirm={onConfirm}
          onCancel={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
