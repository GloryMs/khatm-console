import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import type { SchemaSummary } from '@/features/schemas/api';
import type { UserSummary } from '@/features/tenants/api';
import * as orgApi from './api';
import { OrgChildPage } from './OrgChildPage';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

const orgAdminAuth: AuthContextValue = {
  ...baseAuth,
  hasScope: (scope) => scope === 'org:admin',
};

const child: orgApi.TenantRef = {
  id: 'child-1',
  slug: 'moi-immigration',
  nameI18n: { en: 'Immigration & Passports', ar: 'الهجرة والجوازات' },
  status: 'ACTIVE',
  active: true,
};

const childUser: UserSummary = {
  id: 'user-1',
  username: 'childadmin',
  displayNameI18n: { en: 'Child Admin', ar: 'مدير الابن' },
  roles: ['TENANT_ADMIN'],
  status: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00Z',
};

const childSchema: SchemaSummary = {
  id: 'schema-1',
  code: 'passport_v1',
  version: 1,
  status: 'PUBLISHED',
  nameI18n: { en: 'Passport', ar: 'جواز سفر' },
};

function renderPage(auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={['/org/children/child-1']}>
            <Routes>
              <Route path="/org/children/:id" element={<OrgChildPage />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('OrgChildPage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the org:admin scope', () => {
    renderPage(baseAuth);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });
});

describe('OrgChildPage on-behalf-of banner', () => {
  afterEach(() => vi.restoreAllMocks());

  it('always shows the acting-on-behalf-of indicator, naming the child', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    vi.spyOn(orgApi, 'listChildUsers').mockResolvedValue([]);
    renderPage(orgAdminAuth);

    expect(
      await screen.findByText(
        i18n.t('org.child.onBehalfOfNotice', { child: 'Immigration & Passports' }),
      ),
    ).toBeInTheDocument();
  });
});

describe('OrgChildPage users tab', () => {
  afterEach(() => vi.restoreAllMocks());

  it("lists a child's users with only disable and reset-password row actions", async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    vi.spyOn(orgApi, 'listChildUsers').mockResolvedValue([childUser]);
    renderPage(orgAdminAuth);

    expect(await screen.findByText('childadmin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('users.actionDisable') })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: i18n.t('users.actionResetPassword') }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: i18n.t('users.actionEditRoles') }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: i18n.t('users.actionResetTotp') }),
    ).not.toBeInTheDocument();
  });

  it('creates a user in the child on behalf of it, showing the one-time temporary password', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    vi.spyOn(orgApi, 'listChildUsers').mockResolvedValue([]);
    const createChildUser = vi.spyOn(orgApi, 'createChildUser').mockResolvedValue({
      id: 'user-2',
      username: 'neworgadmin',
      temporaryPassword: 'temp-org-pass',
    });
    const user = userEvent.setup();
    renderPage(orgAdminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('org.child.addUserCta') }));
    await user.type(screen.getByLabelText(i18n.t('users.create.username')), 'neworgadmin');
    await user.type(screen.getByLabelText(i18n.t('users.create.nameEn')), 'New Org Admin');
    await user.type(screen.getByLabelText(i18n.t('users.create.nameAr')), 'مدير جديد');
    await user.click(screen.getByLabelText(i18n.t('users.role.TENANT_ADMIN')));
    await user.click(screen.getByRole('button', { name: i18n.t('users.create.submit') }));

    await waitFor(() =>
      expect(createChildUser).toHaveBeenCalledWith('child-1', {
        username: 'neworgadmin',
        displayNameI18n: { en: 'New Org Admin', ar: 'مدير جديد' },
        roles: ['TENANT_ADMIN'],
      }),
    );
    await user.click(await screen.findByRole('button', { name: i18n.t('common.reveal') }));
    expect(await screen.findByText('temp-org-pass')).toBeInTheDocument();
  });

  it('disables a user after confirm, with the last-admin guard explained inline', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    vi.spyOn(orgApi, 'listChildUsers').mockResolvedValue([childUser]);
    const { ApiError } = await import('@/api/errors');
    const disableChildUser = vi
      .spyOn(orgApi, 'disableChildUser')
      .mockRejectedValue(new ApiError(409, { code: 'KH-USR-0423', messageKey: 'user.last-admin' }));
    const user = userEvent.setup();
    renderPage(orgAdminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('users.actionDisable') }));
    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('users.disableConfirm.confirm') }),
    );

    await waitFor(() => expect(disableChildUser).toHaveBeenCalledWith('child-1', 'user-1'));
    expect(await screen.findByText(i18n.t('users.lastAdminGuard.explanation'))).toBeInTheDocument();
  });

  it("resets a user's password on behalf of the child", async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    vi.spyOn(orgApi, 'listChildUsers').mockResolvedValue([childUser]);
    const resetChildUserPassword = vi.spyOn(orgApi, 'resetChildUserPassword').mockResolvedValue({
      id: 'user-1',
      username: 'childadmin',
      temporaryPassword: 'temp-reset-pass',
    });
    const user = userEvent.setup();
    renderPage(orgAdminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('users.actionResetPassword') }),
    );
    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('users.resetConfirm.confirm') }),
    );

    await waitFor(() => expect(resetChildUserPassword).toHaveBeenCalledWith('child-1', 'user-1'));
    await user.click(await screen.findByRole('button', { name: i18n.t('common.reveal') }));
    expect(await screen.findByText('temp-reset-pass')).toBeInTheDocument();
  });
});

describe('OrgChildPage schemas tab', () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the child's schemas read-only, with an explanatory note", async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    vi.spyOn(orgApi, 'listChildSchemas').mockResolvedValue([childSchema]);
    const user = userEvent.setup();
    renderPage(orgAdminAuth);

    await user.click(await screen.findByRole('tab', { name: i18n.t('org.child.tabSchemas') }));

    expect(await screen.findByText('Passport')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('org.child.schemasReadOnlyNote'))).toBeInTheDocument();
  });

  it('shows a clean empty state when the child has no schemas', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    vi.spyOn(orgApi, 'listChildSchemas').mockResolvedValue([]);
    const user = userEvent.setup();
    renderPage(orgAdminAuth);

    await user.click(await screen.findByRole('tab', { name: i18n.t('org.child.tabSchemas') }));

    expect(await screen.findByText(i18n.t('org.child.schemasEmpty'))).toBeInTheDocument();
  });
});
