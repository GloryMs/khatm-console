import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as tenantsApi from './api';
import { TenantDetailPage } from './TenantDetailPage';
import { TenantsPage } from './TenantsPage';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

const adminAuth: AuthContextValue = {
  ...baseAuth,
  hasScope: (scope) => scope === 'platform:admin',
};

const tenants: tenantsApi.TenantView[] = [
  {
    id: 'tenant-1',
    slug: 'demo-tenant',
    nameI18n: { en: 'Demo Tenant', ar: 'مستأجر تجريبي' },
    type: 'GOVERNMENT',
    deployMode: 'SAAS',
    status: 'ACTIVE',
    createdAt: '2026-07-27T06:00:00Z',
  },
];

function renderPage(auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={['/tenants']}>
            <Routes>
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/tenants/:id" element={<TenantDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('TenantsPage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the platform:admin scope', () => {
    renderPage(baseAuth);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });

  it('renders the tenant list with the platform:admin scope', async () => {
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue(tenants);
    renderPage(adminAuth);
    expect(await screen.findByText('Demo Tenant')).toBeInTheDocument();
  });
});

describe('TenantsPage create dialog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('blocks submit and shows slug-format and both-language validation errors', async () => {
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([]);
    const create = vi.spyOn(tenantsApi, 'createTenant');
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('tenants.createCta') }));
    await user.type(screen.getByLabelText(i18n.t('tenants.create.slug')), 'Bad Slug!');
    await user.click(screen.getByRole('button', { name: i18n.t('tenants.create.submit') }));

    expect(await screen.findByText(i18n.t('tenants.create.slugInvalid'))).toBeInTheDocument();
    expect(screen.getAllByText(i18n.t('tenants.create.nameRequired')).length).toBeGreaterThan(0);
    expect(screen.getByText(i18n.t('tenants.create.typeRequired'))).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('submits with a valid slug, both-language names, type, and default SAAS deploy mode', async () => {
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([]);
    const create = vi.spyOn(tenantsApi, 'createTenant').mockResolvedValue({
      id: 'tenant-2',
      slug: 'new-tenant',
      nameI18n: { en: 'New Tenant', ar: 'مستأجر جديد' },
      type: 'PRIVATE',
      deployMode: 'SAAS',
      status: 'ACTIVE',
      createdAt: '2026-07-27T06:00:00Z',
    });
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue({
      id: 'tenant-2',
      slug: 'new-tenant',
      nameI18n: { en: 'New Tenant', ar: 'مستأجر جديد' },
      type: 'PRIVATE',
      deployMode: 'SAAS',
      status: 'ACTIVE',
      createdAt: '2026-07-27T06:00:00Z',
    });
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('tenants.createCta') }));
    await user.type(screen.getByLabelText(i18n.t('tenants.create.slug')), 'new-tenant');
    await user.type(screen.getByLabelText(i18n.t('tenants.create.nameEn')), 'New Tenant');
    await user.type(screen.getByLabelText(i18n.t('tenants.create.nameAr')), 'مستأجر جديد');
    await user.selectOptions(screen.getByLabelText(i18n.t('tenants.create.type')), 'PRIVATE');
    await user.click(screen.getByRole('button', { name: i18n.t('tenants.create.submit') }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        slug: 'new-tenant',
        nameI18n: { en: 'New Tenant', ar: 'مستأجر جديد' },
        type: 'PRIVATE',
        deployMode: 'SAAS',
      }),
    );

    // On success, navigates to the new tenant's detail view.
    expect(await screen.findByRole('heading', { name: 'New Tenant' })).toBeInTheDocument();
    expect(screen.getByText(i18n.t('tenants.detail.jwksTitle'))).toBeInTheDocument();
  });

  it('maps KH-TNT-0409 onto the slug field inline, not just the generic banner', async () => {
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([]);
    const { ApiError } = await import('@/api/errors');
    const create = vi
      .spyOn(tenantsApi, 'createTenant')
      .mockRejectedValue(
        new ApiError(409, { code: 'KH-TNT-0409', messageKey: 'tenant.duplicate-slug' }),
      );
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('tenants.createCta') }));
    await user.type(screen.getByLabelText(i18n.t('tenants.create.slug')), 'demo-tenant');
    await user.type(screen.getByLabelText(i18n.t('tenants.create.nameEn')), 'Demo');
    await user.type(screen.getByLabelText(i18n.t('tenants.create.nameAr')), 'تجربة');
    await user.selectOptions(screen.getByLabelText(i18n.t('tenants.create.type')), 'PRIVATE');
    await user.click(screen.getByRole('button', { name: i18n.t('tenants.create.submit') }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    // Shown both inline on the slug field and in the generic error banner
    // (mirrors LoginForm's dual-display idiom for field-mapped ApiErrors).
    const occurrences = await screen.findAllByText(i18n.t('errors.tenant.duplicate-slug'));
    expect(occurrences.length).toBeGreaterThanOrEqual(2);
  });

  it('sends an initialAdmin when checked, and shows the one-time password before navigating', async () => {
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([]);
    const create = vi.spyOn(tenantsApi, 'createTenant').mockResolvedValue({
      id: 'tenant-3',
      slug: 'with-admin',
      nameI18n: { en: 'With Admin', ar: 'بمدير' },
      type: 'PRIVATE',
      deployMode: 'SAAS',
      status: 'ACTIVE',
      createdAt: '2026-07-28T06:00:00Z',
      initialAdmin: { username: 'firstadmin', temporaryPassword: 'temp-initial-pass' },
    });
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue({
      id: 'tenant-3',
      slug: 'with-admin',
      nameI18n: { en: 'With Admin', ar: 'بمدير' },
      type: 'PRIVATE',
      deployMode: 'SAAS',
      status: 'ACTIVE',
      createdAt: '2026-07-28T06:00:00Z',
    });
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('tenants.createCta') }));
    await user.type(screen.getByLabelText(i18n.t('tenants.create.slug')), 'with-admin');
    await user.type(screen.getByLabelText(i18n.t('tenants.create.nameEn')), 'With Admin');
    await user.type(screen.getByLabelText(i18n.t('tenants.create.nameAr')), 'بمدير');
    await user.selectOptions(screen.getByLabelText(i18n.t('tenants.create.type')), 'PRIVATE');
    await user.click(screen.getByLabelText(i18n.t('tenants.create.addInitialAdmin')));
    await user.type(
      screen.getByLabelText(i18n.t('tenants.create.initialAdminUsername')),
      'firstadmin',
    );
    await user.type(
      screen.getByLabelText(i18n.t('tenants.create.initialAdminNameEn')),
      'First Admin',
    );
    await user.type(screen.getByLabelText(i18n.t('tenants.create.initialAdminNameAr')), 'أول مدير');
    await user.click(screen.getByRole('button', { name: i18n.t('tenants.create.submit') }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'with-admin',
          initialAdmin: {
            username: 'firstadmin',
            displayNameI18n: { en: 'First Admin', ar: 'أول مدير' },
          },
        }),
      ),
    );

    // The one-time password is shown before navigating away.
    await user.click(await screen.findByRole('button', { name: i18n.t('common.reveal') }));
    expect(await screen.findByText('temp-initial-pass')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'With Admin' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: i18n.t('common.done') }));
    expect(await screen.findByRole('heading', { name: 'With Admin' })).toBeInTheDocument();
  });
});
