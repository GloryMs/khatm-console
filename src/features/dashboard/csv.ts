import type { StatsCounters, StatsWindow } from './api';
import { resolveCounterValue, type CounterKey } from './counters';

const EXPORTED_KEYS: CounterKey[] = [
  'issued',
  'claimsRedeemed',
  'consumed',
  'verifyOk',
  'revoked',
  'consumeDenied',
  'verifyFailed',
];

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialize the currently-displayed stats snapshot — the toolbar's Export button, nothing more than what's on screen. */
export function buildStatsCsv(
  counters: StatsCounters | undefined,
  window: StatsWindow | undefined,
): string {
  const rows = [
    ['metric', 'value'],
    ['window_from', window?.from ?? ''],
    ['window_to', window?.to ?? ''],
    ...EXPORTED_KEYS.map((key) => [key, String(resolveCounterValue(counters, key))]),
  ];
  return rows.map((row) => row.map(csvField).join(',')).join('\n');
}

/** Trigger a browser download of CSV text. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
