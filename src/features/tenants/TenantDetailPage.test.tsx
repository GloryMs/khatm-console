import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as tenantsApi from './api';
import { TenantDetailPage } from './TenantDetailPage';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  logout: async () => undefined,
  hasScope: () => false,
};

const adminAuth: AuthContextValue = { ...baseAuth, hasScope: (scope) => scope === 'admin' };

const activeTenant: tenantsApi.TenantView = {
  id: 'tenant-1',
  slug: 'demo-tenant',
  nameI18n: { en: 'Demo Tenant', ar: 'مستأجر تجريبي' },
  type: 'GOVERNMENT',
  deployMode: 'SAAS',
  status: 'ACTIVE',
  createdAt: '2026-07-27T06:00:00Z',
};

function renderPage(auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={['/tenants/tenant-1']}>
            <Routes>
              <Route path="/tenants/:id" element={<TenantDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('TenantDetailPage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the admin scope', () => {
    renderPage(baseAuth);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });
});

describe('TenantDetailPage fields and JWKS link', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders full tenant fields and a same-origin, slug-scoped JWKS link', async () => {
    vi.stubGlobal('location', { origin: 'http://localhost:3000' } as Location);
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue(activeTenant);
    renderPage(adminAuth);

    expect(await screen.findByRole('heading', { name: 'Demo Tenant' })).toBeInTheDocument();
    expect(screen.getByText('demo-tenant')).toBeInTheDocument();
    expect(screen.getByText('مستأجر تجريبي')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('tenants.type.GOVERNMENT'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('tenants.deployMode.SAAS'))).toBeInTheDocument();

    const jwksLink = screen.getByRole('link', {
      name: 'http://localhost:3000/t/demo-tenant/.well-known/jwks.json',
    });
    expect(jwksLink).toHaveAttribute(
      'href',
      'http://localhost:3000/t/demo-tenant/.well-known/jwks.json',
    );
  });
});

describe('TenantDetailPage suspend / activate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('suspends only after the confirm dialog is accepted, with non-alarmist copy', async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue(activeTenant);
    const suspend = vi.spyOn(tenantsApi, 'suspendTenant').mockResolvedValue({
      ...activeTenant,
      status: 'SUSPENDED',
    });
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('tenants.detail.actionSuspend') }),
    );
    expect(suspend).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(i18n.t('tenants.suspendConfirm.body'));

    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('tenants.suspendConfirm.confirm') }),
    );
    await waitFor(() => expect(suspend).toHaveBeenCalledWith('tenant-1'));
  });

  it('activates a suspended tenant after confirm', async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue({ ...activeTenant, status: 'SUSPENDED' });
    const activate = vi.spyOn(tenantsApi, 'activateTenant').mockResolvedValue(activeTenant);
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('tenants.detail.actionActivate') }),
    );
    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('tenants.activateConfirm.confirm') }),
    );
    await waitFor(() => expect(activate).toHaveBeenCalledWith('tenant-1'));
  });
});
