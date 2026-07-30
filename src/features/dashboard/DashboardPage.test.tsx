import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import { DashboardPage } from './DashboardPage';
import * as api from './api';
import type {
  ActivityResponse,
  AttentionResponse,
  ConsumingPartyStatsResponse,
  DailyStatsResponse,
  SigningKeysResponse,
  StatsResponse,
} from './api';
import * as csv from './csv';

// `detail` is an untyped JSON blob on the wire (see attention.ts) — the generated
// `Record<string, never>` shape is unusable for test fixtures, so it's cast via `unknown`.
type ActivityItemDetail = NonNullable<ActivityResponse['items']>[number]['detail'];
type AttentionItemDetail = NonNullable<AttentionResponse['items']>[number]['detail'];

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();

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
          <DashboardPage />
        </QueryClientProvider>
      </AuthContext.Provider>
    </I18nextProvider>,
  );
}

const fullStats: StatsResponse = {
  window: { from: daysAgo(30), to: daysAgo(0) },
  counters: {
    issued: 1234,
    claimsRedeemed: 567,
    consumed: 890,
    verifyOk: 456,
    revoked: 34,
    consumeDenied: 12,
    verifyFailed: 6,
  },
};

const fullDailyStats: DailyStatsResponse = {
  window: { from: daysAgo(60), to: daysAgo(0) },
  days: [
    // previous period (30-60 days ago)
    { day: daysAgo(45), counters: { issued: 10, consumed: 4, revoked: 1 } },
    // current period (0-30 days ago)
    { day: daysAgo(5), counters: { issued: 20, consumed: 9, revoked: 0 } },
  ],
};

const oneSigningKey: SigningKeysResponse = {
  keys: [
    { kid: 'khatm-default:key-1', state: 'ACTIVE', validFrom: daysAgo(3), validTo: undefined },
  ],
};

const activityFeed: ActivityResponse = {
  items: [
    {
      action: 'CREDENTIAL_ISSUED',
      actorType: 'SYSTEM',
      entityRef: 'CRI-2026-000001',
      consumingPartyCode: undefined,
      consumingPartyName: undefined,
      detail: undefined,
      occurredAt: daysAgo(1),
    },
    {
      action: 'CONSUME_SCHEMA_DENIED',
      actorType: 'API_KEY',
      entityRef: 'CEV-2026-000002',
      consumingPartyCode: 'demo-consuming-party',
      consumingPartyName: { en: 'Demo Party', ar: 'الطرف التجريبي' },
      detail: { party: 'p-1', schemaId: 's-1' } as unknown as ActivityItemDetail,
      occurredAt: daysAgo(2),
    },
  ],
};

// `detail` is an untyped JSON blob on the wire (see attention.ts) — the generated
// `Record<string, never>` type is unusable, so these fixtures cast it directly.
const attentionFeed: AttentionResponse = {
  items: [
    {
      type: 'SCHEMA_DENIED',
      occurredAt: daysAgo(2),
      detail: {
        schemaCode: 'CevilRecordSchema',
        credentialRef: 'CEV-2026-000002',
        partyCode: 'demo-consuming-party',
        partyName: { en: 'Demo Party', ar: 'الطرف التجريبي' },
      } as unknown as AttentionItemDetail,
    },
    {
      type: 'SOME_FUTURE_TYPE',
      occurredAt: daysAgo(1),
      detail: { anything: 'goes' } as unknown as AttentionItemDetail,
    },
  ],
};

// Deliberately different party names than the activity/attention fixtures above —
// a real party can appear in all three panels, but reusing the same display name
// across fixtures makes `getByText` ambiguous between panels in a single-page test.
const consumingPartyStats: ConsumingPartyStatsResponse = {
  window: { from: daysAgo(30), to: daysAgo(0) },
  parties: [
    {
      partyId: 'party-1',
      partyCode: 'acme-bank',
      partyName: { en: 'Acme Bank', ar: 'بنك أكمي' },
      consumed: 7,
      denied: 3,
      successRate: 0.7,
    },
    {
      partyId: 'party-2',
      partyCode: 'northwind',
      partyName: { en: 'Northwind Verifiers', ar: 'نورثويند للتحقق' },
      consumed: 1,
      denied: 0,
      successRate: 1,
    },
  ],
};

function mockAllEndpoints(overrides: Partial<Record<string, unknown>> = {}) {
  const getStats = vi
    .spyOn(api, 'getStats')
    .mockResolvedValue((overrides.stats as StatsResponse) ?? fullStats);
  vi.spyOn(api, 'getDailyStats').mockResolvedValue(
    (overrides.dailyStats as DailyStatsResponse) ?? fullDailyStats,
  );
  vi.spyOn(api, 'getSigningKeyStatuses').mockResolvedValue(
    (overrides.signingKeys as SigningKeysResponse) ?? oneSigningKey,
  );
  vi.spyOn(api, 'getActivity').mockResolvedValue(
    (overrides.activity as ActivityResponse) ?? activityFeed,
  );
  vi.spyOn(api, 'getAttention').mockResolvedValue(
    (overrides.attention as AttentionResponse) ?? attentionFeed,
  );
  vi.spyOn(api, 'getConsumingPartyStats').mockResolvedValue(
    (overrides.consumingPartyStats as ConsumingPartyStatsResponse) ?? consumingPartyStats,
  );
  return { getStats };
}

describe('DashboardPage', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage('en');
  });

  it('renders every KPI and secondary counter with localized formatting', async () => {
    mockAllEndpoints();
    renderPage();

    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('890')).toBeInTheDocument();
    expect(screen.getByText('456')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
    expect(screen.getByText('567')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('shows a real period-over-period delta computed from daily stats', async () => {
    mockAllEndpoints();
    renderPage();

    // issued: previous=10, current=20 -> +100%
    expect(await screen.findByText('▲ 100%')).toBeInTheDocument();
  });

  it('renders the real lifecycle chart legend totals from daily stats', async () => {
    mockAllEndpoints();
    renderPage();

    await screen.findByText('1,234');
    // current-period total issued across the densified chart days (20) — the chart's own
    // legend total, distinct from the KPI card's "Issued" label used elsewhere on the page.
    expect(await screen.findByText('20')).toBeInTheDocument();
  });

  it('renders the real signing key for an admin operator', async () => {
    mockAllEndpoints();
    renderPage();

    expect(await screen.findByText('khatm-default:key-1')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dashboard.keys.states.active'))).toBeInTheDocument();
  });

  it('shows an admin-required message instead of signing keys for a non-admin operator', async () => {
    mockAllEndpoints();
    renderPage({ ...adminAuth, hasScope: () => false });

    expect(await screen.findByText(i18n.t('dashboard.keys.adminOnlyTitle'))).toBeInTheDocument();
    expect(api.getSigningKeyStatuses).not.toHaveBeenCalled();
  });

  it('renders recent activity rows with resolved refs and party names', async () => {
    mockAllEndpoints();
    renderPage();

    expect(await screen.findByText('CRI-2026-000001')).toBeInTheDocument();
    expect(screen.getByText('CEV-2026-000002')).toBeInTheDocument();
    expect(screen.getByText('Demo Party')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dashboard.activity.events.denied'))).toBeInTheDocument();
  });

  it('refetches the activity feed filtered to one event when a tab is clicked', async () => {
    mockAllEndpoints();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('CRI-2026-000001');
    await user.click(
      screen.getByRole('button', { name: i18n.t('dashboard.activity.tabs.issued') }),
    );

    await waitFor(() =>
      expect(api.getActivity).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'CREDENTIAL_ISSUED' }),
      ),
    );
  });

  it('renders a known attention item with type-specific copy', async () => {
    mockAllEndpoints();
    renderPage();

    expect(
      await screen.findByText(i18n.t('dashboard.attention.types.schemaDenied.title')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        i18n.t('dashboard.attention.types.schemaDenied.body', {
          party: 'Demo Party',
          schema: 'CevilRecordSchema',
        }),
      ),
    ).toBeInTheDocument();
  });

  it('renders an unrecognized attention type with a safe generic fallback, never crashing', async () => {
    mockAllEndpoints();
    renderPage();

    expect(
      await screen.findByText(i18n.t('dashboard.attention.types.other.title')),
    ).toBeInTheDocument();
  });

  it('renders the real top consuming parties with call counts and success rate', async () => {
    mockAllEndpoints();
    renderPage();

    expect(await screen.findByText('Acme Bank')).toBeInTheDocument();
    expect(screen.getByText('Northwind Verifiers')).toBeInTheDocument();
    const percentFormat = new Intl.NumberFormat('en', {
      style: 'percent',
      maximumFractionDigits: 1,
    });
    expect(
      screen.getByText(
        i18n.t('dashboard.parties.callsAndRate', { calls: '10', rate: percentFormat.format(0.7) }),
      ),
    ).toBeInTheDocument();
  });

  it('renders Arabic-Indic digit grouping in the Arabic locale', async () => {
    mockAllEndpoints();
    await i18n.changeLanguage('ar');
    renderPage();

    expect(await screen.findByText(new Intl.NumberFormat('ar').format(1234))).toBeInTheDocument();
  });

  it('renders every optional counter as 0 when the response omits them, never crashing', async () => {
    mockAllEndpoints({ stats: { window: fullStats.window, counters: {} } });
    renderPage();

    await waitFor(() => expect(api.getStats).toHaveBeenCalled());
    expect(screen.getAllByText('0')).toHaveLength(7);
  });

  it('requests a 30-day window by default and switches to 7 days on toggle', async () => {
    const { getStats } = mockAllEndpoints();
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(getStats).toHaveBeenCalledWith(
        expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
      ),
    );
    const [initialParams] = getStats.mock.calls[0];
    const initialSpanMs =
      new Date(initialParams.to as string).getTime() -
      new Date(initialParams.from as string).getTime();
    expect(Math.round(initialSpanMs / DAY_MS)).toBe(30);

    await user.click(
      screen.getByRole('button', { name: i18n.t('dashboard.windowDays', { count: 7 }) }),
    );

    await waitFor(() => expect(getStats).toHaveBeenCalledTimes(2));
    const [secondParams] = getStats.mock.calls[1];
    const secondSpanMs =
      new Date(secondParams.to as string).getTime() -
      new Date(secondParams.from as string).getTime();
    expect(Math.round(secondSpanMs / DAY_MS)).toBe(7);
  });

  it('re-fetches when the refresh button is clicked', async () => {
    mockAllEndpoints();
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(api.getStats).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: i18n.t('dashboard.refresh') }));

    await waitFor(() => expect(api.getStats).toHaveBeenCalledTimes(2));
  });

  it('exports the current stats snapshot as CSV when Export is clicked', async () => {
    mockAllEndpoints();
    const downloadCsvSpy = vi.spyOn(csv, 'downloadCsv').mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('1,234');
    await user.click(screen.getByRole('button', { name: i18n.t('dashboard.export') }));

    expect(downloadCsvSpy).toHaveBeenCalledTimes(1);
    const [filename, content] = downloadCsvSpy.mock.calls[0];
    expect(filename).toBe('khatm-dashboard-30d.csv');
    expect(content).toContain('issued,1234');
  });
});
