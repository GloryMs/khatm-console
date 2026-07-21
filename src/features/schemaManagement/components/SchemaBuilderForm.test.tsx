import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { emptyRow } from '../claimsBuilder';
import { SchemaBuilderForm, type SchemaBuilderFormValues } from './SchemaBuilderForm';

function blankValues(): SchemaBuilderFormValues {
  return {
    code: '',
    nameEn: '',
    nameAr: '',
    defaultMaxUses: '',
    defaultValidityDays: '',
    defaultValidityHours: '',
    rows: [emptyRow()],
  };
}

function renderForm(
  mode: 'create' | 'edit' | 'version' = 'create',
  defaultValues: SchemaBuilderFormValues = blankValues(),
  onSubmit: (v: SchemaBuilderFormValues) => void = vi.fn(),
) {
  render(
    <I18nextProvider i18n={i18n}>
      <SchemaBuilderForm mode={mode} defaultValues={defaultValues} onSubmit={onSubmit} />
    </I18nextProvider>,
  );
  return onSubmit;
}

describe('SchemaBuilderForm', () => {
  it('requires the schema code only in create mode', async () => {
    const onSubmit = renderForm('create');
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: i18n.t('schemaManagement.builder.submitCreate') }),
    );
    expect(
      await screen.findByText(i18n.t('schemaManagement.builder.codeRequired')),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the code read-only (not an input) in edit mode', () => {
    renderForm('edit', { ...blankValues(), code: 'CriminalRecord/v1' });
    const codeField = screen.getByLabelText(i18n.t('schemaManagement.builder.code'));
    expect(codeField).toBeDisabled();
    expect(codeField).toHaveValue('CriminalRecord/v1');
  });

  it('blocks submit when a claim label is missing in one language (both-language validation)', async () => {
    const onSubmit = renderForm('create', {
      ...blankValues(),
      code: 'X/v1',
      nameEn: 'X',
      nameAr: 'اكس',
      rows: [{ name: 'result', type: 'text', labelEn: 'Result', labelAr: '', selective: false }],
    });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: i18n.t('schemaManagement.builder.submitCreate') }),
    );

    expect(
      await screen.findAllByText(i18n.t('schemaManagement.builder.labelRequired')),
    ).not.toHaveLength(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks submit when the schema name is missing in one language', async () => {
    const onSubmit = renderForm('create', {
      ...blankValues(),
      code: 'X/v1',
      nameEn: 'X',
      nameAr: '',
      rows: [
        { name: 'result', type: 'text', labelEn: 'Result', labelAr: 'نتيجة', selective: false },
      ],
    });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: i18n.t('schemaManagement.builder.submitCreate') }),
    );

    expect(
      await screen.findByText(i18n.t('schemaManagement.builder.nameRequired')),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires at least one claim field row', async () => {
    const onSubmit = renderForm('create', {
      ...blankValues(),
      code: 'X/v1',
      nameEn: 'X',
      nameAr: 'اكس',
      rows: [],
    });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: i18n.t('schemaManagement.builder.submitCreate') }),
    );

    expect(
      await screen.findByText(i18n.t('schemaManagement.builder.atLeastOneField')),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('adds and removes rows, and submits a valid form with the resulting rows', async () => {
    const onSubmit = renderForm('create');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(i18n.t('schemaManagement.builder.code')), 'X/v1');
    await user.type(screen.getByLabelText(i18n.t('schemaManagement.builder.nameEn')), 'X schema');
    await user.type(screen.getByLabelText(i18n.t('schemaManagement.builder.nameAr')), 'مخطط اكس');

    await user.click(
      screen.getByRole('button', { name: i18n.t('schemaManagement.builder.addField') }),
    );
    const nameInputs = screen.getAllByLabelText(i18n.t('schemaManagement.builder.fieldName'));
    expect(nameInputs).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', {
      name: i18n.t('schemaManagement.builder.removeField'),
    });
    await user.click(removeButtons[1]);
    expect(screen.getAllByLabelText(i18n.t('schemaManagement.builder.fieldName'))).toHaveLength(1);

    await user.type(screen.getByLabelText(i18n.t('schemaManagement.builder.fieldName')), 'result');
    await user.type(
      screen.getByLabelText(i18n.t('schemaManagement.builder.fieldLabelEn')),
      'Result',
    );
    await user.type(
      screen.getByLabelText(i18n.t('schemaManagement.builder.fieldLabelAr')),
      'النتيجة',
    );
    await user.click(screen.getByLabelText(i18n.t('schemaManagement.builder.fieldSelective')));

    await user.click(
      screen.getByRole('button', { name: i18n.t('schemaManagement.builder.submitCreate') }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const values = (onSubmit as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as SchemaBuilderFormValues;
    expect(values.code).toBe('X/v1');
    expect(values.rows).toEqual([
      { name: 'result', type: 'text', labelEn: 'Result', labelAr: 'النتيجة', selective: true },
    ]);
  });
});
