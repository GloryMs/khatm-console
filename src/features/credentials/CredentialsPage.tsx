import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useSchemas } from '@/features/schemas/hooks';
import { FilterBar } from './components/FilterBar';
import { ResultsTable } from './components/ResultsTable';
import { useCredentialSearch } from './hooks';
import { BLANK_FILTERS, type CredentialSearchFilters, type FilterFormValues } from './queryParams';
import styles from './CredentialsPage.module.css';

const PAGE_SIZE = 20;

function toSearchFilters(values: FilterFormValues, page: number): CredentialSearchFilters {
  return { ...values, page, size: PAGE_SIZE };
}

export function CredentialsPage() {
  const { t } = useTranslation();
  const schemas = useSchemas();
  const [filters, setFilters] = useState<FilterFormValues>(BLANK_FILTERS);
  const [page, setPage] = useState(0);

  const search = useCredentialSearch(toSearchFilters(filters, page));

  const onSearch = (values: FilterFormValues) => {
    setFilters(values);
    setPage(0);
  };

  const totalPages = search.data?.totalPages ?? 0;

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('credentials.title')}</h1>
      <FilterBar schemas={schemas.data ?? []} onSearch={onSearch} />

      {search.isPending && <p>{t('common.loading')}</p>}
      {search.isError && <ApiErrorBanner error={search.error} />}
      {search.data && (
        <>
          <ResultsTable rows={search.data.items ?? []} />
          <div className={styles.pagination}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0}
            >
              {t('credentials.pagination.prev')}
            </button>
            <span>
              {t('credentials.pagination.pageInfo', {
                page: page + 1,
                totalPages: Math.max(totalPages, 1),
              })}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= totalPages}
            >
              {t('credentials.pagination.next')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
