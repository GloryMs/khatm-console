import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { ApiError } from '@/api/errors';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as schemasApi from '@/features/schemas/api';
import { ClientsPage } from './ClientsPage';
import * as api from './api';
import type { IssuerClientResponse } from './api';

const adminAuth: AuthContextValue = {
  status: 'authenticated',
  user: { username: 'admin', tenantSlug: 'khatm-default' },
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => true,
};

function renderPage(auth: AuthContextValue = adminAuth) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={auth}>
        <QueryClientProvider client={queryClient}>
          <ClientsPage />
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nextProvider>,
  );
}

const activeClient: IssuerClientResponse = {
  id: 'client-1',
  keyPrefix: 'khi_active01',
  status: 'ACTIVE',
  name: { en: 'Ministry connector', ar: 'موصل الوزارة' },
  allowedSchemaIds: [],
  lastUsedAt: undefined,
};

beforeEach(() => {
  vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue([]);
});

describe('ClientsPage — scope gate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a no-permission state and never fetches without key:manage', () => {
    const listSpy = vi.spyOn(api, 'listIssuerClients').mockResolvedValue([]);
    renderPage({ ...adminAuth, hasScope: () => false });

    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
    expect(listSpy).not.toHaveBeenCalled();
  });
});

describe('ClientsPage — create + one-time reveal', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reveals the apiKey and holderHmacSecret once, and neither remains after the operator closes it', async () => {
    vi.spyOn(api, 'listIssuerClients').mockResolvedValue([]);
    const createSpy = vi.spyOn(api, 'createIssuerClient').mockResolvedValue({
      id: 'client-2',
      keyPrefix: 'khi_new00001',
      apiKey: 'khi_new00001_topsecretvalue',
      holderHmacSecret: 'holder-secret-value',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: i18n.t('clients.createCta') }));
    const createDialog = screen.getByRole('dialog');
    await user.type(within(createDialog).getByLabelText(i18n.t('clients.create.nameEn')), 'Sim');
    await user.type(within(createDialog).getByLabelText(i18n.t('clients.create.nameAr')), 'محاكي');
    await user.click(
      within(createDialog).getByRole('button', { name: i18n.t('clients.create.submit') }),
    );

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));

    // The one-time secrets are visible after reveal.
    await user.click(screen.getAllByRole('button', { name: i18n.t('common.reveal') })[0]);
    await user.click(screen.getAllByRole('button', { name: i18n.t('common.reveal') })[0]);
    expect(screen.getByText('khi_new00001_topsecretvalue')).toBeInTheDocument();
    expect(screen.getByText('holder-secret-value')).toBeInTheDocument();

    // There is no plain "Done"/"Cancel" close — only the explicit copied-and-close action.
    expect(screen.queryByRole('button', { name: i18n.t('common.cancel') })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: i18n.t('clients.reveal.confirmCopiedAndClose') }),
    );

    expect(screen.queryByText('khi_new00001_topsecretvalue')).not.toBeInTheDocument();
    expect(screen.queryByText('holder-secret-value')).not.toBeInTheDocument();
  });

  it('surfaces KH-ICL-0503 (Vault unavailable) with code and traceId, and creates no client', async () => {
    vi.spyOn(api, 'listIssuerClients').mockResolvedValue([]);
    vi.spyOn(api, 'createIssuerClient').mockRejectedValue(
      new ApiError(503, {
        code: 'KH-ICL-0503',
        messageKey: 'issuer-client.holder-secret-unavailable',
        traceId: 'trace-vault-503',
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: i18n.t('clients.createCta') }));
    const createDialog = screen.getByRole('dialog');
    await user.type(within(createDialog).getByLabelText(i18n.t('clients.create.nameEn')), 'Sim');
    await user.type(within(createDialog).getByLabelText(i18n.t('clients.create.nameAr')), 'محاكي');
    await user.click(
      within(createDialog).getByRole('button', { name: i18n.t('clients.create.submit') }),
    );

    expect(await screen.findByText('KH-ICL-0503', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('trace-vault-503', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('clients.reveal.title'))).not.toBeInTheDocument();
  });
});

describe('ClientsPage — rotate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends the chosen retire window and shows the retiring note in the reveal dialog', async () => {
    vi.spyOn(api, 'listIssuerClients').mockResolvedValue([activeClient]);
    const rotateSpy = vi.spyOn(api, 'rotateIssuerClient').mockResolvedValue({
      id: 'client-3',
      keyPrefix: 'khi_rotated01',
      apiKey: 'khi_rotated01_secret',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: i18n.t('clients.actionRotate') }));
    const dialog = screen.getByRole('dialog');
    const hoursInput = within(dialog).getByLabelText(i18n.t('clients.rotate.retireAfterHours'));
    await user.clear(hoursInput);
    await user.type(hoursInput, '0');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('clients.rotate.confirm') }),
    );

    await waitFor(() =>
      expect(rotateSpy).toHaveBeenCalledWith('client-1', { retireAfterHours: 0 }),
    );
    expect(await screen.findByText(i18n.t('clients.reveal.retiringNote'))).toBeInTheDocument();
  });
});

describe('ClientsPage — suspend/resume', () => {
  afterEach(() => vi.restoreAllMocks());

  it('suspends an ACTIVE client via a plain confirm dialog', async () => {
    vi.spyOn(api, 'listIssuerClients').mockResolvedValue([activeClient]);
    const suspendSpy = vi.spyOn(api, 'suspendIssuerClient').mockResolvedValue({
      ...activeClient,
      status: 'SUSPENDED',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: i18n.t('clients.actionSuspend') }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: i18n.t('clients.suspendConfirm.confirm'),
      }),
    );

    await waitFor(() => expect(suspendSpy).toHaveBeenCalledWith('client-1'));
  });
});

describe('ClientsPage — revoke', () => {
  afterEach(() => vi.restoreAllMocks());

  it('requires typing the exact key prefix before revoke is armed', async () => {
    vi.spyOn(api, 'listIssuerClients').mockResolvedValue([activeClient]);
    const revokeSpy = vi.spyOn(api, 'revokeIssuerClient').mockResolvedValue({
      ...activeClient,
      status: 'REVOKED',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: i18n.t('clients.actionRevoke') }));
    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', {
      name: i18n.t('clients.revokeConfirm.confirm'),
    });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByRole('textbox'), 'wrong-prefix');
    expect(confirm).toBeDisabled();

    await user.clear(within(dialog).getByRole('textbox'));
    await user.type(within(dialog).getByRole('textbox'), activeClient.keyPrefix ?? '');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    await waitFor(() => expect(revokeSpy).toHaveBeenCalledWith('client-1'));
  });

  it('surfaces a KH-ICL error with code and traceId via the standard error banner', async () => {
    vi.spyOn(api, 'listIssuerClients').mockResolvedValue([activeClient]);
    vi.spyOn(api, 'revokeIssuerClient').mockRejectedValue(
      new ApiError(409, {
        code: 'KH-ICL-1409',
        messageKey: 'issuer-client.invalid-transition',
        traceId: 'trace-abc-123',
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: i18n.t('clients.actionRevoke') }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), activeClient.keyPrefix ?? '');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('clients.revokeConfirm.confirm') }),
    );

    expect(await screen.findByText('KH-ICL-1409', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('trace-abc-123', { exact: false })).toBeInTheDocument();
  });
});
