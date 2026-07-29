import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as issuanceApi from '@/features/issuance/api';
import { BulkIssuePage } from './BulkIssuePage';
import * as bulkApi from './api';
import * as csv from './csv';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

const schema: issuanceApi.SchemaSummary = {
  id: 'schema-1',
  code: 'CriminalRecord/v1',
  version: 1,
  status: 'PUBLISHED',
  nameI18n: { en: 'Criminal record', ar: 'السجل الجنائي' },
};

const detail: issuanceApi.SchemaDetail = {
  id: 'schema-1',
  code: 'CriminalRecord/v1',
  version: 1,
  status: 'PUBLISHED',
  defaultMaxUses: 5,
  defaultValidity: 'PT1H',
  sdFields: ['caseNumber'],
  nameI18n: { en: 'Criminal record', ar: 'السجل الجنائي' },
  claimsDefJson: JSON.stringify({
    fullName: { type: 'text', required: true, label_i18n: { en: 'Full name', ar: 'الاسم الكامل' } },
    caseNumber: {
      type: 'text',
      required: false,
      label_i18n: { en: 'Case number', ar: 'رقم القضية' },
    },
  }),
};

function makeCsvFile(content: string) {
  return new File([content], 'batch.csv', { type: 'text/csv' });
}

function renderPage(auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <BulkIssuePage />
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

async function advanceToUpload(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Criminal record/ }));
  await user.click(
    await screen.findByRole('button', { name: i18n.t('issueBulk.downloadTemplate') }),
  );
  await user.click(screen.getByRole('button', { name: i18n.t('issueBulk.upload.continue') }));
}

describe('BulkIssuePage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the issue scope', () => {
    renderPage(baseAuth);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });

  it('renders the schema step with the issue scope', async () => {
    vi.spyOn(issuanceApi, 'listPublishedSchemas').mockResolvedValue([schema]);
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'issue' });
    expect(await screen.findByText('Criminal record')).toBeInTheDocument();
  });
});

describe('BulkIssuePage wizard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('auto-maps, validates, submits only valid rows, and renders the one-time report', async () => {
    vi.spyOn(issuanceApi, 'listPublishedSchemas').mockResolvedValue([schema]);
    vi.spyOn(issuanceApi, 'getIssueSchema').mockResolvedValue(detail);
    const bulkIssue = vi.spyOn(bulkApi, 'bulkIssueCredentials').mockResolvedValue({
      total: 2,
      succeeded: 2,
      failed: 0,
      results: [
        { index: 0, status: 'ISSUED', ref: 'CRD-1', id: 'id-1', claimCode: 'CLAIM-1' },
        { index: 1, status: 'ISSUED', ref: 'CRD-3', id: 'id-3', claimCode: 'CLAIM-3' },
      ],
    });
    const downloadCsvSpy = vi.spyOn(csv, 'downloadCsv').mockImplementation(() => undefined);

    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'issue' });

    await advanceToUpload(user);
    expect(downloadCsvSpy).toHaveBeenCalledWith(
      'CriminalRecord/v1-template.csv',
      'fullName,caseNumber,pseudoRef\r\n',
    );

    const csvContent = [
      'fullName,caseNumber,pseudoRef',
      'Ali,CASE-1,holder-1',
      ',CASE-2,holder-2',
      'ليلى,CASE-3,holder-3',
      '',
    ].join('\n');
    const fileInput = screen.getByLabelText(i18n.t('issueBulk.upload.fileLabel'));
    await user.upload(fileInput, makeCsvFile(csvContent));

    expect(
      await screen.findByText(i18n.t('issueBulk.upload.rowCount', { count: 3 })),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: i18n.t('issueBulk.upload.continue') }));

    expect(
      await screen.findByText(i18n.t('issueBulk.preview.validRows', { count: 2 })),
    ).toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('issueBulk.preview.invalidRows', { count: 1 })),
    ).toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('issue.fieldRequired', { field: 'Full name' })),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: i18n.t('issueBulk.preview.submit', { count: 2 }) }),
    );

    await waitFor(() => expect(bulkIssue).toHaveBeenCalledTimes(1));
    expect(bulkIssue).toHaveBeenCalledWith({
      schemaCode: 'CriminalRecord/v1',
      mintClaimCodes: true,
      defaults: { maxUses: 5, validMinutes: 60 },
      items: [
        { claims: { fullName: 'Ali', caseNumber: 'CASE-1' }, pseudoRef: 'holder-1' },
        { claims: { fullName: 'ليلى', caseNumber: 'CASE-3' }, pseudoRef: 'holder-3' },
      ],
    });

    expect(
      await screen.findByText(i18n.t('issueBulk.report.claimCodesWarning')),
    ).toBeInTheDocument();
    expect(screen.getByText('CLAIM-1')).toBeInTheDocument();
    expect(screen.getByText('CLAIM-3')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('issueBulk.report.statusExcluded'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: i18n.t('issueBulk.report.exportCsv') }));
    expect(downloadCsvSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(/^bulk-issue-CriminalRecord\/v1-.*\.csv$/),
      expect.stringContaining('CLAIM-1'),
    );
  });

  it('rejects a file with more than 200 data rows', async () => {
    vi.spyOn(issuanceApi, 'listPublishedSchemas').mockResolvedValue([schema]);
    vi.spyOn(issuanceApi, 'getIssueSchema').mockResolvedValue(detail);
    vi.spyOn(csv, 'downloadCsv').mockImplementation(() => undefined);

    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'issue' });
    await advanceToUpload(user);

    const header = 'fullName,caseNumber,pseudoRef';
    const rows = Array.from({ length: 201 }, (_, i) => `Name${i},CASE-${i},holder-${i}`);
    const fileInput = screen.getByLabelText(i18n.t('issueBulk.upload.fileLabel'));
    await user.upload(fileInput, makeCsvFile([header, ...rows].join('\n')));

    expect(
      await screen.findByText(i18n.t('issueBulk.upload.tooManyRows', { max: 200 })),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: i18n.t('issueBulk.upload.continue') }),
    ).toBeDisabled();
  });
});
