import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import * as schemasApi from '@/features/schemas/api';
import * as credentialsApi from './api';
import { CredentialsPage } from './CredentialsPage';

const schemas: schemasApi.SchemaSummary[] = [
  {
    id: 'schema-1',
    code: 'CriminalRecord/v1',
    version: 1,
    status: 'PUBLISHED',
    nameI18n: { en: 'Criminal record', ar: 'السجل الجنائي' },
  },
];

const page1: credentialsApi.CredentialPage = {
  items: [
    {
      id: 'cred-1',
      ref: 'CRD-2026-0001',
      schemaCode: 'CriminalRecord/v1',
      schemaName: { en: 'Criminal record', ar: 'السجل الجنائي' },
      issuedAt: '2026-07-20T10:00:00Z',
      revoked: false,
      usesRemaining: 2,
      maxUses: 3,
    },
  ],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CredentialsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('CredentialsPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders search results with a copyable ref, localized schema name, and a revoke deep-link', async () => {
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue(schemas);
    vi.spyOn(credentialsApi, 'searchCredentials').mockResolvedValue(page1);
    renderPage();

    expect(await screen.findByText('CRD-2026-0001')).toBeInTheDocument();
    const row = screen.getByText('CRD-2026-0001').closest('tr') as HTMLElement;
    expect(within(row).getByText('Criminal record')).toBeInTheDocument();
    const revokeLink = screen.getByRole('link', { name: i18n.t('credentials.rowRevoke') });
    expect(revokeLink).toHaveAttribute('href', '/revoke?id=cred-1');
  });

  it('re-queries with the typed ref filter and resets to page 0', async () => {
    vi.spyOn(schemasApi, 'listSchemas').mockResolvedValue(schemas);
    const search = vi.spyOn(credentialsApi, 'searchCredentials').mockResolvedValue(page1);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('CRD-2026-0001');
    await user.type(screen.getByLabelText(i18n.t('credentials.filters.ref')), 'CRD-2026-0001');
    await user.click(screen.getByRole('button', { name: i18n.t('credentials.filters.search') }));

    await waitFor(() =>
      expect(search).toHaveBeenLastCalledWith(
        expect.objectContaining({ ref: 'CRD-2026-0001', page: 0, size: 20 }),
      ),
    );
  });
});
