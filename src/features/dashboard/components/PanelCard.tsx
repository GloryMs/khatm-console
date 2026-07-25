import { type ReactNode } from 'react';
import styles from './PanelCard.module.css';

interface PanelCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned header content — a "view all" link, a count badge, tabs. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Omit body padding — for a full-bleed table that pads its own cells. */
  noBodyPadding?: boolean;
}

/**
 * Shared bordered card shell for every dashboard panel (signing keys,
 * lifecycle chart, recent activity, needs attention, top parties) — one
 * header/body chrome instead of five near-duplicate blocks.
 */
export function PanelCard({
  title,
  subtitle,
  action,
  children,
  className,
  noBodyPadding,
}: PanelCardProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      <div className={styles.head}>
        <div className={styles.heading}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {action}
      </div>
      <div className={noBodyPadding ? styles.bodyFlush : styles.body}>{children}</div>
    </div>
  );
}
