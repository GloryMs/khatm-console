import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { queryClient } from '@/api/queryClient';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequireScope } from '@/features/auth/RequireScope';
import i18n from '@/i18n';

vi.mock('@/features/issuance/IssuePage', () => ({
  IssuePage: () => <h1>Issue route content</h1>,
}));

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

function renderIssueRoute(auth: AuthContextValue) {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={['/issue']}>
            <Routes>
              <Route path="/login" element={<p>login</p>} />
              <Route element={<RequireAuth />}>
                <Route
                  path="/issue"
                  element={
                    <RequireScope scope="issue">
                      <h1>Issue route content</h1>
                    </RequireScope>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('/issue route scope gate', () => {
  it('renders no-permission when the issue scope is missing', () => {
    renderIssueRoute(baseAuth);
    expect(screen.queryByText('Issue route content')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });

  it('renders the issue route when the issue scope is present', () => {
    renderIssueRoute({ ...baseAuth, hasScope: (scope) => scope === 'issue' });
    expect(screen.getByText('Issue route content')).toBeInTheDocument();
  });
});
