import { type ReactNode } from 'react';
import styles from './FormField.module.css';

export type FieldState = 'default' | 'error' | 'valid';

/**
 * Builds the class list for a native `<input>`/`<select>`/`<textarea>` so it
 * picks up the design guide's default/error/valid look (the global
 * `.khatm-input` family in `src/styles/global.css`; focus is handled there
 * too, via `:focus-visible`/`:focus`). Pass the same state you give
 * {@link FormField} so the control and its label/caption agree.
 */
export function khatmInputClass(state: FieldState = 'default', extra?: string): string {
  const classes = ['khatm-input'];
  if (state === 'error') classes.push('khatm-input--error');
  if (state === 'valid') classes.push('khatm-input--valid');
  if (extra) classes.push(extra);
  return classes.join(' ');
}

interface FormFieldProps {
  label: ReactNode;
  htmlFor: string;
  /** Shown when there's no error/valid message — a plain hint. */
  help?: ReactNode;
  /** Error caption; also drives the danger label/border state. */
  error?: ReactNode;
  /** Success caption (rendered with a leading ✓); also drives the success state. */
  valid?: ReactNode;
  /** e.g. a selective-disclosure or required pill, placed next to the label. */
  badge?: ReactNode;
  /** The input/select/textarea itself — give it `khatmInputClass(state)`. */
  children: ReactNode;
}

/**
 * Shared form-field shell: label + optional badge, the control, and a
 * help/error/valid caption below — the one shape every form in the console
 * uses (work rule 4). Does not render the control itself so callers keep
 * full control over `register()`/`onChange` wiring; see {@link khatmInputClass}
 * for matching the control's visual state to this shell's.
 */
export function FormField({ label, htmlFor, help, error, valid, badge, children }: FormFieldProps) {
  const state: FieldState = error ? 'error' : valid ? 'valid' : 'default';
  return (
    <div className={styles.field} data-state={state}>
      <div className={styles.head}>
        <label htmlFor={htmlFor} className={styles.label}>
          {label}
        </label>
        {badge}
      </div>
      {children}
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : valid ? (
        <span className={styles.valid}>{valid}</span>
      ) : help ? (
        <span className={styles.help}>{help}</span>
      ) : null}
    </div>
  );
}
