import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { hashFile, isHashingAvailable } from '@/features/attestation/hashFile';
import styles from './ScanStep.module.css';

/** Progress is only worth showing for files large enough that hashing takes visible time. */
const PROGRESS_THRESHOLD_BYTES = 2 * 1024 * 1024; // 2 MiB

export interface ScannedFileMeta {
  name: string;
  size: number;
}

interface ScanStepProps {
  onHashed: (digestHex: string, file: ScannedFileMeta) => void;
  onBack: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Step: pick a scanned file and hash it entirely client-side (spec FS-2.4
 * D1). The `File` object never leaves this component's local scope — once
 * `hashFile` resolves, only the digest string and the file's own name/size
 * are handed up to the wizard; the file reference itself is dropped
 * immediately (session veto V2), so re-hashing means re-picking the file.
 */
export function ScanStep({ onHashed, onBack }: ScanStepProps) {
  const { t } = useTranslation();
  const [fileMeta, setFileMeta] = useState<ScannedFileMeta | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [hashing, setHashing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isHashingAvailable()) {
    return (
      <div className={styles.step}>
        <Banner tone="danger">{t('issueAttested.scan.insecureContext')}</Banner>
        <Button variant="secondary" type="button" onClick={onBack}>
          {t('issue.changeSchema')}
        </Button>
      </div>
    );
  }

  const handleFile = async (file: File) => {
    setError(null);
    setFileMeta({ name: file.name, size: file.size });
    setProgress({ loaded: 0, total: file.size });
    setHashing(true);
    try {
      const digest = await hashFile(file, {
        onProgress: (loaded, total) => setProgress({ loaded, total }),
      });
      onHashed(digest, { name: file.name, size: file.size });
    } catch {
      setError(t('issueAttested.scan.hashFailed'));
      setFileMeta(null);
      setProgress(null);
    } finally {
      setHashing(false);
    }
  };

  const showProgress = hashing && progress !== null && progress.total > PROGRESS_THRESHOLD_BYTES;

  return (
    <div className={styles.step}>
      <p className={styles.help}>{t('issueAttested.scan.prompt')}</p>
      <Banner tone="info">{t('issueAttested.scan.neverUploaded')}</Banner>

      <label className={styles.dropzone} htmlFor="attested-scan-file">
        <span className={styles.dropzoneLabel}>{t('issueAttested.scan.pickFile')}</span>
        <input
          id="attested-scan-file"
          type="file"
          className={styles.fileInput}
          disabled={hashing}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void handleFile(file);
          }}
        />
      </label>

      {fileMeta && (
        <p className={styles.fileInfo}>
          {fileMeta.name} · {formatSize(fileMeta.size)}
        </p>
      )}

      {hashing && (
        <div className={styles.progressRow} role="status">
          <span>{t('issueAttested.scan.hashing')}</span>
          {showProgress && progress && (
            <progress
              className={styles.progress}
              value={progress.loaded}
              max={Math.max(progress.total, 1)}
            />
          )}
        </div>
      )}

      {error && <Banner tone="danger">{error}</Banner>}

      <Button variant="secondary" type="button" onClick={onBack} disabled={hashing}>
        {t('issue.changeSchema')}
      </Button>
    </div>
  );
}
