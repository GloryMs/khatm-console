import { useTranslation } from 'react-i18next';
import type { BulkIssueItemError, BulkIssueResponse } from '../api';
import { deriveReportStatus, type ReportRowView } from '../report';
import styles from './ReportStep.module.css';

interface ReportStepProps {
  reportRows: ReportRowView[];
  response: BulkIssueResponse;
  onExport: () => void;
  onStartOver: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={() => navigator.clipboard.writeText(value)}
    >
      {label}
    </button>
  );
}

const STATUS_KEY = {
  ISSUED: 'issueBulk.report.statusIssued',
  FAILED: 'issueBulk.report.statusFailed',
  EXCLUDED: 'issueBulk.report.statusExcluded',
  UNKNOWN: 'issueBulk.report.statusUnknown',
} as const;

const STATUS_CLASS = {
  ISSUED: 'statusIssued',
  FAILED: 'statusFailed',
  EXCLUDED: 'statusExcluded',
  UNKNOWN: 'statusExcluded',
} as const;

/** Step 4: the per-row report — the only place claim codes are ever shown, and only once. */
export function ReportStep({ reportRows, response, onExport, onStartOver }: ReportStepProps) {
  const { t, i18n } = useTranslation();

  const resolveItemError = (error: BulkIssueItemError | undefined): string => {
    if (!error) return '';
    if (error.code) {
      const key = `errors.${error.code}`;
      if (i18n.exists(key)) return t(key);
    }
    return error.message ?? t('errors.generic');
  };

  const excludedCount = reportRows.filter((row) => row.clientExcluded).length;
  const hasClaimCodes = reportRows.some((row) => row.result?.claimCode);

  return (
    <div>
      <div className={styles.summary}>
        <span>{t('issueBulk.report.total', { count: response.total ?? reportRows.length })}</span>
        <span>{t('issueBulk.report.succeeded', { count: response.succeeded ?? 0 })}</span>
        <span>{t('issueBulk.report.failed', { count: response.failed ?? 0 })}</span>
        {excludedCount > 0 && (
          <span>{t('issueBulk.report.excluded', { count: excludedCount })}</span>
        )}
      </div>

      {hasClaimCodes && <p className={styles.warning}>{t('issueBulk.report.claimCodesWarning')}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('issueBulk.preview.columnRow')}</th>
              <th>{t('issueBulk.upload.pseudoRefColumn')}</th>
              <th>{t('issueBulk.report.columnStatus')}</th>
              <th>{t('issue.refLabel')}</th>
              <th>{t('issue.claimCodeLabel')}</th>
              <th>{t('issueBulk.report.columnError')}</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map((row) => {
              const status = deriveReportStatus(row);
              return (
                <tr key={row.rowIndex}>
                  <td>{row.rowIndex + 1}</td>
                  <td className="ltr-embed">{row.pseudoRef}</td>
                  <td className={styles[STATUS_CLASS[status]]}>{t(STATUS_KEY[status])}</td>
                  <td className="ltr-embed">{row.result?.ref}</td>
                  <td className="ltr-embed">
                    {row.result?.claimCode && (
                      <>
                        <span className={styles.codeValue}>{row.result.claimCode}</span>
                        <CopyButton value={row.result.claimCode} label={t('common.copy')} />
                      </>
                    )}
                  </td>
                  <td>{resolveItemError(row.result?.error)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={onExport}>
          {t('issueBulk.report.exportCsv')}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={onStartOver}
        >
          {t('issueBulk.report.startOver')}
        </button>
      </div>
    </div>
  );
}
