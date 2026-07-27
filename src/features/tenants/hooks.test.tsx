import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as tenantsApi from './api';
import { tenantsKeys, useActivateTenant, useCreateTenant, useSuspendTenant } from './hooks';

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const tenant: tenantsApi.TenantView = {
  id: 'tenant-1',
  slug: 'demo-tenant',
  nameI18n: { en: 'Demo Tenant', ar: 'مستأجر تجريبي' },
  type: 'GOVERNMENT',
  deployMode: 'SAAS',
  status: 'ACTIVE',
  createdAt: '2026-07-27T06:00:00Z',
};

describe('tenants hooks invalidation', () => {
  it('useCreateTenant invalidates the tenants list on success', async () => {
    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(tenantsApi, 'createTenant').mockResolvedValue(tenant);

    const { result } = renderHook(() => useCreateTenant(), { wrapper: wrapperFor(queryClient) });
    result.current.mutate({
      slug: 'demo-tenant',
      nameI18n: { en: 'Demo Tenant', ar: 'مستأجر تجريبي' },
      type: 'GOVERNMENT',
      deployMode: 'SAAS',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(tenantsKeys.all);
  });

  it('useSuspendTenant invalidates the tenants list on success', async () => {
    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(tenantsApi, 'suspendTenant').mockResolvedValue({ ...tenant, status: 'SUSPENDED' });

    const { result } = renderHook(() => useSuspendTenant(), { wrapper: wrapperFor(queryClient) });
    result.current.mutate('tenant-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(tenantsKeys.all);
  });

  it('useActivateTenant invalidates the tenants list on success', async () => {
    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(tenantsApi, 'activateTenant').mockResolvedValue(tenant);

    const { result } = renderHook(() => useActivateTenant(), { wrapper: wrapperFor(queryClient) });
    result.current.mutate('tenant-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(tenantsKeys.all);
  });
});
