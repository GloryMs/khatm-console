import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '../AuthContext';
import { TotpChallengeForm } from './TotpChallengeForm';

function renderForm(completeTotpLogin: AuthContextValue['completeTotpLogin'] = vi.fn()) {
  const value: AuthContextValue = {
    status: 'unauthenticated',
    user: null,
    login: async () => undefined,
    completeTotpLogin,
    logout: async () => undefined,
    refresh: async () => undefined,
    hasScope: () => false,
  };
  const onBack = vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={value}>
        <TotpChallengeForm challengeId="challenge-1" onBack={onBack} />
      </AuthContext.Provider>
    </I18nextProvider>,
  );
  return { onBack };
}

describe('TotpChallengeForm', () => {
  it('submits the challengeId with the entered code', async () => {
    const completeTotpLogin = vi.fn().mockResolvedValue(undefined);
    renderForm(completeTotpLogin);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(i18n.t('auth.totpChallenge.code')), '123456');
    await user.click(screen.getByRole('button', { name: i18n.t('auth.totpChallenge.submit') }));

    await waitFor(() =>
      expect(completeTotpLogin).toHaveBeenCalledWith({
        challengeId: 'challenge-1',
        code: '123456',
      }),
    );
  });

  it('switches to recovery-code entry and submits recoveryCode instead of code', async () => {
    const completeTotpLogin = vi.fn().mockResolvedValue(undefined);
    renderForm(completeTotpLogin);
    const user = userEvent.setup();

    await user.click(
      screen.getByRole('button', { name: i18n.t('auth.totpChallenge.useRecoveryInstead') }),
    );
    await user.type(
      screen.getByLabelText(i18n.t('auth.totpChallenge.recoveryCode')),
      'recovery-code-1',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('auth.totpChallenge.submit') }));

    await waitFor(() =>
      expect(completeTotpLogin).toHaveBeenCalledWith({
        challengeId: 'challenge-1',
        recoveryCode: 'recovery-code-1',
      }),
    );
  });

  it('calls onBack when the back button is clicked', async () => {
    const { onBack } = renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: i18n.t('auth.totpChallenge.back') }));
    expect(onBack).toHaveBeenCalled();
  });
});
