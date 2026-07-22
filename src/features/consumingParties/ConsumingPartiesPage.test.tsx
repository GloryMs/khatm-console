import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as schemasApi from '@/features/schemas/api';
import * as consumingPartiesApi from './api';
import { ConsumingPartiesPage } from './ConsumingPartiesPage';
import { consumingPartiesKeys } from './hooks';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  logout: async () => undefined,
  hasScope: () => false,
};

const parties: consumingPartiesApi.ConsumingPartyView[] = [
  {
    id: 'party-1',
    code: 'demo-party',
    status: 'ACTIVE',
    nameI18n: { en: 'Demo Party', ar: 'طرف تجربة' },
    createdAt: '2026-07-22T06:00:00Z',
    allowedSchemas: [{ schemaId: 'schema-1', schemaCode: 'CriminalRecord/v1' }],
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
          <MemoryRouter initialEntries={['/consumers']}>
            <ConsumingPartiesPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('ConsumingPartiesPage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the admin scope', () => {
    renderPage(baseAuth);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });

  it('renders the party list with the admin scope', async () => {
    vi.spyOn(consumingPartiesApi, 'listConsumingParties').mockResolvedValue(parties);
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue([]);
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'admin' });
    expect(await screen.findByText('Demo Party')).toBeInTheDocument();
  });
});

describe('ConsumingPartiesPage create dialog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('blocks submit and shows both-language and code-format validation errors', async () => {
    vi.spyOn(consumingPartiesApi, 'listConsumingParties').mockResolvedValue([]);
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue([]);
    const create = vi.spyOn(consumingPartiesApi, 'createConsumingParty');
    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'admin' });

    await user.click(
      await screen.findByRole('button', { name: i18n.t('consumingParties.createCta') }),
    );
    await user.type(screen.getByLabelText(i18n.t('consumingParties.create.code')), 'Bad Code!');
    await user.click(
      screen.getByRole('button', { name: i18n.t('consumingParties.create.submit') }),
    );

    expect(
      await screen.findByText(i18n.t('consumingParties.create.codeInvalid')),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(i18n.t('consumingParties.create.nameRequired')).length,
    ).toBeGreaterThan(0);
    expect(create).not.toHaveBeenCalled();
  });

  it('submits with a valid code and both-language names', async () => {
    vi.spyOn(consumingPartiesApi, 'listConsumingParties').mockResolvedValue([]);
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue([]);
    const create = vi.spyOn(consumingPartiesApi, 'createConsumingParty').mockResolvedValue({
      id: 'party-2',
      code: 'new-party',
      status: 'ACTIVE',
      nameI18n: { en: 'New Party', ar: 'طرف جديد' },
      allowedSchemas: [],
    });
    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'admin' });

    await user.click(
      await screen.findByRole('button', { name: i18n.t('consumingParties.createCta') }),
    );
    await user.type(screen.getByLabelText(i18n.t('consumingParties.create.code')), 'new-party');
    await user.type(screen.getByLabelText(i18n.t('consumingParties.create.nameEn')), 'New Party');
    await user.type(screen.getByLabelText(i18n.t('consumingParties.create.nameAr')), 'طرف جديد');
    await user.click(
      screen.getByRole('button', { name: i18n.t('consumingParties.create.submit') }),
    );

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        code: 'new-party',
        nameI18n: { en: 'New Party', ar: 'طرف جديد' },
      }),
    );
  });
});

describe('ConsumingPartiesPage mint-key flow', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the one-time key modal exactly once per mint, and the raw key never enters the query cache', async () => {
    vi.spyOn(consumingPartiesApi, 'listConsumingParties').mockResolvedValue(parties);
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue([]);
    const mint = vi.spyOn(consumingPartiesApi, 'mintApiKey').mockResolvedValue({
      id: 'key-1',
      keyPrefix: 'abcd1234',
      rawKey: 'khk_test_abcd1234.superSecretRawKeyValue',
    });
    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'admin' });

    await user.click(
      await screen.findByRole('button', { name: i18n.t('consumingParties.actionMintKey') }),
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: i18n.t('consumingParties.mintConfirm.confirm'),
      }),
    );

    await waitFor(() => expect(mint).toHaveBeenCalledWith('party-1'));
    const keyOccurrences = await screen.findAllByText('khk_test_abcd1234.superSecretRawKeyValue');
    expect(keyOccurrences).toHaveLength(1);

    const cachedList = queryClient.getQueryData(consumingPartiesKeys.list());
    expect(JSON.stringify(cachedList)).not.toContain('superSecretRawKeyValue');
  });
});
