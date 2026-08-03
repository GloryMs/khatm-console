import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { ApiError } from '@/api/errors';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import { KeyManagementPage } from './KeyManagementPage';
import * as api from './api';
import type { SigningKeysResponse } from './api';

const adminAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => true,
};

function renderPage(auth: AuthContextValue = adminAuth) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={auth}>
        <QueryClientProvider client={queryClient}>
          <KeyManagementPage />
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nextProvider>,
  );
}

const twoKeys: SigningKeysResponse = {
  keys: [
    { kid: 'khatm-default:key-2', state: 'ACTIVE', validFrom: '2026-06-01T00:00:00Z' },
    {
      kid: 'khatm-default:key-1',
      state: 'RETIRING',
      validFrom: '2026-01-01T00:00:00Z',
      validTo: '2026-06-01T00:00:00Z',
    },
  ],
};

describe('KeyManagementPage — scope gate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a no-permission state and never fetches without key:manage', () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue(twoKeys);
    renderPage({ ...adminAuth, hasScope: () => false });

    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
    expect(api.getSigningKeyStatuses).not.toHaveBeenCalled();
  });
});

describe('KeyManagementPage — rotate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires typing the current active key id exactly before rotate is armed, then rotates', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue(twoKeys);
    const rotateSpy = vi.spyOn(api, 'rotateSigningKey').mockResolvedValue({
      kid: 'khatm-default:key-3',
      state: 'ACTIVE',
      validFrom: '2026-08-03T00:00:00Z',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: i18n.t('keyManagement.rotate.cta') }),
    );
    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', {
      name: i18n.t('keyManagement.rotate.confirm'),
    });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByRole('textbox'), 'wrong-kid');
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByText(i18n.t('keyManagement.rotate.mismatch'))).toBeInTheDocument();

    await user.clear(within(dialog).getByRole('textbox'));
    await user.type(within(dialog).getByRole('textbox'), 'khatm-default:key-2');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    await waitFor(() => expect(rotateSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('disables the rotate button when there is no active key to rotate', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue({
      keys: [{ kid: 'khatm-default:key-1', state: 'RETIRED', validFrom: '2025-01-01T00:00:00Z' }],
    });
    renderPage();

    expect(
      await screen.findByRole('button', { name: i18n.t('keyManagement.rotate.cta') }),
    ).toBeDisabled();
  });
});

describe('KeyManagementPage — retire', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a Retire action only on RETIRING keys and retires without force on the happy path', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue(twoKeys);
    const retireSpy = vi.spyOn(api, 'retireSigningKey').mockResolvedValue({
      kid: 'khatm-default:key-1',
      state: 'RETIRED',
      validTo: '2026-06-01T00:00:00Z',
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('khatm-default:key-1');
    const retireButtons = screen.getAllByRole('button', {
      name: i18n.t('keyManagement.retireCta'),
    });
    expect(retireButtons).toHaveLength(1);

    await user.click(retireButtons[0]);
    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('keyManagement.retire.confirm') }),
    );

    await waitFor(() =>
      expect(retireSpy).toHaveBeenCalledWith('khatm-default:key-1', { force: false }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('explains KH-KEY-0422 inline and requires a second, severe confirm before forcing', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue(twoKeys);
    const retireSpy = vi
      .spyOn(api, 'retireSigningKey')
      .mockRejectedValueOnce(
        new ApiError(422, {
          code: 'KH-KEY-0422',
          message: 'Key has not reached the minimum retiring age yet.',
        }),
      )
      .mockResolvedValueOnce({
        kid: 'khatm-default:key-1',
        state: 'RETIRED',
        validTo: '2026-06-01T00:00:00Z',
      });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('khatm-default:key-1');
    await user.click(screen.getByRole('button', { name: i18n.t('keyManagement.retireCta') }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: i18n.t('keyManagement.retire.confirm'),
      }),
    );

    expect(
      await screen.findByText(i18n.t('keyManagement.retire.blocked.title')),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Key has not reached the minimum retiring age yet.'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: i18n.t('keyManagement.retire.blocked.forceCta') }),
    );
    expect(
      screen.getByText(i18n.t('keyManagement.retire.force.title'), { exact: false }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: i18n.t('keyManagement.retire.force.confirm') }),
    );

    await waitFor(() => expect(retireSpy).toHaveBeenCalledTimes(2));
    expect(retireSpy).toHaveBeenNthCalledWith(2, 'khatm-default:key-1', { force: true });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
