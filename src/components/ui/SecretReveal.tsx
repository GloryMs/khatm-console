import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Toast } from './Toast';
import styles from './SecretReveal.module.css';

/** Fixed-width masked placeholder — never leaks the real length precisely. */
function mask(value: string): string {
  const groups = Math.min(6, Math.max(2, Math.ceil(value.length / 4)));
  return Array.from({ length: groups }, () => '••••').join(' ');
}

interface SecretRevealProps {
  /** e.g. "Claim code" / "API key". */
  label: ReactNode;
  value: string;
  /** "Shown once" pill text. */
  onceLabel: ReactNode;
  revealLabel: ReactNode;
  hideLabel: ReactNode;
  /** Caption below the value, e.g. "Stored nowhere in plaintext — shown once." */
  helperText?: ReactNode;
  /** Omit to hide the copy action entirely. */
  copyLabel?: ReactNode;
  onCopy?: (value: string) => void;
  /** Toast text shown briefly after a successful copy. */
  copiedMessage?: ReactNode;
}

/**
 * The one shown-once-secret pattern for claim codes and consuming-party API
 * keys: masked by default, an explicit "shown once" pill, a dashed
 * monospace value box (forced LTR — coded-value treatment), and an optional
 * copy action. The platform never re-serves this value once the page
 * holding it is left — callers must not persist it beyond this render.
 */
export function SecretReveal({
  label,
  value,
  onceLabel,
  revealLabel,
  hideLabel,
  helperText,
  copyLabel,
  onCopy,
  copiedMessage,
}: SecretRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.oncePill}>{onceLabel}</span>
      </div>
      <div className={styles.row}>
        <code className={`${styles.value} ltr-embed`}>{revealed ? value : mask(value)}</code>
        <Button
          type="button"
          variant="secondary"
          className={styles.action}
          onClick={() => setRevealed((r) => !r)}
        >
          {revealed ? hideLabel : revealLabel}
        </Button>
        {onCopy && copyLabel && (
          <Button
            type="button"
            variant="primary"
            className={styles.action}
            onClick={() => {
              onCopy(value);
              setCopied(true);
            }}
          >
            {copyLabel}
          </Button>
        )}
      </div>
      {helperText && <span className={styles.helper}>{helperText}</span>}
      {copied && copiedMessage && <Toast tone="success">{copiedMessage}</Toast>}
    </div>
  );
}
