import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import type { VerifyResponse } from '../api';
import { VerifyResult } from './VerifyResult';

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
});
