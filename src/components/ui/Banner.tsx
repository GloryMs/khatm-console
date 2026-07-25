import { type ReactNode } from 'react';
import styles from './Banner.module.css';

export type BannerTone = 'danger' | 'warning' | 'info' | 'success';

const ICON: Record<BannerTone, string> = {
  danger: '!',
  warning: '!',
  info: 'i',
  success: '✓',
};

interface BannerProps {
  tone?: BannerTone;
  children: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: ReactNode;
}

/**
 * Shared inline alert banner: a tinted box, a circular tone icon, and an
 * optional dismiss action. One shape for every banner in the console —
 * {@link ApiErrorBanner} wraps this for the app's single API-error surface
 * (work rule 3); feature code reaches for `Banner` directly for anything
 * that isn't an API error (e.g. a non-blocking hint).
 */
export function Banner({ tone = 'danger', children, onDismiss, dismissLabel }: BannerProps) {
  return (
    <div className={`${styles.banner} ${styles[tone]}`} role="alert">
      <span className={styles.icon} aria-hidden="true">
        {ICON[tone]}
      </span>
      <div className={styles.message}>{children}</div>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          {dismissLabel}
        </button>
      )}
    </div>
  );
}
