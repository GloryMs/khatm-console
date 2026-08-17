import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { khatmInputClass } from './FormField';
import styles from './TypeToConfirmDialog.module.css';

interface TypeToConfirmDialogProps {
  titleId: string;
  title: string;
  body: string;
  /** The exact text the operator must retype to arm the confirm button. */
  expectedText: string;
  typePromptLabel: string;
  mismatchLabel: string;
  confirmLabel: string;
  busyLabel: string;
  cancelLabel: string;
  isBusy: boolean;
  /** A localized message to surface when the guarded call failed. */
  errorMessage?: string;
  /** Extra content rendered between `body` and the type-to-confirm prompt (e.g. C10's provider choice). */
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shared type-to-confirm modal for irreversible actions — generalizes the
 * pattern first established by `RevokeConfirmDialog` (credential revocation)
 * so a second caller (signing-key rotation) doesn't reinvent it. New
 * irreversible-action call-sites should reach for this rather than adding
 * another bespoke typed-confirm dialog.
 */
export function TypeToConfirmDialog({
  titleId,
  title,
  body,
  expectedText,
  typePromptLabel,
  mismatchLabel,
  confirmLabel,
  busyLabel,
  cancelLabel,
  isBusy,
  errorMessage,
  children,
  onConfirm,
  onCancel,
}: TypeToConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the type-to-confirm input on open, reset it if the dialog is reused.
  useEffect(() => {
    setTyped('');
    inputRef.current?.focus();
  }, [expectedText]);

  const matches = typed.trim() === expectedText;

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
        {children}
        <div className={styles.prompt}>
          <label htmlFor={`${titleId}-typed`}>{typePromptLabel}</label>
          <span className={`${styles.expected} ltr-embed`}>{expectedText}</span>
          <input
            id={`${titleId}-typed`}
            ref={inputRef}
            type="text"
            autoComplete="off"
            className={`${khatmInputClass(typed.trim().length > 0 && !matches ? 'error' : 'default')} ltr-embed`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          {typed.trim().length > 0 && !matches && (
            <span className={styles.mismatch}>{mismatchLabel}</span>
          )}
        </div>
        {errorMessage && <p className={styles.mismatch}>{errorMessage}</p>}
        <div className={styles.actions}>
          <Button variant="secondary" type="button" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </Button>
          <Button variant="danger" type="button" onClick={onConfirm} disabled={!matches || isBusy}>
            {isBusy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
