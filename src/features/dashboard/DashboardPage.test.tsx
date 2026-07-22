import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { DashboardPage } from './DashboardPage';
import * as api from './api';
import type { StatsResponse } from './api';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

const fullStats: StatsResponse = {
  window: { from: '2026-06-22T12:00:00Z', to: '2026-07-22T12:00:00Z' },
  counters: {
    issued: 1234,
    claimsRedeemed: 900,
    consumed: 800,
    verifyOk: 700,
    revoked: 3,
    consumeDenied: 2,
    verifyFailed: 1,
  },
};

describe('DashboardPage', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage('en');
  });

  it('renders every counter with localized formatting', async () => {
    vi.spyOn(api, 'getStats').mockResolvedValue(fullStats);
    renderPage();

    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('700')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders Arabic-Indic digit grouping in the Arabic locale', async () => {
    vi.spyOn(api, 'getStats').mockResolvedValue(fullStats);
    await i18n.changeLanguage('ar');
    renderPage();

    expect(await screen.findByText(new Intl.NumberFormat('ar').format(1234))).toBeInTheDocument();
  });

  it('renders every optional counter as 0 when the response omits them, never crashing', async () => {
    vi.spyOn(api, 'getStats').mockResolvedValue({ window: fullStats.window, counters: {} });
    renderPage();

    await waitFor(() => expect(api.getStats).toHaveBeenCalled());
    expect(screen.getAllByText('0')).toHaveLength(7);
  });

  it('renders as defensively zeroed even when the counters object itself is missing', async () => {
    vi.spyOn(api, 'getStats').mockResolvedValue({ window: fullStats.window });
    renderPage();

    await waitFor(() => expect(api.getStats).toHaveBeenCalled());
    expect(screen.getAllByText('0')).toHaveLength(7);
  });

  it('requests a 30-day window by default and switches to 7 days on toggle', async () => {
    const getStats = vi.spyOn(api, 'getStats').mockResolvedValue(fullStats);
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(getStats).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: expect.any(String),
        }),
      ),
    );
    const [initialParams] = getStats.mock.calls[0];
    const initialSpanMs =
      new Date(initialParams.to as string).getTime() -
      new Date(initialParams.from as string).getTime();
    expect(Math.round(initialSpanMs / (24 * 60 * 60 * 1000))).toBe(30);

    await user.click(
      screen.getByRole('button', { name: i18n.t('dashboard.windowDays', { count: 7 }) }),
    );

    await waitFor(() => expect(getStats).toHaveBeenCalledTimes(2));
    const [secondParams] = getStats.mock.calls[1];
    const secondSpanMs =
      new Date(secondParams.to as string).getTime() -
      new Date(secondParams.from as string).getTime();
    expect(Math.round(secondSpanMs / (24 * 60 * 60 * 1000))).toBe(7);
  });

  it('re-fetches when the refresh button is clicked', async () => {
    const getStats = vi.spyOn(api, 'getStats').mockResolvedValue(fullStats);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(getStats).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: i18n.t('dashboard.refresh') }));

    await waitFor(() => expect(getStats).toHaveBeenCalledTimes(2));
  });
});
