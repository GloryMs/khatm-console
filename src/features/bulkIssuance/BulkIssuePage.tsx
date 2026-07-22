import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { RequireScope } from '@/features/auth/RequireScope';
import { parseClaimsDef } from '@/features/issuance/claimsDef';
import { SchemaPicker } from '@/features/issuance/components/SchemaPicker';
import { minutesToFormValue, parseIsoDurationMinutes } from '@/features/issuance/duration';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { autoMapColumns, type ColumnMapping } from './columnMapping';
import { PreviewStep } from './components/PreviewStep';
import { ReportStep } from './components/ReportStep';
import { UploadMapStep } from './components/UploadMapStep';
import { downloadCsv, generateReportCsv, generateTemplateCsv, parseCsvFile } from './csv';
import { useBulkIssue, useIssueSchema, usePublishedSchemas } from './hooks';
import { buildReportRows, type ReportRowView } from './report';
import { buildBulkIssueRequest, type BatchOptionsValues } from './request';
import { isRowValid, validateRows, type ValidatedRow } from './rowValidation';
import type { BulkIssueResponse } from './api';
import styles from './BulkIssuePage.module.css';

type WizardStep = 'schema' | 'upload' | 'preview' | 'report';

const BLANK_OPTIONS: BatchOptionsValues = { maxUses: '', validMinutes: '', mintClaimCodes: true };

function toReportCsvRows(reportRows: ReportRowView[]) {
  return reportRows.map((row) => ({
    index: row.rowIndex + 1,
    status: row.clientExcluded ? 'EXCLUDED' : (row.result?.status ?? 'UNKNOWN'),
    ref: row.result?.ref,
    id: row.result?.id,
    claimCode: row.result?.claimCode,
    errorCode: row.result?.error?.code,
    errorMessage: row.result?.error?.message,
  }));
}

export function BulkIssuePage() {
  return (
    <RequireScope scope="issue">
      <BulkIssueWizard />
    </RequireScope>
  );
}

function BulkIssueWizard() {
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const schemas = usePublishedSchemas();
  const bulkIssue = useBulkIssue();

  const [step, setStep] = useState<WizardStep>('schema');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Awaited<ReturnType<typeof parseCsvFile>> | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [options, setOptions] = useState<BatchOptionsValues>(BLANK_OPTIONS);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [reportRows, setReportRows] = useState<ReportRowView[]>([]);
  const [response, setResponse] = useState<BulkIssueResponse | null>(null);

  const detail = useIssueSchema(selectedId);
  const fields = useMemo(() => parseClaimsDef(detail.data?.claimsDefJson).fields, [detail.data]);
  const selectedName = detail.data ? localize(detail.data.nameI18n) || detail.data.code : undefined;

  useEffect(() => {
    if (!detail.data) return;
    setOptions({
      maxUses: detail.data.defaultMaxUses === undefined ? '' : String(detail.data.defaultMaxUses),
      validMinutes: minutesToFormValue(parseIsoDurationMinutes(detail.data.defaultValidity)),
      mintClaimCodes: true,
    });
  }, [detail.data]);

  const resetAll = () => {
    setStep('schema');
    setSelectedId(null);
    setParsed(null);
    setMapping(null);
    setOptions(BLANK_OPTIONS);
    setValidatedRows([]);
    setReportRows([]);
    setResponse(null);
    bulkIssue.reset();
  };

  const handleDownloadTemplate = () => {
    if (!detail.data) return;
    downloadCsv(`${detail.data.code ?? 'schema'}-template.csv`, generateTemplateCsv(fields));
  };

  const handleFileSelected = async (file: File) => {
    const parsedCsv = await parseCsvFile(file);
    setParsed(parsedCsv);
    setMapping(autoMapColumns(parsedCsv.headers, fields));
  };

  const handleContinueToPreview = () => {
    if (!parsed || !mapping) return;
    setValidatedRows(validateRows(parsed, fields, mapping));
    setStep('preview');
  };

  const handleIssue = async () => {
    if (!detail.data?.code) return;
    const validRows = validatedRows.filter(isRowValid);
    const request = buildBulkIssueRequest(detail.data.code, validRows, options);
    const result = await bulkIssue.mutateAsync(request);
    setReportRows(buildReportRows(validatedRows, validRows, result));
    setResponse(result);
    setStep('report');
  };

  const handleExportReport = () => {
    if (!detail.data) return;
    const csv = generateReportCsv(toReportCsvRows(reportRows));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadCsv(`bulk-issue-${detail.data.code ?? 'schema'}-${timestamp}.csv`, csv);
  };

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('issueBulk.title')}</h1>
      <div className={styles.steps}>
        <span className={step === 'schema' ? styles.stepCurrent : undefined}>
          {t('issueBulk.stepSchema')}
        </span>
        <span className={step === 'upload' ? styles.stepCurrent : undefined}>
          {t('issueBulk.stepUpload')}
        </span>
        <span className={step === 'preview' ? styles.stepCurrent : undefined}>
          {t('issueBulk.stepPreview')}
        </span>
        <span className={step === 'report' ? styles.stepCurrent : undefined}>
          {t('issueBulk.stepReport')}
        </span>
      </div>

      {step === 'schema' && (
        <>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{t('issueBulk.stepSchema')}</h2>
            <p className={styles.help}>{t('issue.pickPrompt')}</p>
            {schemas.isPending && <p>{t('common.loading')}</p>}
            {schemas.isError && <ApiErrorBanner error={schemas.error} />}
            {schemas.data && (
              <SchemaPicker
                schemas={schemas.data}
                onPick={(schema) => {
                  if (schema.id) setSelectedId(schema.id);
                }}
              />
            )}
          </section>

          {selectedId && (
            <section className={styles.panel}>
              <div className={styles.selectedSchema}>
                <div>
                  <h2 className={styles.panelTitle}>{t('issueBulk.templateHeading')}</h2>
                  {selectedName && <p className={styles.help}>{selectedName}</p>}
                </div>
                <button
                  type="button"
                  className={styles.changeButton}
                  onClick={() => setSelectedId(null)}
                >
                  {t('issue.changeSchema')}
                </button>
              </div>
              {detail.isPending && <p>{t('common.loading')}</p>}
              {detail.isError && <ApiErrorBanner error={detail.error} />}
              {detail.data && (
                <>
                  <p className={styles.help}>{t('issueBulk.templateHelp')}</p>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleDownloadTemplate}
                    >
                      {t('issueBulk.downloadTemplate')}
                    </button>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => setStep('upload')}
                    >
                      {t('issueBulk.upload.continue')}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}

      {step === 'upload' && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('issueBulk.stepUpload')}</h2>
          <UploadMapStep
            fields={fields}
            parsed={parsed}
            mapping={mapping}
            onFileSelected={(file) => void handleFileSelected(file)}
            onMappingChange={setMapping}
            onBack={() => setStep('schema')}
            onContinue={handleContinueToPreview}
          />
        </section>
      )}

      {step === 'preview' && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('issueBulk.stepPreview')}</h2>
          <PreviewStep
            fields={fields}
            rows={validatedRows}
            options={options}
            onOptionsChange={setOptions}
            onBack={() => setStep('upload')}
            onSubmit={() => void handleIssue()}
            isSubmitting={bulkIssue.isPending}
            error={bulkIssue.error}
          />
        </section>
      )}

      {step === 'report' && response && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('issueBulk.stepReport')}</h2>
          <ReportStep
            reportRows={reportRows}
            response={response}
            onExport={handleExportReport}
            onStartOver={resetAll}
          />
        </section>
      )}
    </section>
  );
}
