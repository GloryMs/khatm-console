import { useTranslation } from 'react-i18next';
import { ApiError } from './errors';

/**
 * Resolves any thrown error to a localized, user-safe message using the
 * platform's message resolution order: local `errors.<messageKey>` (matches
 * the active UI language) → server-localized `message` → generic fallback.
 * Never surfaces stack traces or raw JSON.
 */
export function useErrorMessage(): (error: unknown) => string {
  const { t, i18n } = useTranslation();

  return (error: unknown): string => {
    if (error instanceof ApiError) {
      if (error.messageKey) {
        const key = `errors.${error.messageKey}`;
        if (i18n.exists(key)) return t(key);
      }
      if (error.message) return error.message;
    }
    return t('errors.generic');
  };
}
