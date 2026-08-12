import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import { AttestedIssuePage } from './AttestedIssuePage';

/**
 * The session's most important artifact (FS-2.4 D1): the scanned file is
 * hashed entirely in the browser and never reaches the platform. There is no
 * upload endpoint and there must never be one — this test fails loudly if a
 * future change adds a call that carries the file.
 *
 * It spies on the real `fetch` (not the `api.ts` wrapper functions — mocking
 * those would hide exactly the thing this test exists to prove) across a
 * complete scan-to-issue run, with `scan.bin`'s content ("do-not-upload-me")
 * as the tripwire: if that string, or any encoding of the raw bytes, ever
 * appears in a request, or any request uses `multipart/form-data`, the test
 * fails.
 */

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

const FILE_CONTENT = 'do-not-upload-me';
// sha256('do-not-upload-me'), verified against Node's crypto.createHash('sha256').
const DIGEST = '52399d3a1daebb04492a46196daf46134077a80054556cc32eea8dcaad89a216';

const auth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: (scope) => scope === 'issue',
};

const schema = {
  id: 'schema-att-1',
  code: 'AttestedDocument/v1',
  version: 1,
  status: 'PUBLISHED',
  requiresAttestation: true,
  nameI18n: { en: 'Attested Document', ar: 'وثيقة مصدَّقة' },
};

const detail = {
  ...schema,
  sdFields: ['doc_sha256', 'doc_type'],
  claimsDefJson: JSON.stringify({
    doc_sha256: {
      type: 'text',
      pattern: '^[0-9a-f]{64}$',
      label_i18n: { en: 'Document SHA-256', ar: 'بصمة SHA-256' },
    },
    doc_type: { type: 'text', label_i18n: { en: 'Document Type', ar: 'نوع الوثيقة' } },
  }),
};

interface RecordedCall {
  url: string;
  method: string;
  contentType: string | null;
  bodyText: string | null;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Stands in for the platform across the whole run — driven purely by URL
 * pattern, so this test exercises the real `fetch` call `apiFetch` makes
 * rather than a mocked API layer.
 */
function installFetchSpy(): { calls: RecordedCall[]; restore: () => void } {
  const calls: RecordedCall[] = [];
  const spy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();
      const headers = new Headers(init?.headers);
      const bodyText = typeof init?.body === 'string' ? init.body : null;
      calls.push({ url, method, contentType: headers.get('Content-Type'), bodyText });

      if (method === 'GET' && url.endsWith('/api/v1/schemas')) return jsonResponse([schema]);
      if (method === 'GET' && url.endsWith('/api/v1/schemas/schema-att-1'))
        return jsonResponse(detail);
      if (method === 'POST' && url.endsWith('/api/v1/credentials/issue'))
        return jsonResponse({ id: 'credential-att-1', ref: 'CRD-2026-0100', sdJwt: 'sd.jwt' });
      if (method === 'POST' && url.endsWith('/api/v1/credentials/credential-att-1/claim-code'))
        return jsonResponse({ code: 'CLAIM-EGRESS', expiresAt: '2026-08-20T12:00:00Z' });

      throw new Error(`Unexpected fetch in D1 no-egress test: ${method} ${url}`);
    });
  return { calls, restore: () => spy.mockRestore() };
}

function renderPage() {
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

describe('attested issuance — no file egress (FS-2.4 D1)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('never sends multipart/form-data or the file bytes across a full scan-to-issue run', async () => {
    const { calls, restore } = installFetchSpy();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Attested Document/ }));

    const fileInput = await screen.findByLabelText(i18n.t('issueAttested.scan.pickFile'));
    await user.upload(fileInput, new File([FILE_CONTENT], 'scan.bin'));

    expect(await screen.findByText(DIGEST)).toBeInTheDocument();

    await user.type(screen.getByLabelText(i18n.t('issue.holderRef')), 'holder-egress-001');
    await user.click(
      screen.getByRole('button', { name: i18n.t('issueAttested.details.continueToReview') }),
    );

    await user.click(screen.getByLabelText(i18n.t('issueAttested.review.acknowledge')));
    await user.click(screen.getByRole('button', { name: i18n.t('issueAttested.review.issueCta') }));
    await user.type(
      await screen.findByLabelText(i18n.t('issueAttested.review.typePrompt')),
      DIGEST.slice(0, 8),
    );
    await user.click(
      screen.getByRole('button', { name: i18n.t('issueAttested.review.confirmCta') }),
    );

    await waitFor(() => expect(screen.getByText('CRD-2026-0100')).toBeInTheDocument());
    restore();

    // At least the schema list, schema detail, issue, and claim-code mint calls happened.
    expect(calls.length).toBeGreaterThanOrEqual(4);

    for (const call of calls) {
      if (call.contentType) expect(call.contentType).not.toMatch(/multipart\/form-data/i);
      if (call.bodyText) {
        expect(call.bodyText).not.toContain(FILE_CONTENT);
        expect(call.bodyText.toLowerCase()).not.toContain(
          Buffer.from(FILE_CONTENT).toString('hex'),
        );
        expect(call.bodyText).not.toContain(Buffer.from(FILE_CONTENT).toString('base64'));
      }
    }

    const issueCall = calls.find((call) => call.url.endsWith('/api/v1/credentials/issue'));
    expect(issueCall).toBeDefined();
    expect(issueCall?.contentType).toBe('application/json');
    const issueBody = JSON.parse(issueCall?.bodyText ?? '{}') as {
      claims?: Record<string, unknown>;
    };
    expect(issueBody.claims?.doc_sha256).toBe(DIGEST);
    expect(issueBody.claims?.doc_sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});
