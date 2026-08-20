import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import * as orgApi from './api';
import { OrgPage } from './OrgPage';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  completeTotpLogin: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

const orgAdminAuth: AuthContextValue = {
  ...baseAuth,
  hasScope: (scope) => scope === 'org:admin',
};

const child: orgApi.TenantRef = {
  id: 'child-1',
  slug: 'moi-immigration',
  nameI18n: { en: 'Immigration & Passports', ar: 'الهجرة والجوازات' },
  status: 'ACTIVE',
  active: true,
};

const suspendedChild: orgApi.TenantRef = {
  id: 'child-2',
  slug: 'moi-security',
  nameI18n: { en: 'Criminal Security', ar: 'الأمن الجنائي' },
  status: 'SUSPENDED',
  active: false,
};

const emptyReport: orgApi.OrgReportView = {
  children: [],
  rollup: { issued: 0, consumed: 0, revoked: 0, verifyOk: 0, verifyFailed: 0 },
  window: { from: '2026-08-01T00:00:00Z', to: '2026-08-19T00:00:00Z' },
};

function renderPage(auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={['/org']}>
            <Routes>
              <Route path="/org" element={<OrgPage />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('OrgPage scope gating', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders no-permission without the org:admin scope', () => {
    renderPage(baseAuth);
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('errors.noPermission.title'));
  });
});

describe('OrgPage children list', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists direct children with the org:admin scope', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child, suspendedChild]);
    vi.spyOn(orgApi, 'fetchOrgReports').mockResolvedValue(emptyReport);
    renderPage(orgAdminAuth);

    expect(await screen.findByText('Immigration & Passports')).toBeInTheDocument();
    expect(screen.getByText('Criminal Security')).toBeInTheDocument();
  });

  it('shows the empty state when the caller has no children', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([]);
    vi.spyOn(orgApi, 'fetchOrgReports').mockResolvedValue(emptyReport);
    renderPage(orgAdminAuth);

    expect(await screen.findByText(i18n.t('org.children.empty'))).toBeInTheDocument();
  });
});

describe('OrgPage suspend / activate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('suspends a child only after typing its exact slug to confirm', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    vi.spyOn(orgApi, 'fetchOrgReports').mockResolvedValue(emptyReport);
    const suspend = vi.spyOn(orgApi, 'suspendChild').mockResolvedValue({});
    const user = userEvent.setup();
    renderPage(orgAdminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('org.children.actionSuspend') }),
    );
    const dialog = screen.getByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', {
      name: i18n.t('org.suspendConfirm.confirm'),
    });
    expect(confirmButton).toBeDisabled();

    await user.type(within(dialog).getByRole('textbox'), 'wrong-slug');
    expect(confirmButton).toBeDisabled();
    expect(suspend).not.toHaveBeenCalled();

    await user.clear(within(dialog).getByRole('textbox'));
    await user.type(within(dialog).getByRole('textbox'), 'moi-immigration');
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);

    await waitFor(() => expect(suspend).toHaveBeenCalledWith('child-1'));
  });

  it('reactivates a suspended child after a plain confirm', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([suspendedChild]);
    vi.spyOn(orgApi, 'fetchOrgReports').mockResolvedValue(emptyReport);
    const activate = vi.spyOn(orgApi, 'activateChild').mockResolvedValue({});
    const user = userEvent.setup();
    renderPage(orgAdminAuth);

    await user.click(
      await screen.findByRole('button', { name: i18n.t('org.children.actionActivate') }),
    );
    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('org.activateConfirm.confirm') }),
    );

    await waitFor(() => expect(activate).toHaveBeenCalledWith('child-2'));
  });
});

describe('OrgPage aggregated reports', () => {
  afterEach(() => vi.restoreAllMocks());

  it('defaults to the "this month" window and shows the rollup + per-child counters', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([child]);
    const fetchReports = vi.spyOn(orgApi, 'fetchOrgReports').mockResolvedValue({
      children: [
        {
          tenantId: 'child-1',
          tenantSlug: 'moi-immigration',
          nameI18n: { en: 'Immigration & Passports', ar: 'الهجرة والجوازات' },
          counters: { issued: 12, consumed: 4, revoked: 1, verifyOk: 20, verifyFailed: 2 },
        },
      ],
      rollup: { issued: 12, consumed: 4, revoked: 1, verifyOk: 20, verifyFailed: 2 },
      window: { from: '2026-08-01T00:00:00Z', to: '2026-08-19T00:00:00Z' },
    });
    renderPage(orgAdminAuth);

    expect(await screen.findAllByText('12')).not.toHaveLength(0);
    await waitFor(() => expect(fetchReports).toHaveBeenCalled());
    expect(
      screen.getByRole('button', { name: i18n.t('org.reports.window.month') }),
    ).toHaveAttribute('aria-pressed', 'true');

    // Regression guard: computeOrgReportWindow's `to` defaults to `new Date()`, so an
    // unmemoized call in the render body produces a fresh query key (and a fresh fetch) on
    // every render — an infinite fetch loop caught live against the real backend. A settled
    // panel must have fetched exactly once for the still-selected "month" window, not
    // repeatedly.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(fetchReports).toHaveBeenCalledTimes(1);
  });

  it('shows a clean empty state when the parent has no children to report on', async () => {
    vi.spyOn(orgApi, 'listChildren').mockResolvedValue([]);
    vi.spyOn(orgApi, 'fetchOrgReports').mockResolvedValue(emptyReport);
    renderPage(orgAdminAuth);

    expect(await screen.findByText(i18n.t('org.reports.emptyChildren'))).toBeInTheDocument();
  });
});
