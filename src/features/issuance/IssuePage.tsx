import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SecretReveal } from '@/components/ui/SecretReveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { copyToClipboard } from '@/components/ui/clipboard';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { parseClaimsDef } from './claimsDef';
import { IssueForm, type IssueFormValues } from './components/IssueForm';
import { SchemaPicker } from './components/SchemaPicker';
import { minutesToFormValue, parseIsoDurationMinutes } from './duration';
import { useIssueAndMintCredential, useIssueSchema, usePublishedSchemas } from './hooks';
import { getQrApiBase, isLocalhostOrigin, serializeQrPayload } from './qrPayload';
import type { IssueRequest, SchemaDetail } from './api';
import styles from './IssuePage.module.css';

interface SuccessState {
  ref: string;
  code: string;
  expiresAt: string;
  qrApiBase: string;
  qrPayload: string;
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function buildClaims(values: Record<string, string>): IssueRequest['claims'] {
  const claims: NonNullable<IssueRequest['claims']> = {};
  for (const [key, value] of Object.entries(values)) {
    claims[key] = value as unknown as Record<string, never>;
  }
  return claims;
}

function requireText(value: string | undefined, errorKey: string): string {
  if (!value) throw new Error(errorKey);
  return value;
}

function formatExpiresAt(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatCountdown(value: string, locale: string): string {
  const expiresAt = new Date(value).getTime();
  if (Number.isNaN(expiresAt)) return '';
  const diffMinutes = Math.ceil((expiresAt - Date.now()) / 60_000);
  if (diffMinutes <= 0)
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'minute');
  if (diffMinutes < 60)
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(diffMinutes, 'minute');
  const diffHours = Math.ceil(diffMinutes / 60);
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(diffHours, 'hour');
}

function buildIssueRequest(detail: SchemaDetail, values: IssueFormValues): IssueRequest {
  return {
    holderRef: values.holderRef,
    schemaCode: requireText(detail.code, 'issue.missingSchemaCode'),
    // Pins issuance to the exact schema version the operator picked, not whatever
    // (schemaCode, version=1) the backend would otherwise resolve on its own.
    schemaId: requireText(detail.id, 'issue.missingSchemaCode'),
    claims: buildClaims(values.claims),
    maxUses: toNumber(values.maxUses),
    validMinutes: toNumber(values.validMinutes),
    sdFields: detail.sdFields,
  };
}

function SuccessView({
  success,
  onIssueAnother,
}: {
  success: SuccessState;
  onIssueAnother: () => void;
}) {
  const { t, i18n } = useTranslation();
  const countdown = formatCountdown(success.expiresAt, i18n.language);
  return (
    <div className={styles.successGrid}>
      <div className={styles.successHead}>
        <StatusBadge tone="success">{t('issue.issuedBadge')}</StatusBadge>
        <h2 className={styles.panelTitle}>{t('issue.successTitle')}</h2>
      </div>
      <div className={styles.valueRow}>
        <span className={styles.valueLabel}>{t('issue.refLabel')}</span>
        <span className={`${styles.codeValue} ltr-embed`}>{success.ref}</span>
        <Button variant="ghost" type="button" onClick={() => void copyToClipboard(success.ref)}>
          {t('common.copy')}
        </Button>
      </div>
      <p className={styles.help}>{t('issue.refHelp')}</p>

      <SecretReveal
        label={t('issue.claimCodeLabel')}
        value={success.code}
        onceLabel={t('common.shownOnce')}
        revealLabel={t('common.reveal')}
        hideLabel={t('common.hide')}
        helperText={t('issue.codeShownOnce')}
        copyLabel={t('common.copy')}
        onCopy={(value) => void copyToClipboard(value)}
        copiedMessage={t('common.copied')}
      />

      <div className={styles.valueRow}>
        <span className={styles.valueLabel}>{t('issue.codeExpiresAt')}</span>
        <span>{formatExpiresAt(success.expiresAt, i18n.language)}</span>
        {countdown && <span>{countdown}</span>}
      </div>

      <div className={styles.qrBox}>
        <h3 className={styles.panelTitle}>{t('issue.qrTitle')}</h3>
        <QRCodeSVG value={success.qrPayload} size={220} className={styles.qrCode} />
        <p className={`${styles.help} ltr-embed`}>
          {t('issue.qrApiBase')}: {success.qrApiBase}
        </p>
        {isLocalhostOrigin(success.qrApiBase) && (
          <p className={styles.warning} role="alert">
            {t('issue.qrLocalhostHint')}
          </p>
        )}
      </div>
      <Button
        variant="secondary"
        type="button"
        className={styles.issueAnotherButton}
        onClick={onIssueAnother}
      >
        {t('issue.issueAnother')}
      </Button>
    </div>
  );
}

export function IssuePage() {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const schemas = usePublishedSchemas();
  const issueAndMint = useIssueAndMintCredential();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const detail = useIssueSchema(selectedId);

  const fields = useMemo(() => parseClaimsDef(detail.data?.claimsDefJson).fields, [detail.data]);
  const defaults = useMemo(
    () => ({
      maxUses: detail.data?.defaultMaxUses === undefined ? '' : String(detail.data.defaultMaxUses),
      validMinutes: minutesToFormValue(parseIsoDurationMinutes(detail.data?.defaultValidity)),
    }),
    [detail.data],
  );

  const selectedName = detail.data ? localize(detail.data.nameI18n) || detail.data.code : undefined;

  const onSubmit = async (values: IssueFormValues) => {
    if (!detail.data) return;
    const response = await issueAndMint.mutateAsync({
      issue: buildIssueRequest(detail.data, values),
    });
    const code = requireText(response.claimCode.code, 'issue.missingClaimCode');
    const expiresAt = requireText(response.claimCode.expiresAt, 'issue.missingClaimCodeExpiry');
    const qrApiBase = getQrApiBase();
    setSuccess({
      ref: response.issued.ref ?? requireText(response.issued.id, 'issue.missingCredentialId'),
      code,
      expiresAt,
      qrApiBase,
      qrPayload: serializeQrPayload({ v: 1, api: qrApiBase, code }),
    });
  };

  const resetFlow = () => {
    setSelectedId(null);
    setSuccess(null);
    issueAndMint.reset();
  };

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('issue.title')}</h1>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>{t('issue.stepPick')}</h2>
        <p className={styles.help}>{t('issue.pickPrompt')}</p>
        {schemas.isPending && <p>{t('common.loading')}</p>}
        {schemas.isError && <ApiErrorBanner error={schemas.error} />}
        {schemas.data && (
          <SchemaPicker
            schemas={schemas.data}
            onPick={(schema) => {
              if (schema.id) {
                setSelectedId(schema.id);
                setSuccess(null);
              }
            }}
          />
        )}
      </section>

      {selectedId && (
        <section className={styles.formPanel}>
          <div className={styles.formPanelHead}>
            <div className={styles.selectedSchema}>
              <div>
                <h2 className={styles.panelTitle}>{t('issue.stepForm')}</h2>
                {selectedName && <p className={styles.help}>{selectedName}</p>}
              </div>
              <Button variant="ghost" type="button" onClick={resetFlow}>
                {t('issue.changeSchema')}
              </Button>
            </div>

            {detail.isPending && <p>{t('common.loading')}</p>}
            {detail.isError && <ApiErrorBanner error={detail.error} />}
          </div>

          {detail.data && (
            <div className={styles.grid}>
              <div className={styles.left}>
                <IssueForm
                  key={detail.data.id}
                  fields={fields}
                  defaults={defaults}
                  sdFields={detail.data.sdFields ?? []}
                  onSubmit={onSubmit}
                  onBack={resetFlow}
                  isSubmitting={issueAndMint.isPending}
                  error={issueAndMint.error}
                />
              </div>
              <div className={styles.right}>
                {success ? (
                  <SuccessView success={success} onIssueAnother={resetFlow} />
                ) : (
                  <EmptyState
                    title={t('issue.resultEmptyTitle')}
                    body={t('issue.resultEmptyBody')}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
