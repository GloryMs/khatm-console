import { type ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}

/**
 * Shared empty state: dashed card, seal-mark glyph, title, optional body and
 * secondary action. One shape for "nothing here yet" across the console —
 * no results, no schemas to pick, nothing minted yet.
 */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className={styles.card}>
      <span className={styles.seal} aria-hidden="true">
        <span className={styles.sealRing} />
      </span>
      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
      {action}
    </div>
  );
}
