import { describe, expect, it } from 'vitest';
import { computeOrgReportWindow, formatOrgReportWindow } from './windows';

describe('computeOrgReportWindow', () => {
  const now = new Date('2026-08-19T14:30:00Z');

  it('computes the start of the current month for "month"', () => {
    const { from, to } = computeOrgReportWindow('month', now);
    expect(from).toBe(new Date('2026-08-01T00:00:00Z').toISOString());
    expect(to).toBe(now.toISOString());
  });

  it('computes the start of the current quarter for "quarter"', () => {
    const { from } = computeOrgReportWindow('quarter', now);
    // August is in Q3 (Jul-Sep), so the quarter starts July 1.
    expect(from).toBe(new Date('2026-07-01T00:00:00Z').toISOString());
  });

  it('computes the start of the current year for "year"', () => {
    const { from } = computeOrgReportWindow('year', now);
    expect(from).toBe(new Date('2026-01-01T00:00:00Z').toISOString());
  });
});

describe('formatOrgReportWindow', () => {
  it('formats a from/to range in the given locale', () => {
    const formatted = formatOrgReportWindow(
      { from: '2026-08-01T00:00:00Z', to: '2026-08-19T14:30:00Z' },
      'en',
    );
    expect(formatted).toContain('–');
  });

  it('returns an empty string when either bound is missing', () => {
    expect(formatOrgReportWindow(undefined, 'en')).toBe('');
    expect(formatOrgReportWindow({ from: '2026-08-01T00:00:00Z' }, 'en')).toBe('');
  });
});
