import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { ApiError } from '@/api/errors';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import * as authApi from '../api';
import { ChangePasswordForm } from './ChangePasswordForm';

function renderForm(refresh: AuthContextValue['refresh'] = vi.fn().mockResolvedValue(undefined)) {
  const value: AuthContextValue = {
    status: 'authenticated',
    user: { username: 'op1', scopes: [], mustChangePassword: true },
    login: async () => undefined,
    completeTotpLogin: async () => undefined,
    logout: async () => undefined,
    refresh,
    hasScope: () => false,
  };
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={['/change-password']}>
          <Routes>
            <Route path="/change-password" element={<ChangePasswordForm />} />
            <Route path="/" element={<div>landed on the app</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nextProvider>,
  );
}

describe('ChangePasswordForm', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows a mismatch error and does not submit when the passwords differ', async () => {
    const changeMyPassword = vi.spyOn(authApi, 'changeMyPassword');
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByLabelText(i18n.t('auth.changePassword.currentPassword')),
      'temp-pass-1',
    );
    await user.type(screen.getByLabelText(i18n.t('auth.changePassword.newPassword')), 'newpass123');
    await user.type(
      screen.getByLabelText(i18n.t('auth.changePassword.confirmPassword')),
      'different123',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('auth.changePassword.submit') }));

    expect(await screen.findByText(i18n.t('auth.changePassword.mismatch'))).toBeInTheDocument();
    expect(changeMyPassword).not.toHaveBeenCalled();
  });

  it('submits, refreshes the session, and navigates to the app on success', async () => {
    const changeMyPassword = vi.spyOn(authApi, 'changeMyPassword').mockResolvedValue(undefined);
    const refresh = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm(refresh);

    await user.type(
      screen.getByLabelText(i18n.t('auth.changePassword.currentPassword')),
      'temp-pass-1',
    );
    await user.type(screen.getByLabelText(i18n.t('auth.changePassword.newPassword')), 'newpass123');
    await user.type(
      screen.getByLabelText(i18n.t('auth.changePassword.confirmPassword')),
      'newpass123',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('auth.changePassword.submit') }));

    await waitFor(() =>
      expect(changeMyPassword).toHaveBeenCalledWith({
        currentPassword: 'temp-pass-1',
        newPassword: 'newpass123',
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(await screen.findByText('landed on the app')).toBeInTheDocument();
  });

  it('shows the resolved API error when the current password is wrong', async () => {
    vi.spyOn(authApi, 'changeMyPassword').mockRejectedValue(
      new ApiError(400, { code: 'KH-USR-0400', message: 'Current password incorrect' }),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByLabelText(i18n.t('auth.changePassword.currentPassword')),
      'wrong-pass',
    );
    await user.type(screen.getByLabelText(i18n.t('auth.changePassword.newPassword')), 'newpass123');
    await user.type(
      screen.getByLabelText(i18n.t('auth.changePassword.confirmPassword')),
      'newpass123',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('auth.changePassword.submit') }));

    expect(await screen.findByText('Current password incorrect')).toBeInTheDocument();
  });
});
