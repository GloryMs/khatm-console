import { useTranslation } from 'react-i18next';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import tableStyles from '@/components/ui/Table.module.css';
import { copyToClipboard } from '@/components/ui/clipboard';
import type { BulkIssueResponse } from '../api';
import { deriveReportStatus, resolveItemErrorText, type ReportRowView } from '../report';
import styles from './ReportStep.module.css';

interface ReportStepProps {
  reportRows: ReportRowView[];
  response: BulkIssueResponse;
  onExport: () => void;
  onStartOver: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <button type="button" className={styles.copyButton} onClick={() => void copyToClipboard(value)}>
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

const STATUS_TONE = {
  ISSUED: 'success',
  FAILED: 'danger',
  EXCLUDED: 'neutral',
  UNKNOWN: 'neutral',
} as const satisfies Record<string, StatusTone>;

/** Step 4: the per-row report — the only place claim codes are ever shown, and only once. */
export function ReportStep({ reportRows, response, onExport, onStartOver }: ReportStepProps) {
  const { t, i18n } = useTranslation();

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
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>{t('issueBulk.preview.columnRow')}</th>
              <th>{t('issueBulk.upload.pseudoRefColumn')}</th>
              <th>{t('issueBulk.report.columnStatus')}</th>
              <th>{t('issue.refLabel')}</th>
              <th>{t('issue.holderRef')}</th>
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
                  <td className={tableStyles.codeCell}>{row.pseudoRef}</td>
                  <td>
                    <StatusBadge tone={STATUS_TONE[status]}>{t(STATUS_KEY[status])}</StatusBadge>
                  </td>
                  <td className={tableStyles.codeCell}>{row.result?.ref}</td>
                  <td className={tableStyles.codeCell}>{row.result?.holderRef}</td>
                  <td className={tableStyles.codeCell}>
                    {row.result?.claimCode && (
                      <>
                        <span className={styles.codeValue}>{row.result.claimCode}</span>
                        <CopyButton value={row.result.claimCode} label={t('common.copy')} />
                      </>
                    )}
                  </td>
                  <td>{resolveItemErrorText(row.result?.error, t, (key) => i18n.exists(key))}</td>
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
