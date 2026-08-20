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
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

const adminAuth: AuthContextValue = {
  ...baseAuth,
  hasScope: (scope) => scope === 'platform:admin',
};

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

  it('renders no-permission without the platform:admin scope', () => {
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

const candidateParent: tenantsApi.TenantView = {
  id: 'tenant-3',
  slug: 'candidate-parent',
  nameI18n: { en: 'Candidate Parent', ar: 'أب مرشح' },
  type: 'GOVERNMENT',
  deployMode: 'SAAS',
  status: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00Z',
};

const childTenant: tenantsApi.TenantView = {
  id: 'tenant-2',
  slug: 'demo-child',
  nameI18n: { en: 'Demo Child', ar: 'ابن تجريبي' },
  type: 'GOVERNMENT',
  deployMode: 'SAAS',
  status: 'ACTIVE',
  createdAt: '2026-08-05T00:00:00Z',
  parentSlug: 'demo-tenant',
};

describe('TenantDetailPage hierarchy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows a root note and lists children derived from the full tenant list', async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue(activeTenant);
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([activeTenant, childTenant]);
    renderPage(adminAuth);

    expect(await screen.findByText(i18n.t('tenants.detail.noParent'))).toBeInTheDocument();
    expect(await screen.findByText('Demo Child')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: i18n.t('tenants.detail.actionSetParent') }),
    ).toBeInTheDocument();
  });

  it('shows the parent badge and "change parent" wording for a tenant that already has a parent', async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue({
      ...activeTenant,
      parentSlug: 'candidate-parent',
      parentNameI18n: { en: 'Candidate Parent', ar: 'أب مرشح' },
    });
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([activeTenant, candidateParent]);
    renderPage(adminAuth);

    expect(
      await screen.findByText(i18n.t('tenants.detail.parentLabel', { parent: 'Candidate Parent' })),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: i18n.t('tenants.detail.actionChangeParent') }),
    ).toBeInTheDocument();
  });

  it('sets a parent via the dialog', async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue(activeTenant);
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([activeTenant, candidateParent]);
    const setParent = vi.spyOn(tenantsApi, 'setParentTenant').mockResolvedValue({
      ...activeTenant,
      parentSlug: 'candidate-parent',
    });
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('tenants.detail.actionSetParent') }),
    );
    await user.selectOptions(
      screen.getByLabelText(i18n.t('tenants.setParent.parentSlug')),
      'candidate-parent',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('tenants.setParent.submit') }));

    await waitFor(() => expect(setParent).toHaveBeenCalledWith('tenant-1', 'candidate-parent'));
  });

  it('clears a parent by submitting the blank option', async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue({
      ...activeTenant,
      parentSlug: 'candidate-parent',
    });
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([activeTenant, candidateParent]);
    const setParent = vi.spyOn(tenantsApi, 'setParentTenant').mockResolvedValue(activeTenant);
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('tenants.detail.actionChangeParent') }),
    );
    await user.selectOptions(screen.getByLabelText(i18n.t('tenants.setParent.parentSlug')), '');
    await user.click(screen.getByRole('button', { name: i18n.t('tenants.setParent.submit') }));

    await waitFor(() => expect(setParent).toHaveBeenCalledWith('tenant-1', undefined));
  });

  it('shows the localized error inline when the server rejects the parent choice (e.g. a cycle)', async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue(activeTenant);
    vi.spyOn(tenantsApi, 'listTenants').mockResolvedValue([activeTenant, candidateParent]);
    const { ApiError } = await import('@/api/errors');
    vi.spyOn(tenantsApi, 'setParentTenant').mockRejectedValue(
      new ApiError(422, { code: 'KH-TNT-1422', messageKey: 'tenant.parent-cycle' }),
    );
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('tenants.detail.actionSetParent') }),
    );
    await user.selectOptions(
      screen.getByLabelText(i18n.t('tenants.setParent.parentSlug')),
      'candidate-parent',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('tenants.setParent.submit') }));

    expect(await screen.findByText(i18n.t('errors.tenant.parent-cycle'))).toBeInTheDocument();
  });
});

const onBehalfOfUser: tenantsApi.UserSummary = {
  id: 'obo-user-1',
  username: 'tenantadmin',
  displayNameI18n: { en: 'Tenant Admin', ar: 'مدير المستأجر' },
  roles: ['TENANT_ADMIN'],
  status: 'ACTIVE',
  createdAt: '2026-07-29T06:00:00Z',
};

describe('TenantDetailPage on-behalf-of Users tab', () => {
  afterEach(() => vi.restoreAllMocks());

  it("switches to the Users tab and lists the tenant's users, with only the Reset 2FA row action", async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue(activeTenant);
    const listUsersInTenant = vi
      .spyOn(tenantsApi, 'listUsersInTenant')
      .mockResolvedValue([onBehalfOfUser]);
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(await screen.findByRole('tab', { name: i18n.t('tenants.detail.tabUsers') }));

    expect(
      screen.getByText(i18n.t('tenants.detail.onBehalfOfNotice', { tenant: 'Demo Tenant' })),
    ).toBeInTheDocument();
    expect(await screen.findByText('tenantadmin')).toBeInTheDocument();
    expect(screen.getByText('Tenant Admin')).toBeInTheDocument();
    expect(listUsersInTenant).toHaveBeenCalledWith('tenant-1');
    expect(
      screen.getByRole('columnheader', { name: i18n.t('users.columnActions') }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: i18n.t('users.actionEditRoles') }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: i18n.t('users.actionResetTotp') }),
    ).toBeInTheDocument();
  });

  it("resets a user's 2FA on behalf of the tenant after confirm", async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue(activeTenant);
    vi.spyOn(tenantsApi, 'listUsersInTenant').mockResolvedValue([onBehalfOfUser]);
    const resetTotpInTenant = vi
      .spyOn(tenantsApi, 'resetTotpInTenant')
      .mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(await screen.findByRole('tab', { name: i18n.t('tenants.detail.tabUsers') }));
    await user.click(await screen.findByRole('button', { name: i18n.t('users.actionResetTotp') }));

    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('users.resetTotpConfirm.confirm') }),
    );
    await waitFor(() => expect(resetTotpInTenant).toHaveBeenCalledWith('tenant-1', 'obo-user-1'));
  });

  it('adds a user to the tenant on behalf of it and shows the one-time temporary password', async () => {
    vi.spyOn(tenantsApi, 'getTenant').mockResolvedValue(activeTenant);
    vi.spyOn(tenantsApi, 'listUsersInTenant').mockResolvedValue([]);
    const createUserInTenant = vi.spyOn(tenantsApi, 'createUserInTenant').mockResolvedValue({
      id: 'user-9',
      username: 'newadmin',
      temporaryPassword: 'temp-onbehalf-pass',
    });
    const user = userEvent.setup();
    renderPage(adminAuth);

    await user.click(await screen.findByRole('tab', { name: i18n.t('tenants.detail.tabUsers') }));
    await user.click(screen.getByRole('button', { name: i18n.t('tenants.detail.addUserCta') }));
    await user.type(screen.getByLabelText(i18n.t('users.create.username')), 'newadmin');
    await user.type(screen.getByLabelText(i18n.t('users.create.nameEn')), 'New Admin');
    await user.type(screen.getByLabelText(i18n.t('users.create.nameAr')), 'مدير جديد');
    await user.click(screen.getByLabelText(i18n.t('users.role.TENANT_ADMIN')));
    await user.click(screen.getByRole('button', { name: i18n.t('users.create.submit') }));

    await waitFor(() =>
      expect(createUserInTenant).toHaveBeenCalledWith('tenant-1', {
        username: 'newadmin',
        displayNameI18n: { en: 'New Admin', ar: 'مدير جديد' },
        roles: ['TENANT_ADMIN'],
      }),
    );
    await user.click(await screen.findByRole('button', { name: i18n.t('common.reveal') }));
    expect(await screen.findByText('temp-onbehalf-pass')).toBeInTheDocument();
  });
});
