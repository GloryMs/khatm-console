import { type ReactNode } from 'react';
import styles from './Toast.module.css';

export type ToastTone = 'success' | 'danger' | 'info';

const ICON: Record<ToastTone, string> = {
  success: '✓',
  danger: '!',
  info: 'i',
};

interface ToastProps {
  tone?: ToastTone;
  children: ReactNode;
}

/**
 * Floating, self-positioned confirmation (bottom-inline-start of the
 * viewport, mirrors correctly in RTL via logical insets). For a brief,
 * non-blocking confirmation (e.g. "Copied") — not for errors, which always
 * go through {@link ApiErrorBanner} instead (work rule 3).
 */
export function Toast({ tone = 'success', children }: ToastProps) {
  return (
    <div className={styles.toast} role="status">
      <span className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">
        {ICON[tone]}
      </span>
      <span className={styles.message}>{children}</span>
    </div>
  );
}
