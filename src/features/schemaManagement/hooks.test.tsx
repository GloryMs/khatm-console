import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { issuanceKeys } from '@/features/issuance/hooks';
import { schemasKeys } from '@/features/schemas/hooks';
import * as schemasApi from '@/features/schemas/api';
import { schemaManagementKeys, usePublishSchema } from './hooks';

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe('usePublishSchema', () => {
  it('invalidates the management list, the read-only catalog, and the Issue picker query on success', async () => {
    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(schemasApi, 'publishSchema').mockResolvedValue({
      id: 'schema-1',
      code: 'X/v1',
      version: 1,
      status: 'PUBLISHED',
      nameI18n: { en: 'X', ar: 'خ' },
    });

    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => usePublishSchema(), { wrapper });
    result.current.mutate('schema-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(schemaManagementKeys.all);
    expect(invalidatedKeys).toContainEqual(schemasKeys.list());
    expect(invalidatedKeys).toContainEqual(issuanceKeys.schemas());
  });
});
