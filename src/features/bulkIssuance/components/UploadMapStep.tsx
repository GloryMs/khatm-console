import { useTranslation } from 'react-i18next';
import type { ClaimField } from '@/features/issuance/claimsDef';
import { BULK_MAX_ROWS, type ParsedCsv } from '../csv';
import { PSEUDO_REF_FIELD, type ColumnMapping } from '../columnMapping';
import styles from './UploadMapStep.module.css';

interface UploadMapStepProps {
  fields: ClaimField[];
  parsed: ParsedCsv | null;
  mapping: ColumnMapping | null;
  onFileSelected: (file: File) => void;
  onMappingChange: (mapping: ColumnMapping) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** Step 2: upload a CSV, then map its columns to the schema's claim fields. */
export function UploadMapStep({
  fields,
  parsed,
  mapping,
  onFileSelected,
  onMappingChange,
  onBack,
  onContinue,
}: UploadMapStepProps) {
  const { t } = useTranslation();

  const rowCount = parsed?.rows.length ?? 0;
  const tooManyRows = rowCount > BULK_MAX_ROWS;
  const hasRows = rowCount > 0;
  const canContinue = Boolean(parsed && mapping) && hasRows && !tooManyRows;

  const setClaimMapping = (fieldName: string, header: string) => {
    if (!mapping) return;
    onMappingChange({ ...mapping, claims: { ...mapping.claims, [fieldName]: header || null } });
  };

  const setPseudoRefMapping = (header: string) => {
    if (!mapping) return;
    onMappingChange({ ...mapping, pseudoRef: header || null });
  };

  return (
    <div className={styles.dropzone}>
      <label htmlFor="bulk-csv-file">{t('issueBulk.upload.fileLabel')}</label>
      <input
        id="bulk-csv-file"
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />

      {parsed && (
        <div className={styles.fileInfo}>
          <span>{t('issueBulk.upload.rowCount', { count: rowCount })}</span>
          {!hasRows && <span className={styles.errorText}>{t('issueBulk.upload.noRows')}</span>}
          {tooManyRows && (
            <span className={styles.errorText} role="alert">
              {t('issueBulk.upload.tooManyRows', { max: BULK_MAX_ROWS })}
            </span>
          )}
        </div>
      )}

      {parsed && mapping && (
        <div className={styles.mappingGrid}>
          {fields.map((field) => (
            <label key={field.name} className={styles.mappingLabel}>
              <span>
                {field.name}
                {field.required && <span className={styles.badge}>{t('issue.requiredField')}</span>}
              </span>
              <select
                value={mapping.claims[field.name] ?? ''}
                onChange={(event) => setClaimMapping(field.name, event.target.value)}
              >
                <option value="">{t('issueBulk.upload.unmapped')}</option>
                {parsed.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className={styles.mappingLabel}>
            <span>{PSEUDO_REF_FIELD}</span>
            <select
              value={mapping.pseudoRef ?? ''}
              onChange={(event) => setPseudoRefMapping(event.target.value)}
            >
              <option value="">{t('issueBulk.upload.unmapped')}</option>
              {parsed.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={onBack}>
          {t('common.back')}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.primaryButton}`}
          disabled={!canContinue}
          onClick={onContinue}
        >
          {t('issueBulk.upload.continue')}
        </button>
      </div>
    </div>
  );
}
