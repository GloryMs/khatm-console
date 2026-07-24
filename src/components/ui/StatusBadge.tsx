import { type ReactNode } from 'react';
import styles from './StatusBadge.module.css';

/**
 * Shared status pill: a tinted background, a small dot, and a label.
 * One shape for every status across the console (credential lifecycle,
 * schema state, consuming-party state, consume result, validation outcome).
 * The tone → color mapping lives here, not duplicated per feature.
 */
export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  );
}
