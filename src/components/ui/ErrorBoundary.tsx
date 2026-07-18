import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import styles from './ErrorBoundary.module.css';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * React error boundaries require a class component and componentDidCatch —
 * there is no hook equivalent in React 18. This is the one deliberate
 * exception to the "function components + hooks only, no HOCs" rule: a class
 * is unavoidable here, and `withTranslation` (rather than `useTranslation`)
 * is the only way to localize its fallback UI.
 */
class ErrorBoundaryBase extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(error, info);
    }
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div className={styles.boundary} role="alert">
          <p>{t('errors.boundary.title')}</p>
          <button type="button" onClick={() => window.location.reload()}>
            {t('errors.boundary.reload')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);
