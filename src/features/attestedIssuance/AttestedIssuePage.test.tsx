import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as issuanceApi from '@/features/issuance/api';
import { AttestedIssuePage } from './AttestedIssuePage';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

// sha256('scan-bytes'), verified against Node's crypto.createHash('sha256').
const KNOWN_DIGEST = '4ccad8430338d80eb58b62bb7f7636ae1cea1d615b8b5098a4d1a10efbd22a45';
const VALID_HOLDER_REF = '0123456789abcdef'.repeat(4);

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

const attestedSchema: issuanceApi.SchemaSummary = {
  id: 'schema-att-1',
  code: 'AttestedDocument/v1',
  version: 1,
  status: 'PUBLISHED',
  requiresAttestation: true,
  nameI18n: { en: 'Attested Document', ar: 'وثيقة مصدَّقة' },
};

const attestedDetail: issuanceApi.SchemaDetail = {
  id: 'schema-att-1',
  code: 'AttestedDocument/v1',
  version: 1,
  status: 'PUBLISHED',
  requiresAttestation: true,
  sdFields: ['doc_sha256', 'doc_type', 'original_issue_date', 'attestation_note'],
  nameI18n: { en: 'Attested Document', ar: 'وثيقة مصدَّقة' },
  claimsDefJson: JSON.stringify({
    doc_sha256: {
      type: 'text',
      pattern: '^[0-9a-f]{64}$',
      label_i18n: { en: 'Document SHA-256', ar: 'بصمة SHA-256' },
    },
    doc_type: { type: 'text', label_i18n: { en: 'Document Type', ar: 'نوع الوثيقة' } },
    original_issue_date: {
      type: 'date',
      label_i18n: { en: 'Original Issue Date', ar: 'تاريخ الإصدار الأصلي' },
    },
    attestation_note: {
      type: 'text',
      label_i18n: { en: 'Attestation Note', ar: 'ملاحظة التصديق' },
    },
  }),
};

function renderPage(auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <AttestedIssuePage />
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('AttestedIssuePage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the issue scope', () => {
    renderPage(baseAuth);
    expect(screen.getByText(i18n.t('errors.noPermission.title'))).toBeInTheDocument();
  });
});

describe('AttestedIssuePage full walkthrough', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists only requiresAttestation schemas, locks the computed digest into claims, and issues', async () => {
    vi.spyOn(issuanceApi, 'listAttestedSchemas').mockResolvedValue([attestedSchema]);
    vi.spyOn(issuanceApi, 'getIssueSchema').mockResolvedValue(attestedDetail);
    const issue = vi.spyOn(issuanceApi, 'issueCredential').mockResolvedValue({
      id: 'credential-att-1',
      ref: 'CRD-2026-0099',
      holderRef: VALID_HOLDER_REF,
      sdJwt: 'sd.jwt',
    });
    vi.spyOn(issuanceApi, 'mintClaimCode').mockResolvedValue({
      code: 'CLAIM-ATT',
      expiresAt: '2026-08-20T12:00:00Z',
    });

    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'issue' });

    // Step 1 — schema pick (attested-only picker).
    await user.click(await screen.findByRole('button', { name: /Attested Document/ }));

    // Step 2 — scan: pick a file, real WebCrypto hashing runs in this test runtime.
    const fileInput = await screen.findByLabelText(i18n.t('issueAttested.scan.pickFile'));
    await user.upload(fileInput, new File(['scan-bytes'], 'scan.bin'));

    // Step 3 — details: the digest is shown locked (never an editable claim input).
    expect(await screen.findByText(KNOWN_DIGEST)).toBeInTheDocument();
    expect(screen.queryByLabelText('Document SHA-256')).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText(i18n.t('issue.holderRef')),
      VALID_HOLDER_REF.toUpperCase(),
    );
    await user.type(screen.getByLabelText('Document Type'), 'IDENTITY_DOCUMENT');
    await user.click(
      screen.getByRole('button', { name: i18n.t('issueAttested.details.continueToReview') }),
    );

    // Step 4 — review: acknowledge, then retype the digest's first 8 hex chars to confirm.
    expect(await screen.findByText(KNOWN_DIGEST)).toBeInTheDocument();
    await user.click(screen.getByLabelText(i18n.t('issueAttested.review.acknowledge')));
    await user.click(screen.getByRole('button', { name: i18n.t('issueAttested.review.issueCta') }));

    const typeInput = await screen.findByLabelText(i18n.t('issueAttested.review.typePrompt'));
    await user.type(typeInput, KNOWN_DIGEST.slice(0, 8));
    await user.click(
      screen.getByRole('button', { name: i18n.t('issueAttested.review.confirmCta') }),
    );

    await waitFor(() => expect(issue).toHaveBeenCalledTimes(1));
    expect(issue).toHaveBeenCalledWith({
      // Typed uppercase above — the request must carry the normalized (lowercase) form.
      holderRef: VALID_HOLDER_REF,
      schemaCode: 'AttestedDocument/v1',
      schemaId: 'schema-att-1',
      claims: {
        doc_type: 'IDENTITY_DOCUMENT',
        original_issue_date: '',
        attestation_note: '',
        doc_sha256: KNOWN_DIGEST,
      },
      maxUses: undefined,
      validMinutes: undefined,
      sdFields: ['doc_sha256', 'doc_type', 'original_issue_date', 'attestation_note'],
      attestation: {},
    });

    expect(await screen.findByText('CRD-2026-0099')).toBeInTheDocument();
    expect(screen.getByText(VALID_HOLDER_REF)).toBeInTheDocument();
  });

  it('omits holderRef from the request when left blank, and blocks submit with a shape error for free text', async () => {
    vi.spyOn(issuanceApi, 'listAttestedSchemas').mockResolvedValue([attestedSchema]);
    vi.spyOn(issuanceApi, 'getIssueSchema').mockResolvedValue(attestedDetail);
    const issue = vi.spyOn(issuanceApi, 'issueCredential').mockResolvedValue({
      id: 'credential-att-2',
      ref: 'CRD-2026-0100',
      holderRef: VALID_HOLDER_REF,
      sdJwt: 'sd.jwt',
    });
    vi.spyOn(issuanceApi, 'mintClaimCode').mockResolvedValue({
      code: 'CLAIM-ATT-2',
      expiresAt: '2026-08-20T12:00:00Z',
    });

    const user = userEvent.setup();
    renderPage({ ...baseAuth, hasScope: (scope) => scope === 'issue' });

    await user.click(await screen.findByRole('button', { name: /Attested Document/ }));
    const fileInput = await screen.findByLabelText(i18n.t('issueAttested.scan.pickFile'));
    await user.upload(fileInput, new File(['scan-bytes'], 'scan.bin'));
    await screen.findByText(KNOWN_DIGEST);

    // Free text is rejected before the request is ever built.
    await user.type(screen.getByLabelText(i18n.t('issue.holderRef')), 'holder-att-001');
    await user.click(
      screen.getByRole('button', { name: i18n.t('issueAttested.details.continueToReview') }),
    );
    expect(await screen.findByText(i18n.t('issue.holderRefInvalid'))).toBeInTheDocument();

    // Clear it and continue with a blank value instead.
    await user.clear(screen.getByLabelText(i18n.t('issue.holderRef')));
    await user.type(screen.getByLabelText('Document Type'), 'IDENTITY_DOCUMENT');
    await user.click(
      screen.getByRole('button', { name: i18n.t('issueAttested.details.continueToReview') }),
    );

    expect(await screen.findByText(i18n.t('issue.holderRefNotProvided'))).toBeInTheDocument();
    await user.click(screen.getByLabelText(i18n.t('issueAttested.review.acknowledge')));
    await user.click(screen.getByRole('button', { name: i18n.t('issueAttested.review.issueCta') }));
    const typeInput = await screen.findByLabelText(i18n.t('issueAttested.review.typePrompt'));
    await user.type(typeInput, KNOWN_DIGEST.slice(0, 8));
    await user.click(
      screen.getByRole('button', { name: i18n.t('issueAttested.review.confirmCta') }),
    );

    await waitFor(() => expect(issue).toHaveBeenCalledTimes(1));
    const sentBody = JSON.parse(JSON.stringify(issue.mock.calls[0][0]));
    expect(sentBody).not.toHaveProperty('holderRef');
  });
});
