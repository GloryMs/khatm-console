export type RevokedFilter = 'any' | 'yes' | 'no';

export interface FilterFormValues {
  ref: string;
  pseudoRef: string;
  schemaId: string;
  revoked: RevokedFilter;
}

export const BLANK_FILTERS: FilterFormValues = {
  ref: '',
  pseudoRef: '',
  schemaId: '',
  revoked: 'any',
};

export interface CredentialSearchFilters extends FilterFormValues {
  page: number;
  size: number;
}

/** Build the `GET /api/v1/credentials` query string from the filter bar's values. */
export function buildSearchParams(filters: CredentialSearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  const ref = filters.ref.trim();
  const pseudoRef = filters.pseudoRef.trim();
  if (ref) params.set('ref', ref);
  if (pseudoRef) params.set('pseudoRef', pseudoRef);
  if (filters.schemaId) params.set('schemaId', filters.schemaId);
  if (filters.revoked === 'yes') params.set('revoked', 'true');
  if (filters.revoked === 'no') params.set('revoked', 'false');
  params.set('page', String(filters.page));
  params.set('size', String(filters.size));
  return params;
}
