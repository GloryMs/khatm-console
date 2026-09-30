const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
];

/**
 * Formats an ISO timestamp as a locale-aware relative string ("3 hours ago")
 * for {@link IssuerClientResponse.lastUsedAt} (spec FS-2.7a D10 V6) — the
 * console's only relative-time surface; every other timestamp column renders
 * as an absolute `Intl.DateTimeFormat` value instead.
 */
export function formatRelativeTime(value: string, locale: string, now: Date = new Date()): string {
  const diffMs = new Date(value).getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffMs) < 60_000) return rtf.format(0, 'second');

  for (const { unit, ms } of UNITS) {
    if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return rtf.format(Math.round(diffMs / 60_000), 'minute');
}
