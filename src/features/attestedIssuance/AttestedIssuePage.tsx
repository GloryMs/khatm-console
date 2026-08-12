import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SecretReveal } from '@/components/ui/SecretReveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { copyToClipboard } from '@/components/ui/clipboard';
import { useErrorMessage } from '@/api/useErrorMessage';
import { RequireScope } from '@/features/auth/RequireScope';
import { parseClaimsDef } from '@/features/issuance/claimsDef';
import { SchemaPicker } from '@/features/issuance/components/SchemaPicker';
import { minutesToFormValue, parseIsoDurationMinutes } from '@/features/issuance/duration';
import { getQrApiBase, isLocalhostOrigin, serializeQrPayload } from '@/features/issuance/qrPayload';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { splitClaimFields } from './claimFields';
import { DetailsForm } from './components/DetailsForm';
import { ScanStep, type ScannedFileMeta } from './components/ScanStep';
import { ReviewStep } from './components/ReviewStep';
import { useAttestedSchemas, useIssueAndMintCredential, useIssueSchema } from './hooks';
import { buildAttestedIssueRequest, type AttestedIssueFormValues } from './request';
import styles from './AttestedIssuePage.module.css';

type WizardStep = 'schema' | 'scan' | 'details' | 'review' | 'success';

interface SuccessState {
  ref: string;
  code: string;
  expiresAt: string;
  qrApiBase: string;
  qrPayload: string;
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

function SuccessView({
  success,
  onIssueAnother,
}: {
  success: SuccessState;
  onIssueAnother: () => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <div className={styles.successGrid}>
      <div className={styles.successHead}>
        <StatusBadge tone="success">{t('issue.issuedBadge')}</StatusBadge>
        <h2 className={styles.panelTitle}>{t('issue.successTitle')}</h2>
      </div>

      <Banner tone="warning">{t('issueAttested.review.guaranteeLimit')}</Banner>

      <div className={styles.valueRow}>
        <span className={styles.valueLabel}>{t('issue.refLabel')}</span>
        <span className={`${styles.codeValue} ltr-embed`}>{success.ref}</span>
        <Button variant="ghost" type="button" onClick={() => void copyToClipboard(success.ref)}>
          {t('common.copy')}
        </Button>
      </div>

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
      </div>

      <div className={styles.qrBox}>
        <h3 className={styles.panelTitle}>{t('issue.qrTitle')}</h3>
        <QRCodeSVG value={success.qrPayload} size={220} className={styles.qrCode} />
        {isLocalhostOrigin(success.qrApiBase) && (
          <p className={styles.warning} role="alert">
            {t('issue.qrLocalhostHint')}
          </p>
        )}
      </div>

      <Button variant="secondary" type="button" onClick={onIssueAnother}>
        {t('issue.issueAnother')}
      </Button>
    </div>
  );
}

export function AttestedIssuePage() {
  return (
    <RequireScope scope="issue">
      <AttestedIssueWizard />
    </RequireScope>
  );
}

function AttestedIssueWizard() {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const resolveError = useErrorMessage();
  const schemas = useAttestedSchemas();
  const issueAndMint = useIssueAndMintCredential();

  const [step, setStep] = useState<WizardStep>('schema');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [digestHex, setDigestHex] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<ScannedFileMeta | null>(null);
  const [formValues, setFormValues] = useState<AttestedIssueFormValues | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const detail = useIssueSchema(selectedId);
  const allFields = useMemo(() => parseClaimsDef(detail.data?.claimsDefJson).fields, [detail.data]);
  const { otherFields } = useMemo(() => splitClaimFields(allFields), [allFields]);
  const defaults = useMemo(
    () => ({
      maxUses: detail.data?.defaultMaxUses === undefined ? '' : String(detail.data.defaultMaxUses),
      validMinutes: minutesToFormValue(parseIsoDurationMinutes(detail.data?.defaultValidity)),
    }),
    [detail.data],
  );

  const selectedName = detail.data ? localize(detail.data.nameI18n) || detail.data.code : undefined;

  const resetAll = () => {
    setStep('schema');
    setSelectedId(null);
    setDigestHex(null);
    setFileMeta(null);
    setFormValues(null);
    setSuccess(null);
    issueAndMint.reset();
  };

  const backToScan = () => {
    setDigestHex(null);
    setFileMeta(null);
    setStep('scan');
  };

  const onConfirmIssue = async () => {
    if (!detail.data || !digestHex || !formValues) return;
    const response = await issueAndMint.mutateAsync({
      issue: buildAttestedIssueRequest(detail.data, formValues, digestHex),
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
    setStep('success');
  };

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('issueAttested.title')}</h1>
      <p className={styles.help}>{t('issueAttested.intro')}</p>

      {step === 'schema' && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('issue.stepPick')}</h2>
          <p className={styles.help}>{t('issueAttested.pickPrompt')}</p>
          {schemas.isPending && <p>{t('common.loading')}</p>}
          {schemas.isError && <ApiErrorBanner error={schemas.error} />}
          {schemas.data && (
            <SchemaPicker
              schemas={schemas.data}
              onPick={(schema) => {
                if (schema.id) {
                  setSelectedId(schema.id);
                  setStep('scan');
                }
              }}
            />
          )}
        </section>
      )}

      {step !== 'schema' && (
        <section className={styles.formPanel}>
          <div className={styles.formPanelHead}>
            <div className={styles.selectedSchema}>
              <div>
                <h2 className={styles.panelTitle}>{t('issue.stepForm')}</h2>
                {selectedName && <p className={styles.help}>{selectedName}</p>}
              </div>
              <Button variant="ghost" type="button" onClick={resetAll}>
                {t('issue.changeSchema')}
              </Button>
            </div>
            {detail.isPending && <p>{t('common.loading')}</p>}
            {detail.isError && <ApiErrorBanner error={detail.error} />}
          </div>

          {detail.data && (
            <div className={styles.body}>
              {step === 'scan' && (
                <ScanStep
                  onHashed={(digest, file) => {
                    setDigestHex(digest);
                    setFileMeta(file);
                    setStep('details');
                  }}
                  onBack={resetAll}
                />
              )}

              {step === 'details' && digestHex && (
                <DetailsForm
                  digestHex={digestHex}
                  fields={otherFields}
                  sdFields={detail.data.sdFields ?? []}
                  defaults={defaults}
                  initialValues={formValues ?? undefined}
                  onSubmit={(values) => {
                    setFormValues(values);
                    setStep('review');
                  }}
                  onChangeFile={backToScan}
                  onBack={resetAll}
                />
              )}

              {step === 'review' && digestHex && fileMeta && formValues && (
                <ReviewStep
                  digestHex={digestHex}
                  fileName={fileMeta.name}
                  fields={otherFields}
                  values={formValues}
                  isBusy={issueAndMint.isPending}
                  errorMessage={issueAndMint.isError ? resolveError(issueAndMint.error) : undefined}
                  onConfirm={() => void onConfirmIssue()}
                  onBack={() => setStep('details')}
                />
              )}

              {step === 'success' &&
                (success ? (
                  <SuccessView success={success} onIssueAnother={resetAll} />
                ) : (
                  <EmptyState
                    title={t('issue.resultEmptyTitle')}
                    body={t('issue.resultEmptyBody')}
                  />
                ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
