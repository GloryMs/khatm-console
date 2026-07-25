import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { IssuePage } from './IssuePage';
import * as api from './api';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

const schemas: api.SchemaSummary[] = [
  {
    id: 'schema-1',
    code: 'CriminalRecord/v1',
    version: 1,
    status: 'PUBLISHED',
    nameI18n: { en: 'Criminal record', ar: 'السجل الجنائي' },
  },
  {
    id: 'schema-2',
    code: 'Draft/v1',
    version: 1,
    status: 'DRAFT',
    nameI18n: { en: 'Draft schema', ar: 'مسودة' },
  },
];

const detail: api.SchemaDetail = {
  id: 'schema-1',
  code: 'CriminalRecord/v1',
  version: 1,
  status: 'PUBLISHED',
  defaultMaxUses: 3,
  defaultValidity: 'PT2H',
  sdFields: ['caseNumber'],
  nameI18n: { en: 'Criminal record', ar: 'السجل الجنائي' },
  claimsDefJson: JSON.stringify({
    result: { type: 'string', required: true, label_i18n: { en: 'Result', ar: 'النتيجة' } },
    caseNumber: {
      type: 'string',
      required: false,
      label_i18n: { en: 'Case number', ar: 'رقم القضية' },
    },
  }),
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <IssuePage />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('IssuePage', () => {
  const originalLocation = window.location;

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    await i18n.changeLanguage('en');
  });

  it('filters to published schemas and displays localized name, code, and version', async () => {
    vi.spyOn(api, 'listPublishedSchemas').mockResolvedValue(
      schemas.filter((schema) => schema.status === 'PUBLISHED'),
    );
    renderPage();

    expect(await screen.findByText('Criminal record')).toBeInTheDocument();
    expect(screen.getByText('CriminalRecord/v1')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('schemas.version', { version: 1 }))).toBeInTheDocument();
    expect(screen.queryByText('Draft schema')).not.toBeInTheDocument();
  });

  it('prefills defaults, constructs schemaCode, mints, and renders the exact QR payload', async () => {
    vi.stubEnv('VITE_QR_API_BASE', 'https://khatm.example.com');
    vi.spyOn(api, 'listPublishedSchemas').mockResolvedValue([schemas[0]]);
    vi.spyOn(api, 'getIssueSchema').mockResolvedValue(detail);
    const issue = vi.spyOn(api, 'issueCredential').mockResolvedValue({
      id: 'credential-1',
      ref: 'CRD-2026-0001',
      sdJwt: 'sd.jwt',
    });
    vi.spyOn(api, 'mintClaimCode').mockResolvedValue({
      code: 'CLAIM-ABC',
      expiresAt: '2026-07-20T12:15:00Z',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Criminal record/ }));
    expect(await screen.findByLabelText(i18n.t('issue.maxUses'))).toHaveValue(3);
    expect(screen.getByLabelText(i18n.t('issue.validMinutes'))).toHaveValue(120);
    expect(screen.getByLabelText('Case number').parentElement).toHaveTextContent(
      i18n.t('issue.selectiveDisclosure'),
    );

    await user.type(screen.getByLabelText(i18n.t('issue.holderRef')), 'holder-001');
    await user.type(screen.getByLabelText('Result'), 'NO_RECORD');
    await user.click(screen.getByRole('button', { name: i18n.t('issue.submit') }));

    await waitFor(() => expect(issue).toHaveBeenCalledTimes(1));
    expect(issue).toHaveBeenCalledWith({
      holderRef: 'holder-001',
      schemaCode: 'CriminalRecord/v1',
      claims: { result: 'NO_RECORD', caseNumber: '' },
      maxUses: 3,
      validMinutes: 120,
      sdFields: ['caseNumber'],
    });
    expect(await screen.findByText(i18n.t('issue.codeShownOnce'))).toBeInTheDocument();
    expect(screen.getByText('CRD-2026-0001')).toBeInTheDocument();
    // The claim code is masked by default (SecretReveal); reveal it to check the value.
    await user.click(screen.getByRole('button', { name: i18n.t('common.reveal') }));
    expect(screen.getByText('CLAIM-ABC')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code')).toHaveTextContent(
      '{"v":1,"api":"https://khatm.example.com","code":"CLAIM-ABC"}',
    );
    expect(screen.queryByText(i18n.t('issue.qrLocalhostHint'))).not.toBeInTheDocument();
  });

  it('shows the localhost warning when VITE_QR_API_BASE is explicitly set to a local address', async () => {
    vi.stubEnv('VITE_QR_API_BASE', 'http://localhost:5173');
    vi.spyOn(api, 'listPublishedSchemas').mockResolvedValue([schemas[0]]);
    vi.spyOn(api, 'getIssueSchema').mockResolvedValue(detail);
    vi.spyOn(api, 'issueCredential').mockResolvedValue({
      id: 'credential-1',
      ref: 'CRD-1',
      sdJwt: 'sd.jwt',
    });
    vi.spyOn(api, 'mintClaimCode').mockResolvedValue({
      code: 'LOCAL',
      expiresAt: '2026-07-20T12:15:00Z',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Criminal record/ }));
    await user.type(await screen.findByLabelText(i18n.t('issue.holderRef')), 'holder-001');
    await user.type(screen.getByLabelText('Result'), 'NO_RECORD');
    await user.click(screen.getByRole('button', { name: i18n.t('issue.submit') }));

    const qrBox = await screen.findByText(i18n.t('issue.qrLocalhostHint'));
    expect(qrBox).toHaveAttribute('role', 'alert');
    expect(within(qrBox.parentElement as HTMLElement).getByTestId('qr-code')).toHaveTextContent(
      '{"v":1,"api":"http://localhost:5173","code":"LOCAL"}',
    );
  });

  it('shows the localhost warning when VITE_QR_API_BASE is unset and the console origin is localhost', async () => {
    // No stubEnv call: VITE_QR_API_BASE is unset, so getQrApiBase() falls back
    // to window.location.origin — jsdom's default test origin is localhost,
    // reproducing exactly the "browsing via localhost" bug report.
    vi.spyOn(api, 'listPublishedSchemas').mockResolvedValue([schemas[0]]);
    vi.spyOn(api, 'getIssueSchema').mockResolvedValue(detail);
    vi.spyOn(api, 'issueCredential').mockResolvedValue({
      id: 'credential-1',
      ref: 'CRD-1',
      sdJwt: 'sd.jwt',
    });
    vi.spyOn(api, 'mintClaimCode').mockResolvedValue({
      code: 'LOCAL',
      expiresAt: '2026-07-20T12:15:00Z',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Criminal record/ }));
    await user.type(await screen.findByLabelText(i18n.t('issue.holderRef')), 'holder-001');
    await user.type(screen.getByLabelText('Result'), 'NO_RECORD');
    await user.click(screen.getByRole('button', { name: i18n.t('issue.submit') }));

    expect(await screen.findByText(i18n.t('issue.qrLocalhostHint'))).toBeInTheDocument();
  });

  it('hides the localhost warning when VITE_QR_API_BASE is unset and the console origin is a real host', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://console.khatm.example.com/'),
      writable: true,
      configurable: true,
    });
    vi.spyOn(api, 'listPublishedSchemas').mockResolvedValue([schemas[0]]);
    vi.spyOn(api, 'getIssueSchema').mockResolvedValue(detail);
    vi.spyOn(api, 'issueCredential').mockResolvedValue({
      id: 'credential-1',
      ref: 'CRD-1',
      sdJwt: 'sd.jwt',
    });
    vi.spyOn(api, 'mintClaimCode').mockResolvedValue({
      code: 'DEPLOYED',
      expiresAt: '2026-07-20T12:15:00Z',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Criminal record/ }));
    await user.type(await screen.findByLabelText(i18n.t('issue.holderRef')), 'holder-001');
    await user.type(screen.getByLabelText('Result'), 'NO_RECORD');
    await user.click(screen.getByRole('button', { name: i18n.t('issue.submit') }));

    expect(await screen.findByTestId('qr-code')).toHaveTextContent(
      '{"v":1,"api":"https://console.khatm.example.com","code":"DEPLOYED"}',
    );
    expect(screen.queryByText(i18n.t('issue.qrLocalhostHint'))).not.toBeInTheDocument();
  });

  it('renders the localhost warning in Arabic when the UI language is Arabic', async () => {
    vi.stubEnv('VITE_QR_API_BASE', 'http://localhost:5173');
    vi.spyOn(api, 'listPublishedSchemas').mockResolvedValue([schemas[0]]);
    vi.spyOn(api, 'getIssueSchema').mockResolvedValue(detail);
    vi.spyOn(api, 'issueCredential').mockResolvedValue({
      id: 'credential-1',
      ref: 'CRD-1',
      sdJwt: 'sd.jwt',
    });
    vi.spyOn(api, 'mintClaimCode').mockResolvedValue({
      code: 'LOCAL-AR',
      expiresAt: '2026-07-20T12:15:00Z',
    });
    await i18n.changeLanguage('ar');
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /السجل الجنائي/ }));
    await user.type(
      await screen.findByLabelText(i18n.t('issue.holderRef', { lng: 'ar' })),
      'holder-001',
    );
    await user.type(screen.getByLabelText('النتيجة'), 'NO_RECORD');
    await user.click(screen.getByRole('button', { name: i18n.t('issue.submit', { lng: 'ar' }) }));

    expect(
      await screen.findByText(i18n.t('issue.qrLocalhostHint', { lng: 'ar' })),
    ).toBeInTheDocument();
  });
});
