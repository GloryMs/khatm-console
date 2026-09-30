import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './relativeTime';

describe('formatRelativeTime', () => {
  const now = new Date('2026-09-29T12:00:00Z');

  it('renders a just-now value under a minute as "now"', () => {
    expect(formatRelativeTime('2026-09-29T11:59:40Z', 'en', now)).toBe('now');
  });

  it('renders minutes ago', () => {
    expect(formatRelativeTime('2026-09-29T11:45:00Z', 'en', now)).toBe('15 minutes ago');
  });

  it('renders hours ago', () => {
    expect(formatRelativeTime('2026-09-29T09:00:00Z', 'en', now)).toBe('3 hours ago');
  });

  it('renders days ago', () => {
    expect(formatRelativeTime('2026-09-26T12:00:00Z', 'en', now)).toBe('3 days ago');
  });

  it('renders in Arabic when the locale is ar', () => {
    expect(formatRelativeTime('2026-09-29T09:00:00Z', 'ar', now)).toContain('3');
  });
});
