import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import * as api from '../api';
import { printRecoveryCodes } from '../printRecoveryCodes';
import { TotpEnrollDialog } from './TotpEnrollDialog';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

vi.mock('../printRecoveryCodes', () => ({
  printRecoveryCodes: vi.fn(),
}));

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onClose = vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TotpEnrollDialog onClose={onClose} />
      </QueryClientProvider>
    </I18nextProvider>,
  );
  return { onClose };
}

describe('TotpEnrollDialog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('walks through generate -> QR/manual secret -> confirm -> recovery codes', async () => {
    vi.spyOn(api, 'enrollTotp').mockResolvedValue({
      otpAuthUri: 'otpauth://totp/Khatm:op1?secret=ABC123',
      secretBase32: 'ABC123',
    });
    const confirm = vi.spyOn(api, 'confirmTotp').mockResolvedValue({
      recoveryCodes: ['code-1', 'code-2'],
    });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: i18n.t('security.totp.generateCta') }));

    expect(await screen.findByTestId('qr-code')).toHaveTextContent(
      'otpauth://totp/Khatm:op1?secret=ABC123',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('common.reveal') }));
    expect(screen.getByText('ABC123')).toBeInTheDocument();

    await user.type(screen.getByLabelText(i18n.t('security.totp.confirmCode')), '654321');
    await user.click(screen.getByRole('button', { name: i18n.t('security.totp.confirmCta') }));

    await waitFor(() => expect(confirm).toHaveBeenCalledWith({ code: '654321' }));
    expect(await screen.findByText(i18n.t('security.totp.recoveryCodesIntro'))).toBeInTheDocument();
  });

  it('prints the recovery codes once revealed', async () => {
    vi.spyOn(api, 'enrollTotp').mockResolvedValue({
      otpAuthUri: 'otpauth://totp/Khatm:op1?secret=ABC123',
      secretBase32: 'ABC123',
    });
    vi.spyOn(api, 'confirmTotp').mockResolvedValue({ recoveryCodes: ['code-1', 'code-2'] });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: i18n.t('security.totp.generateCta') }));
    await user.type(await screen.findByLabelText(i18n.t('security.totp.confirmCode')), '654321');
    await user.click(screen.getByRole('button', { name: i18n.t('security.totp.confirmCta') }));

    const revealButtons = await screen.findAllByRole('button', { name: i18n.t('common.reveal') });
    await user.click(revealButtons[revealButtons.length - 1]);
    await user.click(screen.getByRole('button', { name: i18n.t('common.print') }));

    expect(printRecoveryCodes).toHaveBeenCalledWith(
      i18n.t('security.totp.recoveryCodesPrintTitle'),
      ['code-1', 'code-2'],
    );
  });
});
