import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { RequireScope } from './RequireScope';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

function renderWithAuth(value: AuthContextValue, children: ReactNode) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </I18nextProvider>,
  );
}

describe('RequireScope', () => {
  it('renders children when the user has the required scope', () => {
    renderWithAuth(
      { ...baseAuth, hasScope: (scope) => scope === 'schema:write' },
      <RequireScope scope="schema:write">
        <p>protected content</p>
      </RequireScope>,
    );
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('renders a localized no-permission state when the scope is missing', () => {
    renderWithAuth(
      baseAuth,
      <RequireScope scope="schema:write">
        <p>protected content</p>
      </RequireScope>,
    );
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
