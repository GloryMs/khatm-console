import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as revokeApi from './api';
import { RevokePage } from './RevokePage';

const adminAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: (scope) => scope === 'revoke',
};

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={adminAuth}>
          <MemoryRouter initialEntries={[path]}>
            <RevokePage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('RevokePage deep-link preload', () => {
  afterEach(() => vi.restoreAllMocks());

  it('preloads the lookup input and the summary from a ?id= query param', async () => {
    vi.spyOn(revokeApi, 'getCredential').mockResolvedValue({
      id: 'cred-1',
      ref: 'CRD-2026-0001',
      schemaCode: 'CriminalRecord/v1',
      revoked: false,
      usesRemaining: 3,
      maxUses: 3,
      status: 'ACTIVE',
      usesConsumed: 0,
    });

    renderAt('/revoke?id=cred-1');

    expect(screen.getByLabelText(i18n.t('revoke.lookupLabel'))).toHaveValue('cred-1');
    expect(await screen.findByTestId('credential-summary')).toBeInTheDocument();
    expect(screen.getByText('CRD-2026-0001')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('revoke.statusActive'))).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('starts blank when no id param is present', () => {
    renderAt('/revoke');
    expect(screen.getByLabelText(i18n.t('revoke.lookupLabel'))).toHaveValue('');
    expect(screen.queryByTestId('credential-summary')).not.toBeInTheDocument();
  });
});
