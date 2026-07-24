import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import tableStyles from '@/components/ui/Table.module.css';
import type { ClaimField } from '@/features/issuance/claimsDef';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import type { BatchOptionsValues } from '../request';
import { isRowValid, type RowErrorKind, type ValidatedRow } from '../rowValidation';
import styles from './PreviewStep.module.css';

const ERROR_KEY_BY_KIND: Record<RowErrorKind, string> = {
  required: 'issue.fieldRequired',
  number: 'issue.fieldInvalidNumber',
  date: 'issue.fieldInvalidDate',
};

interface PreviewStepProps {
  fields: ClaimField[];
  rows: ValidatedRow[];
  options: BatchOptionsValues;
  onOptionsChange: (options: BatchOptionsValues) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: unknown;
}

/** Step 3: per-row validation preview, batch defaults, and the bulk-issue submit. */
export function PreviewStep({
  fields,
  rows,
  options,
  onOptionsChange,
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: PreviewStepProps) {
  const { t } = useTranslation();
  const localize = useLocalizedText();

  const labelFor = (fieldName: string): string => {
    const field = fields.find((f) => f.name === fieldName);
    if (!field) return fieldName;
    return localize(field.labelI18n) || field.name;
  };

  const validCount = rows.filter(isRowValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div>
      <div className={styles.summary}>
        <span>{t('issueBulk.preview.totalRows', { count: rows.length })}</span>
        <span>{t('issueBulk.preview.validRows', { count: validCount })}</span>
        {invalidCount > 0 && (
          <span className={styles.summaryInvalid}>
            {t('issueBulk.preview.invalidRows', { count: invalidCount })}
          </span>
        )}
      </div>

      <form
        className={styles.optionsForm}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className={styles.field}>
          <span>{t('issue.maxUses')}</span>
          <input
            type="number"
            min={1}
            value={options.maxUses}
            onChange={(event) => onOptionsChange({ ...options, maxUses: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>{t('issue.validMinutes')}</span>
          <input
            type="number"
            min={1}
            value={options.validMinutes}
            onChange={(event) => onOptionsChange({ ...options, validMinutes: event.target.value })}
          />
        </label>
        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            checked={options.mintClaimCodes}
            onChange={(event) =>
              onOptionsChange({ ...options, mintClaimCodes: event.target.checked })
            }
          />
          <span>{t('issueBulk.preview.mintClaimCodes')}</span>
        </label>

        {options.mintClaimCodes && (
          <p className={styles.warning}>{t('issueBulk.preview.claimCodesShownOnce')}</p>
        )}

        <div className={styles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>{t('issueBulk.preview.columnRow')}</th>
                <th>{t('issueBulk.upload.pseudoRefColumn')}</th>
                {fields.map((field) => (
                  <th key={field.name}>{labelFor(field.name)}</th>
                ))}
                <th>{t('issueBulk.preview.columnStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const valid = isRowValid(row);
                return (
                  <tr key={row.rowIndex} className={valid ? undefined : styles.rowInvalid}>
                    <td>{row.rowIndex + 1}</td>
                    <td className={tableStyles.codeCell}>{row.pseudoRef}</td>
                    {fields.map((field) => (
                      <td key={field.name}>{row.claims[field.name]}</td>
                    ))}
                    <td>
                      {valid ? (
                        <StatusBadge tone="success">{t('issueBulk.preview.valid')}</StatusBadge>
                      ) : (
                        <>
                          <StatusBadge tone="danger">{t('issueBulk.preview.invalid')}</StatusBadge>
                          <ul className={styles.errorList}>
                            {row.errors.map((rowError) => (
                              <li key={`${rowError.fieldName}-${rowError.kind}`}>
                                {t(ERROR_KEY_BY_KIND[rowError.kind], {
                                  field: labelFor(rowError.fieldName),
                                })}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ApiErrorBanner error={error} />

        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={onBack} disabled={isSubmitting}>
            {t('common.back')}
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.primaryButton}`}
            disabled={validCount === 0 || isSubmitting}
          >
            {isSubmitting
              ? t('issueBulk.preview.submitting')
              : t('issueBulk.preview.submit', { count: validCount })}
          </button>
        </div>
      </form>
    </div>
  );
}
