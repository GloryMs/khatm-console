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
  user: { username: 'admin', tenantSlug: 'khatm-default' },
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

const twoKeysOnSoft: SigningKeysResponse = {
  keys: [
    {
      kid: 'khatm-default:key-2',
      state: 'ACTIVE',
      provider: 'SOFT',
      validFrom: '2026-06-01T00:00:00Z',
    },
    {
      kid: 'khatm-default:key-1',
      state: 'RETIRING',
      provider: 'SOFT',
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

describe('KeyManagementPage — provider column', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the column header and a colored badge with the raw SOFT/VAULT value, unknown falls back', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue({
      keys: [
        { kid: 'khatm-default:key-2', state: 'ACTIVE', provider: 'VAULT' },
        { kid: 'khatm-default:key-1', state: 'RETIRING', provider: 'SOFT' },
        { kid: 'khatm-default:key-0', state: 'RETIRED' },
      ],
    });
    renderPage();

    expect(await screen.findByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('VAULT')).toBeInTheDocument();
    expect(screen.getByText('SOFT')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

describe('KeyManagementPage — rotate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires typing the tenant slug exactly before rotate is armed, then rotates (kid shown informationally)', async () => {
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

    // The active kid is shown informationally, but no longer the confirm target.
    expect(
      within(dialog).getByText(i18n.t('keyManagement.rotate.activeKidLabel')).closest('p'),
    ).toHaveTextContent('khatm-default:key-2');

    // The pre-C11 confirm target (kid) is now a mismatch, not a match.
    await user.type(within(dialog).getByRole('textbox'), 'khatm-default:key-2');
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByText(i18n.t('keyManagement.rotate.mismatch'))).toBeInTheDocument();

    await user.clear(within(dialog).getByRole('textbox'));
    await user.type(within(dialog).getByRole('textbox'), 'khatm-default');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    await waitFor(() => expect(rotateSpy).toHaveBeenCalledTimes(1));
    // Default "inherit" selection — literally no provider on the call (SESSION-C10 D1).
    expect(rotateSpy).toHaveBeenCalledWith(undefined);
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

  it('disables the rotate button and explains why when the session has no tenant slug yet', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue(twoKeys);
    renderPage({ ...adminAuth, user: { username: 'admin' } });

    await screen.findByText('khatm-default:key-2'); // wait for the keys query to resolve
    const cta = screen.getByRole('button', { name: i18n.t('keyManagement.rotate.cta') });
    expect(cta).toBeDisabled();
    expect(cta).toHaveAttribute('title', i18n.t('keyManagement.rotate.noTenantSlug'));
  });
});

describe('KeyManagementPage — rotate provider switch (SESSION-C10)', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage('en');
  });

  it('defaults to "inherit", shows the current provider, and hides the warning until an explicit different provider is chosen', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue(twoKeysOnSoft);
    vi.spyOn(api, 'rotateSigningKey').mockResolvedValue({
      kid: 'khatm-default:key-3',
      state: 'ACTIVE',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: i18n.t('keyManagement.rotate.cta') }),
    );
    const dialog = screen.getByRole('dialog');

    // Current provider shown, "inherit" is the default selection.
    const currentRow = within(dialog)
      .getByText(i18n.t('keyManagement.rotate.provider.currentLabel'))
      .closest('p');
    expect(currentRow).toHaveTextContent('SOFT');
    expect(
      within(dialog).getByRole('radio', {
        name: i18n.t('keyManagement.rotate.provider.inheritOption'),
      }),
    ).toBeChecked();
    expect(
      screen.queryByText(i18n.t('keyManagement.rotate.provider.warningToVault')),
    ).not.toBeInTheDocument();

    // Explicitly picking the provider already in use is not a "switch" — no warning.
    await user.click(within(dialog).getByRole('radio', { name: 'SOFT' }));
    expect(
      screen.queryByText(i18n.t('keyManagement.rotate.provider.warningToVault')),
    ).not.toBeInTheDocument();

    // Picking a genuinely different provider shows the fail-closed warning.
    await user.click(within(dialog).getByRole('radio', { name: 'VAULT' }));
    expect(
      screen.getByText(i18n.t('keyManagement.rotate.provider.warningToVault')),
    ).toBeInTheDocument();

    // Back to inherit — warning clears again.
    await user.click(
      within(dialog).getByRole('radio', {
        name: i18n.t('keyManagement.rotate.provider.inheritOption'),
      }),
    );
    expect(
      screen.queryByText(i18n.t('keyManagement.rotate.provider.warningToVault')),
    ).not.toBeInTheDocument();
  });

  it('shows the rollback warning switching away from VAULT, and sends the exact chosen provider on confirm', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue({
      keys: [{ kid: 'khatm-default:key-2', state: 'ACTIVE', provider: 'VAULT' }],
    });
    const rotateSpy = vi.spyOn(api, 'rotateSigningKey').mockResolvedValue({
      kid: 'khatm-default:key-3',
      state: 'ACTIVE',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: i18n.t('keyManagement.rotate.cta') }),
    );
    const dialog = screen.getByRole('dialog');

    await user.click(within(dialog).getByRole('radio', { name: 'SOFT' }));
    expect(
      screen.getByText(i18n.t('keyManagement.rotate.provider.warningFromVault')),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(i18n.t('keyManagement.rotate.provider.warningToVault')),
    ).not.toBeInTheDocument();

    await user.type(within(dialog).getByRole('textbox'), 'khatm-default');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('keyManagement.rotate.confirm') }),
    );

    await waitFor(() => expect(rotateSpy).toHaveBeenCalledWith('SOFT'));
  });

  it('renders the current-provider label and switch warning in Arabic', async () => {
    vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue(twoKeysOnSoft);
    vi.spyOn(api, 'rotateSigningKey').mockResolvedValue({
      kid: 'khatm-default:key-3',
      state: 'ACTIVE',
    });
    await i18n.changeLanguage('ar');
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', {
        name: i18n.t('keyManagement.rotate.cta', { lng: 'ar' }),
      }),
    );
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByText(i18n.t('keyManagement.rotate.provider.currentLabel', { lng: 'ar' })),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('radio', { name: 'VAULT' }));
    expect(
      screen.getByText(i18n.t('keyManagement.rotate.provider.warningToVault', { lng: 'ar' })),
    ).toBeInTheDocument();
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
