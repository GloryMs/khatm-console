import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { ApiError } from '@/api/errors';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as usersApi from './api';
import { UsersPage } from './UsersPage';
import { usersKeys } from './hooks';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

const tenantAdminAuth: AuthContextValue = {
  ...baseAuth,
  hasScope: (scope) => scope === 'tenant:admin',
};

const users: usersApi.UserSummary[] = [
  {
    id: 'user-1',
    username: 'issuer1',
    displayNameI18n: { en: 'Issuer One', ar: 'مُصدر واحد' },
    roles: ['ISSUER_OPERATOR'],
    status: 'ACTIVE',
    createdAt: '2026-07-28T06:00:00Z',
  },
];

let queryClient: QueryClient;

function renderPage(auth: AuthContextValue) {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={['/users']}>
            <UsersPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('UsersPage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the tenant:admin scope', () => {
    renderPage(baseAuth);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });

  it('renders the user list with the tenant:admin scope', async () => {
    vi.spyOn(usersApi, 'listUsers').mockResolvedValue(users);
    renderPage(tenantAdminAuth);
    expect(await screen.findByText('Issuer One')).toBeInTheDocument();
  });
});

describe('UsersPage create dialog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('blocks submit and shows validation errors including at-least-one-role', async () => {
    vi.spyOn(usersApi, 'listUsers').mockResolvedValue([]);
    const create = vi.spyOn(usersApi, 'createUser');
    const user = userEvent.setup();
    renderPage(tenantAdminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('users.createCta') }));
    await user.click(screen.getByRole('button', { name: i18n.t('users.create.submit') }));

    expect(await screen.findByText(i18n.t('users.create.usernameRequired'))).toBeInTheDocument();
    expect(screen.getAllByText(i18n.t('users.create.nameRequired')).length).toBeGreaterThan(0);
    expect(screen.getByText(i18n.t('users.create.rolesRequired'))).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a user and shows the one-time temporary password', async () => {
    vi.spyOn(usersApi, 'listUsers').mockResolvedValue([]);
    const create = vi.spyOn(usersApi, 'createUser').mockResolvedValue({
      id: 'user-2',
      username: 'newissuer',
      temporaryPassword: 'temp-Sup3rSecret',
    });
    const user = userEvent.setup();
    renderPage(tenantAdminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('users.createCta') }));
    await user.type(screen.getByLabelText(i18n.t('users.create.username')), 'newissuer');
    await user.type(screen.getByLabelText(i18n.t('users.create.nameEn')), 'New Issuer');
    await user.type(screen.getByLabelText(i18n.t('users.create.nameAr')), 'مصدر جديد');
    await user.click(screen.getByLabelText(i18n.t('users.role.ISSUER_OPERATOR')));
    await user.click(screen.getByRole('button', { name: i18n.t('users.create.submit') }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        username: 'newissuer',
        displayNameI18n: { en: 'New Issuer', ar: 'مصدر جديد' },
        roles: ['ISSUER_OPERATOR'],
      }),
    );

    await user.click(await screen.findByRole('button', { name: i18n.t('common.reveal') }));
    const passwordOccurrences = await screen.findAllByText('temp-Sup3rSecret');
    expect(passwordOccurrences).toHaveLength(1);
    const cachedList = queryClient.getQueryData(usersKeys.list());
    expect(JSON.stringify(cachedList)).not.toContain('temp-Sup3rSecret');
  });
});

describe('UsersPage last-active-admin guard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows a dedicated inline explanation for KH-USR-0423 instead of the generic banner', async () => {
    vi.spyOn(usersApi, 'listUsers').mockResolvedValue(users);
    vi.spyOn(usersApi, 'disableUser').mockRejectedValue(
      new ApiError(409, { code: 'KH-USR-0423', message: 'last active admin' }),
    );
    const user = userEvent.setup();
    renderPage(tenantAdminAuth);

    await user.click(await screen.findByRole('button', { name: i18n.t('users.actionDisable') }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: i18n.t('users.disableConfirm.confirm'),
      }),
    );

    expect(await screen.findByText(i18n.t('users.lastAdminGuard.explanation'))).toBeInTheDocument();
    expect(screen.queryByText('last active admin')).not.toBeInTheDocument();
  });
});

describe('UsersPage reset password', () => {
  afterEach(() => vi.restoreAllMocks());

  it('resets the password and shows the one-time temporary password', async () => {
    vi.spyOn(usersApi, 'listUsers').mockResolvedValue(users);
    const reset = vi.spyOn(usersApi, 'resetPassword').mockResolvedValue({
      id: 'user-1',
      username: 'issuer1',
      temporaryPassword: 'fresh-temp-pass',
    });
    const user = userEvent.setup();
    renderPage(tenantAdminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('users.actionResetPassword') }),
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: i18n.t('users.resetConfirm.confirm'),
      }),
    );

    await waitFor(() => expect(reset).toHaveBeenCalledWith('user-1'));
    await user.click(await screen.findByRole('button', { name: i18n.t('common.reveal') }));
    expect(await screen.findByText('fresh-temp-pass')).toBeInTheDocument();
  });
});
