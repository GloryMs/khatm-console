import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import * as api from './api';
import { SecuritySettingsPage } from './SecuritySettingsPage';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <SecuritySettingsPage />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('SecuritySettingsPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens the enroll dialog from the enroll/re-enroll action', async () => {
    vi.spyOn(api, 'enrollTotp').mockResolvedValue({
      otpAuthUri: 'otpauth://totp/Khatm:op1?secret=ABC123',
      secretBase32: 'ABC123',
    });
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText(i18n.t('security.totp.statusUnknown'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: i18n.t('security.totp.enrollCta') }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
