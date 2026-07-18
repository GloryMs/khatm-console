import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/errors';
import { useErrorMessage } from '@/api/useErrorMessage';
import styles from './ApiErrorBanner.module.css';

/**
 * Renders a resolved API error inline: localized message plus `code` +
 * `traceId` for support correlation (work rule 3). Never shows raw JSON or
 * stack traces.
 */
export function ApiErrorBanner({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const resolveMessage = useErrorMessage();

  if (!error) return null;

  const code = error instanceof ApiError ? error.code : undefined;
  const traceId = error instanceof ApiError ? error.traceId : undefined;

  return (
    <div className={styles.banner} role="alert">
      <p>{resolveMessage(error)}</p>
      {(code ?? traceId) && (
        <p className={`${styles.meta} ltr-embed`}>
          {code && (
            <span>
              {t('errors.code')}: {code}
            </span>
          )}
          {traceId && (
            <span>
              {t('errors.traceId')}: {traceId}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
