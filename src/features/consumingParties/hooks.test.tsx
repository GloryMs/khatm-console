import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as consumingPartiesApi from './api';
import { consumingPartiesKeys, useCreateConsumingParty, useSuspendConsumingParty } from './hooks';

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

describe('consumingParties hooks invalidation', () => {
  it('useCreateConsumingParty invalidates the parties list on success', async () => {
    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(consumingPartiesApi, 'createConsumingParty').mockResolvedValue({
      id: 'party-1',
      code: 'demo-party',
      status: 'ACTIVE',
      nameI18n: { en: 'Demo', ar: 'تجربة' },
      allowedSchemas: [],
    });

    const { result } = renderHook(() => useCreateConsumingParty(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate({ code: 'demo-party', nameI18n: { en: 'Demo', ar: 'تجربة' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(consumingPartiesKeys.all);
  });

  it('useSuspendConsumingParty invalidates the parties list on success', async () => {
    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(consumingPartiesApi, 'suspendConsumingParty').mockResolvedValue({
      id: 'party-1',
      code: 'demo-party',
      status: 'SUSPENDED',
      nameI18n: { en: 'Demo', ar: 'تجربة' },
      allowedSchemas: [],
    });

    const { result } = renderHook(() => useSuspendConsumingParty(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate('party-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(consumingPartiesKeys.all);
  });
});
