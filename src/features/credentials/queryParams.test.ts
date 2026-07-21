import { describe, expect, it } from 'vitest';
import { buildSearchParams, type CredentialSearchFilters } from './queryParams';

const BASE: CredentialSearchFilters = {
  ref: '',
  pseudoRef: '',
  schemaId: '',
  revoked: 'any',
  page: 0,
  size: 20,
};

describe('buildSearchParams', () => {
  it('always includes page and size, and omits every unset filter', () => {
    expect(buildSearchParams(BASE).toString()).toBe('page=0&size=20');
  });

  it('trims and includes ref and pseudoRef when set', () => {
    const params = buildSearchParams({ ...BASE, ref: '  CRD-1  ', pseudoRef: 'holder-001' });
    expect(params.get('ref')).toBe('CRD-1');
    expect(params.get('pseudoRef')).toBe('holder-001');
  });

  it('includes schemaId verbatim when set', () => {
    const params = buildSearchParams({ ...BASE, schemaId: 'schema-1' });
    expect(params.get('schemaId')).toBe('schema-1');
  });

  it('omits schemaId when blank', () => {
    const params = buildSearchParams(BASE);
    expect(params.has('schemaId')).toBe(false);
  });

  it('maps the tri-state revoked filter to a boolean query param, or omits it for "any"', () => {
    expect(buildSearchParams({ ...BASE, revoked: 'yes' }).get('revoked')).toBe('true');
    expect(buildSearchParams({ ...BASE, revoked: 'no' }).get('revoked')).toBe('false');
    expect(buildSearchParams({ ...BASE, revoked: 'any' }).has('revoked')).toBe(false);
  });

  it('carries the page and size through', () => {
    const params = buildSearchParams({ ...BASE, page: 3, size: 50 });
    expect(params.get('page')).toBe('3');
    expect(params.get('size')).toBe('50');
  });

  it('omits a blank ref/pseudoRef rather than sending an empty-string filter', () => {
    const params = buildSearchParams({ ...BASE, ref: '   ', pseudoRef: '' });
    expect(params.has('ref')).toBe(false);
    expect(params.has('pseudoRef')).toBe(false);
  });
});
