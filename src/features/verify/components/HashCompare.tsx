import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { hashFile, isHashingAvailable } from '@/features/attestation/hashFile';
import styles from './HashCompare.module.css';

interface HashCompareProps {
  /** The disclosed claim's own hex-digest value, e.g. `doc_sha256`. */
  expectedDigest: string;
}

type CompareState =
  | { status: 'idle' }
  | { status: 'hashing' }
  | { status: 'match'; digest: string }
  | { status: 'mismatch'; digest: string }
  | { status: 'error' };

/**
 * Session veto V1: a verifier who holds their own copy of the scanned
 * document can hash it locally (same `hashFile` module the issuer wizard
 * uses) and compare it against a disclosed hex-digest claim, entirely
 * client-side — no upload, same D1 guarantee. This only ever compares
 * against whatever the presentation already disclosed; it cannot verify
 * anything for a withheld claim.
 */
export function HashCompare({ expectedDigest }: HashCompareProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CompareState>({ status: 'idle' });

  if (!open) {
    return (
      <Button variant="ghost" type="button" onClick={() => setOpen(true)}>
        {t('verify.hashCompare.cta')}
      </Button>
    );
  }

  const handleFile = async (file: File) => {
    setState({ status: 'hashing' });
    try {
      const digest = await hashFile(file);
      setState(
        digest === expectedDigest.toLowerCase()
          ? { status: 'match', digest }
          : { status: 'mismatch', digest },
      );
    } catch {
      setState({ status: 'error' });
    }
  };

  if (!isHashingAvailable()) {
    return <Banner tone="danger">{t('issueAttested.scan.insecureContext')}</Banner>;
  }

  return (
    <div className={styles.compare}>
      <p className={styles.help}>{t('verify.hashCompare.prompt')}</p>
      <label className={styles.pick}>
        {t('verify.hashCompare.pickFile')}
        <input
          type="file"
          className={styles.fileInput}
          disabled={state.status === 'hashing'}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void handleFile(file);
          }}
        />
      </label>

      {state.status === 'hashing' && <span role="status">{t('issueAttested.scan.hashing')}</span>}
      {state.status === 'match' && (
        <StatusBadge tone="success">{t('verify.hashCompare.match')}</StatusBadge>
      )}
      {state.status === 'mismatch' && (
        <StatusBadge tone="danger">{t('verify.hashCompare.mismatch')}</StatusBadge>
      )}
      {state.status === 'error' && (
        <Banner tone="danger">{t('issueAttested.scan.hashFailed')}</Banner>
      )}
    </div>
  );
}
