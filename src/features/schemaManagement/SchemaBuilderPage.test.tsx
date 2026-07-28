import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as schemasApi from '@/features/schemas/api';
import { SchemaBuilderPage } from './SchemaBuilderPage';

const adminAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: (scope) => scope === 'schema:manage',
};

const publishedDetail: schemasApi.SchemaDetail = {
  id: 'pub-1',
  code: 'CriminalRecord/v1',
  version: 1,
  status: 'PUBLISHED',
  nameI18n: { en: 'Criminal record', ar: 'السجل الجنائي' },
  defaultMaxUses: 3,
  defaultValidity: 'P2DT3H',
  sdFields: ['caseNumber'],
  claimsDefJson: JSON.stringify({
    result: { type: 'string', required: true, label_i18n: { en: 'Result', ar: 'النتيجة' } },
    caseNumber: {
      type: 'string',
      required: false,
      label_i18n: { en: 'Case number', ar: 'رقم القضية' },
    },
  }),
};

function renderVersionPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={adminAuth}>
          <MemoryRouter initialEntries={['/schemas/manage/pub-1/version']}>
            <Routes>
              <Route
                path="/schemas/manage/:id/version"
                element={<SchemaBuilderPage mode="version" />}
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('SchemaBuilderPage version-prefill mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('prefills the builder from the source PUBLISHED schema, marking sdFields as selective', async () => {
    vi.spyOn(schemasApi, 'getSchema').mockResolvedValue(publishedDetail);
    renderVersionPage();

    expect(await screen.findByLabelText(i18n.t('schemaManagement.builder.nameEn'))).toHaveValue(
      'Criminal record',
    );
    expect(screen.getByLabelText(i18n.t('schemaManagement.builder.nameAr'))).toHaveValue(
      'السجل الجنائي',
    );
    expect(screen.getByLabelText(i18n.t('schemaManagement.builder.code'))).toHaveValue(
      'CriminalRecord/v1',
    );
    expect(screen.getByLabelText(i18n.t('schemaManagement.builder.defaultMaxUses'))).toHaveValue(3);
    expect(
      screen.getByLabelText(i18n.t('schemaManagement.builder.defaultValidityDays')),
    ).toHaveValue(2);
    expect(
      screen.getByLabelText(i18n.t('schemaManagement.builder.defaultValidityHours')),
    ).toHaveValue(3);

    const nameInputs = screen.getAllByLabelText(i18n.t('schemaManagement.builder.fieldName'));
    expect(nameInputs.map((el) => (el as HTMLInputElement).value)).toEqual([
      'result',
      'caseNumber',
    ]);
    const selectiveToggles = screen.getAllByLabelText(
      i18n.t('schemaManagement.builder.fieldSelective'),
    );
    expect((selectiveToggles[0] as HTMLInputElement).checked).toBe(false);
    expect((selectiveToggles[1] as HTMLInputElement).checked).toBe(true);
  });
});
