import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCredentials } from './api';
import type { CredentialSearchFilters } from './queryParams';

export const credentialSearchKeys = {
  all: ['credentialSearch'] as const,
  list: (filters: CredentialSearchFilters) => [...credentialSearchKeys.all, filters] as const,
};

/** Search credentials with the current filter bar values; keeps the prior page's rows visible while the next page loads. */
export function useCredentialSearch(filters: CredentialSearchFilters) {
  return useQuery({
    queryKey: credentialSearchKeys.list(filters),
    queryFn: () => searchCredentials(filters),
    placeholderData: keepPreviousData,
  });
}
