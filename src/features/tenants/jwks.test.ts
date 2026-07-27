import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTenantJwksUrl } from './jwks';

describe('buildTenantJwksUrl', () => {
  afterEach(() => vi.restoreAllMocks());

  it('builds a same-origin, slug-scoped public JWKS URL', () => {
    vi.stubGlobal('location', { origin: 'http://localhost:3000' } as Location);
    expect(buildTenantJwksUrl('demo-tenant')).toBe(
      'http://localhost:3000/t/demo-tenant/.well-known/jwks.json',
    );
  });

  it('URL-encodes the slug', () => {
    vi.stubGlobal('location', { origin: 'http://localhost:3000' } as Location);
    expect(buildTenantJwksUrl('a b')).toBe('http://localhost:3000/t/a%20b/.well-known/jwks.json');
  });
});
