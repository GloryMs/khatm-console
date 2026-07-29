import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { LoginForm } from './LoginForm';

function renderForm(login: AuthContextValue['login'] = vi.fn()) {
  const value: AuthContextValue = {
    status: 'unauthenticated',
    user: null,
    login,
    logout: async () => undefined,
    refresh: async () => undefined,
    hasScope: () => false,
  };
  render(
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={value}>
        <LoginForm />
      </AuthContext.Provider>
    </I18nextProvider>,
  );
}

describe('LoginForm', () => {
  it('shows required-field errors and does not call login when submitted empty', async () => {
    const login = vi.fn();
    renderForm(login);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: i18n.t('auth.login.submit') }));

    expect(await screen.findByText(i18n.t('auth.login.usernameRequired'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('auth.login.passwordRequired'))).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('calls login with the entered credentials on valid submit', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderForm(login);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(i18n.t('auth.login.username')), 'admin');
    await user.type(screen.getByLabelText(i18n.t('auth.login.password')), 'secret');
    await user.click(screen.getByRole('button', { name: i18n.t('auth.login.submit') }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ username: 'admin', password: 'secret' }),
    );
  });
});
