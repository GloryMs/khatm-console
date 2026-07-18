import { describe, expect, it } from 'vitest';
import en from './en.json';
import ar from './ar.json';

type JsonRecord = Record<string, unknown>;

function flattenKeys(obj: JsonRecord, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as JsonRecord, path);
    }
    return [path];
  });
}

// The console's MessageBundleParityTest — en and ar must expose the identical
// key set so no UI string silently falls back to the wrong language.
describe('i18n resource parity', () => {
  it('has an identical key set in en.json and ar.json', () => {
    const enKeys = flattenKeys(en).sort();
    const arKeys = flattenKeys(ar).sort();
    expect(arKeys).toEqual(enKeys);
  });
});
