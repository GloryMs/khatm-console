import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as api from './api';
import { SecuritySettingsPage } from './SecuritySettingsPage';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: { username: 'op1' },
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => true,
};

function renderPage(totpEnabled: boolean | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={{ ...baseAuth, user: { ...baseAuth.user, totpEnabled } }}>
        <QueryClientProvider client={queryClient}>
          <SecuritySettingsPage />
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nextProvider>,
  );
}

describe('SecuritySettingsPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows a checking status and no CTA while totpEnabled is not yet known', () => {
    renderPage(undefined);

    expect(screen.getByText(i18n.t('security.totp.statusChecking'))).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: i18n.t('security.totp.enrollCta') }),
    ).not.toBeInTheDocument();
  });

  it('shows the Disabled status and opens the enroll dialog when totpEnabled is false', async () => {
    vi.spyOn(api, 'enrollTotp').mockResolvedValue({
      otpAuthUri: 'otpauth://totp/Khatm:op1?secret=ABC123',
      secretBase32: 'ABC123',
    });
    const user = userEvent.setup();
    renderPage(false);

    expect(screen.getByText(i18n.t('security.totp.statusDisabled'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: i18n.t('security.totp.enrollCta') }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the Enabled status and no enroll CTA when totpEnabled is true, pointing to admin reset instead', () => {
    renderPage(true);

    expect(screen.getByText(i18n.t('security.totp.statusEnabled'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('security.totp.resetByAdmin'))).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: i18n.t('security.totp.enrollCta') }),
    ).not.toBeInTheDocument();
  });

  it('renders the status and reset copy in Arabic', async () => {
    await i18n.changeLanguage('ar');
    renderPage(true);

    expect(
      screen.getByText(i18n.t('security.totp.statusEnabled', { lng: 'ar' })),
    ).toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('security.totp.resetByAdmin', { lng: 'ar' })),
    ).toBeInTheDocument();

    await i18n.changeLanguage('en');
  });
});
