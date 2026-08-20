import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import type { VerifyResponse } from '../api';
import { VerifyResult } from './VerifyResult';

const KNOWN_DIGEST = '4ccad8430338d80eb58b62bb7f7636ae1cea1d615b8b5098a4d1a10efbd22a45';

// The generated VerifyResponse.claims type (`{[key: string]: Record<string, never>}`)
// is openapi-typescript's rendering of an untyped `additionalProperties: object`
// schema — actual claim values are arbitrary JSON. Fixtures go through `unknown`
// so tests can supply realistic string/number claim values.
function fixture(value: Record<string, unknown>): VerifyResponse {
  return value as unknown as VerifyResponse;
}

function renderResult(result: VerifyResponse) {
  render(
    <I18nextProvider i18n={i18n}>
      <VerifyResult result={result} />
    </I18nextProvider>,
  );
}

describe('VerifyResult', () => {
  it('renders a valid verdict and the disclosed claims', () => {
    renderResult(
      fixture({ valid: true, claims: { result: 'NO_RECORD', caseNumber: 'CR-2026-00042' } }),
    );
    expect(screen.getByText(i18n.t('verify.valid'))).toBeInTheDocument();
    expect(screen.getByText('NO_RECORD')).toBeInTheDocument();
    expect(screen.getByText('CR-2026-00042')).toBeInTheDocument();
  });

  it('renders an invalid verdict with the server-localized reason and no claims note', () => {
    renderResult(
      fixture({
        valid: false,
        reason: 'withheld_mandatory_claim',
        reasonMessage: 'A mandatory claim was withheld.',
      }),
    );
    expect(screen.getByText(i18n.t('verify.invalid'))).toBeInTheDocument();
    expect(screen.getByText('A mandatory claim was withheld.')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('verify.noClaims'))).toBeInTheDocument();
  });

  it('tolerates the absence of status-list fields without crashing', () => {
    renderResult(fixture({ valid: true, claims: { result: 'OK' } }));
    expect(screen.queryByText(i18n.t('verify.statusChecked'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t('verify.statusUri'))).not.toBeInTheDocument();
  });

  it('renders status-list metadata when the KH-1.3 lane includes those fields', () => {
    renderResult(
      fixture({
        valid: true,
        claims: {},
        statusListChecked: true,
        statusListVersion: 7,
        statusListUri: 'https://khatm.example.com/status/7',
      }),
    );
    expect(screen.getByText((c) => c.includes(i18n.t('verify.statusChecked')))).toBeInTheDocument();
    expect(screen.getByText((c) => c.endsWith(': 7'))).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes('status/7'))).toBeInTheDocument();
  });

  it('offers hash comparison only for a claim shaped like a hex digest, not an ordinary claim', () => {
    renderResult(
      fixture({ valid: true, claims: { result: 'NO_RECORD', doc_sha256: KNOWN_DIGEST } }),
    );
    const compareButtons = screen.getAllByRole('button', {
      name: i18n.t('verify.hashCompare.cta'),
    });
    expect(compareButtons).toHaveLength(1);
  });

  it('hashes a locally-picked file and reports a match against the disclosed digest (session veto V1)', async () => {
    renderResult(fixture({ valid: true, claims: { doc_sha256: KNOWN_DIGEST } }));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: i18n.t('verify.hashCompare.cta') }));
    const fileInput = screen.getByLabelText(i18n.t('verify.hashCompare.pickFile'));
    const file = new File(['scan-bytes'], 'scan.bin');
    await user.upload(fileInput, file);

    expect(await screen.findByText(i18n.t('verify.hashCompare.match'))).toBeInTheDocument();
  });

  it('reports a mismatch when the picked file does not hash to the disclosed digest', async () => {
    renderResult(fixture({ valid: true, claims: { doc_sha256: KNOWN_DIGEST } }));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: i18n.t('verify.hashCompare.cta') }));
    const fileInput = screen.getByLabelText(i18n.t('verify.hashCompare.pickFile'));
    const file = new File(['different-bytes'], 'scan.bin');
    await user.upload(fileInput, file);

    expect(await screen.findByText(i18n.t('verify.hashCompare.mismatch'))).toBeInTheDocument();
  });
});

describe('VerifyResult issuer lineage (spec FS-2.5 D4)', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders no lineage row for a root-issued credential (empty array)', () => {
    renderResult(fixture({ valid: true, claims: {}, issuerLineage: [] }));
    expect(screen.queryByText(i18n.t('verify.issuerLineage.label'))).not.toBeInTheDocument();
  });

  it('renders no lineage row when the ref was unresolvable (field absent)', () => {
    renderResult(fixture({ valid: false, claims: {} }));
    expect(screen.queryByText(i18n.t('verify.issuerLineage.label'))).not.toBeInTheDocument();
  });

  it('renders the full ancestor chain, nearest first, joined with an em dash', () => {
    renderResult(
      fixture({
        valid: true,
        claims: {},
        issuerLineage: [
          { slug: 'moi', nameI18n: { en: 'Ministry of Interior', ar: 'وزارة الداخلية' } },
          { slug: 'gov', nameI18n: { en: 'Government', ar: 'الحكومة' } },
        ],
      }),
    );
    const label = screen.getByText(i18n.t('verify.issuerLineage.label'));
    expect(label.parentElement).toHaveTextContent('Ministry of Interior — Government');
  });

  it('renders the Arabic ancestor names in Arabic UI', async () => {
    await i18n.changeLanguage('ar');
    renderResult(
      fixture({
        valid: true,
        claims: {},
        issuerLineage: [
          { slug: 'moi', nameI18n: { en: 'Ministry of Interior', ar: 'وزارة الداخلية' } },
        ],
      }),
    );
    expect(screen.getByText('وزارة الداخلية')).toBeInTheDocument();
  });

  it('falls back to the slug, LTR-embedded, when an ancestor has no localized name (mixed bidi)', async () => {
    await i18n.changeLanguage('ar');
    renderResult(
      fixture({
        valid: true,
        claims: {},
        issuerLineage: [{ slug: 'moi-immigration', nameI18n: undefined }],
      }),
    );
    const slugNode = screen.getByText('moi-immigration');
    expect(slugNode).toHaveClass('ltr-embed');
  });
});
