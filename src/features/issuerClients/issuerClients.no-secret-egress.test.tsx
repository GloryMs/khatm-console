import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as schemasApi from '@/features/schemas/api';
import { ClientsPage } from './ClientsPage';
import * as api from './api';

/**
 * The session's own hard requirement (spec FS-2.7a D10, tests §4): no
 * `khi_...` API key or holder HMAC secret may ever reach `console.*` or the
 * TanStack Query cache — only `ClientsPage`'s own local `revealState`, gone
 * the moment the operator closes {@link RevealSecretsDialog}. Also covers
 * the rotate path, which mints a second one-time secret.
 */

const auth: AuthContextValue = {
  status: 'authenticated',
  user: { username: 'admin', tenantSlug: 'khatm-default' },
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => true,
};

const API_KEY = 'khi_secretprefix_topsecretapikeyvalue';
const HOLDER_SECRET = 'holder-hmac-secret-value';

function renderPage(queryClient: QueryClient) {
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

function assertNeverLogged(spies: ReturnType<typeof vi.spyOn>[]) {
  for (const spy of spies) {
    for (const call of spy.mock.calls) {
      const text = call.map(String).join(' ');
      expect(text).not.toContain(API_KEY);
      expect(text).not.toContain(HOLDER_SECRET);
    }
  }
}

describe('issuer clients — no secret egress', () => {
  afterEach(() => vi.restoreAllMocks());

  it('never puts the created apiKey/holderHmacSecret in console output or the query cache, and drops them from the DOM on close', async () => {
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue([]);
    vi.spyOn(api, 'listIssuerClients').mockResolvedValue([]);
    vi.spyOn(api, 'createIssuerClient').mockResolvedValue({
      id: 'client-1',
      keyPrefix: 'khi_secretprefix',
      apiKey: API_KEY,
      holderHmacSecret: HOLDER_SECRET,
    });

    const consoleSpies = [
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
    ];

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const user = userEvent.setup();
    renderPage(queryClient);

    await user.click(await screen.findByRole('button', { name: i18n.t('clients.createCta') }));
    await user.type(screen.getByLabelText(i18n.t('clients.create.nameEn')), 'Sim');
    await user.type(screen.getByLabelText(i18n.t('clients.create.nameAr')), 'محاكي');
    await user.click(screen.getByRole('button', { name: i18n.t('clients.create.submit') }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: i18n.t('clients.reveal.confirmCopiedAndClose') })),
    );

    // Reveal both secrets on screen (proving they were the value shown), then close.
    for (const button of screen.getAllByRole('button', { name: i18n.t('common.reveal') })) {
      await user.click(button);
    }
    expect(screen.getByText(API_KEY)).toBeInTheDocument();
    expect(screen.getByText(HOLDER_SECRET)).toBeInTheDocument();

    // Never cached anywhere in TanStack Query, at any point while the secret is live.
    const cachedText = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => JSON.stringify(query.state.data))
      .join(' ');
    expect(cachedText).not.toContain(API_KEY);
    expect(cachedText).not.toContain(HOLDER_SECRET);

    await user.click(
      screen.getByRole('button', { name: i18n.t('clients.reveal.confirmCopiedAndClose') }),
    );

    expect(screen.queryByText(API_KEY)).not.toBeInTheDocument();
    expect(screen.queryByText(HOLDER_SECRET)).not.toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toContain(API_KEY);
    expect(document.body.textContent ?? '').not.toContain(HOLDER_SECRET);

    assertNeverLogged(consoleSpies);
  });
});
