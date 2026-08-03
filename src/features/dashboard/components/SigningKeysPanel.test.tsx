import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as keyManagementApi from '@/features/keyManagement/api';
import type { SigningKeysResponse } from '@/features/keyManagement/api';
import { SigningKeysPanel } from './SigningKeysPanel';

const adminAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => true,
};

function renderPanel(auth: AuthContextValue = adminAuth) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={auth}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SigningKeysPanel />
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nextProvider>,
  );
}

const oneSigningKey: SigningKeysResponse = {
  keys: [{ kid: 'khatm-default:key-1', state: 'ACTIVE', validFrom: '2026-06-01T00:00:00Z' }],
};

describe('SigningKeysPanel (read-only dashboard glance)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders key lifecycle status with no rotate/retire controls, and links to Key Management', async () => {
    vi.spyOn(keyManagementApi, 'getSigningKeyStatuses').mockResolvedValue(oneSigningKey);
    renderPanel();

    expect(await screen.findByText('khatm-default:key-1')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dashboard.keys.states.active'))).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    const link = screen.getByRole('link', { name: i18n.t('dashboard.keys.manageLink') });
    expect(link).toHaveAttribute('href', '/key-management');
  });

  it('shows no Key Management link (and never fetches) for an operator without key:manage', () => {
    const spy = vi.spyOn(keyManagementApi, 'getSigningKeyStatuses');
    renderPanel({ ...adminAuth, hasScope: () => false });

    expect(
      screen.queryByRole('link', { name: i18n.t('dashboard.keys.manageLink') }),
    ).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
