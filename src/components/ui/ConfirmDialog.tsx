import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  titleId: string;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  isBusy?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A simple OK/cancel confirmation modal for consequential-but-not-destructive
 * actions (publish, archive) — unlike {@link RevokeConfirmDialog}, it has no
 * type-to-confirm gate, since these actions don't destroy data.
 */
export function ConfirmDialog({
  titleId,
  title,
  body,
  confirmLabel,
  cancelLabel,
  isBusy,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm} disabled={isBusy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
