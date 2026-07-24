import { type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

/**
 * Shared button with the four design-system variants. Use this everywhere
 * instead of per-feature `.submit` / `.cancel` / `.confirm` blocks so button
 * styling lives in one place. Pass `variant` (default `primary`); all native
 * `<button>` props (`disabled`, `onClick`, `type`, …) pass through.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  const classes = [styles.button, VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
  return <button type={type} className={classes} {...rest} />;
}
