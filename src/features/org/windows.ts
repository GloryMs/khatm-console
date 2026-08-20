export type OrgReportWindowOption = 'month' | 'quarter' | 'year';

export interface WindowRange {
  from: string;
  to: string;
}

/**
 * Calendar-aligned window from the start of the current month/quarter/year
 * through now, as ISO-8601 instants for `/api/v1/org/reports`'s `from`/`to`
 * — spec FS-2.5 veto V2's three fixed presets, deliberately no free
 * date-picker in this version. Computed in UTC rather than the browser's
 * local timezone, so "start of month/quarter/year" is deterministic
 * regardless of where the console happens to be running (no other window
 * computation in this codebase does calendar-alignment; the existing
 * dashboard windows are pure day-count math with no timezone dependency at
 * all, so there's no local precedent to follow either way).
 */
export function computeOrgReportWindow(
  option: OrgReportWindowOption,
  now: Date = new Date(),
): WindowRange {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startMonth =
    option === 'year' ? 0 : option === 'quarter' ? Math.floor(month / 3) * 3 : month;
  const from = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
  return { from: from.toISOString(), to: now.toISOString() };
}

/** Localized "from – to" date range for the reporting window's toolbar. Empty when either bound is missing. */
export function formatOrgReportWindow(
  window: { from?: string; to?: string } | undefined,
  locale: string,
): string {
  if (!window?.from || !window.to) return '';
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  return `${formatter.format(new Date(window.from))} – ${formatter.format(new Date(window.to))}`;
}
