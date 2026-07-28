import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as schemasApi from '@/features/schemas/api';
import { SchemaManagementPage } from './SchemaManagementPage';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

const summaries: schemasApi.SchemaSummary[] = [
  {
    id: 'draft-1',
    code: 'Draft/v1',
    version: 1,
    status: 'DRAFT',
    nameI18n: { en: 'Draft schema', ar: 'مسودة' },
  },
  {
    id: 'pub-1',
    code: 'Published/v1',
    version: 1,
    status: 'PUBLISHED',
    nameI18n: { en: 'Published schema', ar: 'مخطط منشور' },
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
          <MemoryRouter initialEntries={['/schemas/manage']}>
            <SchemaManagementPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('SchemaManagementPage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the schema:manage scope', () => {
    renderPage(baseAuth);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });

  it('renders the management list with the schema:manage scope', async () => {
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue(summaries);
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'schema:manage' });
    expect(await screen.findByText('Draft schema')).toBeInTheDocument();
  });
});

describe('SchemaManagementPage publish-confirm guard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not call the publish API until the confirm dialog is accepted', async () => {
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue(summaries);
    const publish = vi.spyOn(schemasApi, 'publishSchema').mockResolvedValue(summaries[0]);
    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'schema:manage' });

    await user.click(
      await screen.findByRole('button', { name: i18n.t('schemaManagement.actionPublish') }),
    );
    expect(publish).not.toHaveBeenCalled();

    expect(screen.getByRole('dialog')).toHaveTextContent(
      i18n.t('schemaManagement.publishConfirm.title'),
    );

    await user.click(
      screen.getByRole('button', { name: i18n.t('schemaManagement.publishConfirm.confirm') }),
    );
    await waitFor(() => expect(publish).toHaveBeenCalledWith('draft-1'));
  });

  it('does nothing when the publish confirm dialog is cancelled', async () => {
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue(summaries);
    const publish = vi.spyOn(schemasApi, 'publishSchema').mockResolvedValue(summaries[0]);
    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'schema:manage' });

    await user.click(
      await screen.findByRole('button', { name: i18n.t('schemaManagement.actionPublish') }),
    );
    await user.click(
      screen.getByRole('button', { name: i18n.t('schemaManagement.publishConfirm.cancel') }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(publish).not.toHaveBeenCalled();
  });
});
