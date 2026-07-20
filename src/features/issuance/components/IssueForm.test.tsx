import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { parseClaimsDef, type ClaimField } from '../claimsDef';
import { IssueForm, type IssueFormValues } from './IssueForm';

const FIXTURE = JSON.stringify({
  result: { type: 'string', required: true, label_i18n: { en: 'Result', ar: 'النتيجة' } },
  caseNumber: {
    type: 'string',
    required: false,
    label_i18n: { en: 'Case number', ar: 'رقم القضية' },
  },
  issuedAt: { type: 'date', required: false, label_i18n: { en: 'Issued at', ar: 'تاريخ' } },
  score: { type: 'number', required: true, label_i18n: { en: 'Score', ar: 'درجة' } },
  location: { type: 'geopoint', required: false, label_i18n: { en: 'Location', ar: 'موقع' } },
});

function fields(): ClaimField[] {
  return parseClaimsDef(FIXTURE).fields;
}

function renderForm(
  onSubmit: (v: IssueFormValues) => void = vi.fn(),
  options: { defaults?: { maxUses?: string; validMinutes?: string }; sdFields?: string[] } = {},
) {
  render(
    <I18nextProvider i18n={i18n}>
      <IssueForm
        fields={fields()}
        defaults={options.defaults}
        sdFields={options.sdFields}
        onSubmit={onSubmit}
      />
    </I18nextProvider>,
  );
  return onSubmit;
}

describe('IssueForm (dynamic generation from claims_def)', () => {
  it('renders one input per claim field, labeled from label_i18n in the active language', () => {
    renderForm();
    expect(screen.getByLabelText('Result')).toBeInTheDocument();
    expect(screen.getByLabelText('Case number')).toBeInTheDocument();
    expect(screen.getByLabelText('Issued at')).toBeInTheDocument();
    expect(screen.getByLabelText('Score')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
  });

  it('renders number and date inputs for those types, text for everything else', () => {
    renderForm();
    expect(screen.getByLabelText('Score')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Issued at')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('Result')).toHaveAttribute('type', 'text');
    // Unknown type 'geopoint' falls back to text rather than crashing.
    expect(screen.getByLabelText('Location')).toHaveAttribute('type', 'text');
  });

  it('badges required fields and real selectively-disclosable fields distinctly', () => {
    renderForm(vi.fn(), { sdFields: ['caseNumber'] });
    const resultField = screen.getByLabelText('Result').parentElement;
    const caseField = screen.getByLabelText('Case number').parentElement;
    const issuedAtField = screen.getByLabelText('Issued at').parentElement;
    expect(resultField).toHaveTextContent(i18n.t('issue.requiredField'));
    expect(caseField).toHaveTextContent(i18n.t('issue.selectiveDisclosure'));
    expect(issuedAtField).not.toHaveTextContent(i18n.t('issue.selectiveDisclosure'));
  });

  it('prefills max uses and validity from schema defaults', () => {
    renderForm(vi.fn(), { defaults: { maxUses: '3', validMinutes: '60' } });
    expect(screen.getByLabelText(i18n.t('issue.maxUses'))).toHaveValue(3);
    expect(screen.getByLabelText(i18n.t('issue.validMinutes'))).toHaveValue(60);
  });

  it('blocks submit and shows required errors when mandatory fields are empty', async () => {
    const onSubmit = renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: i18n.t('issue.submit') }));

    expect(await screen.findByText(i18n.t('issue.holderRefRequired'))).toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('issue.fieldRequired', { field: 'Result' })),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the holder ref and the claims map keyed by field name on a valid form', async () => {
    const onSubmit = renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(i18n.t('issue.holderRef')), 'holder-001');
    await user.type(screen.getByLabelText('Result'), 'NO_RECORD');
    await user.type(screen.getByLabelText('Score'), '88');
    await user.click(screen.getByRole('button', { name: i18n.t('issue.submit') }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const values = (onSubmit as ReturnType<typeof vi.fn>).mock.calls[0][0] as IssueFormValues;
    expect(values.holderRef).toBe('holder-001');
    expect(values.claims).toEqual({
      result: 'NO_RECORD',
      caseNumber: '',
      issuedAt: '',
      score: '88',
      location: '',
    });
  });
});
