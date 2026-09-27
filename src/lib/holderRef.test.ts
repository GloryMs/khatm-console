import { describe, expect, it } from 'vitest';
import { isValidHolderRef, normalizeHolderRef } from './holderRef';

const VALID_HEX = '0123456789abcdef'.repeat(4);

describe('normalizeHolderRef', () => {
  it('trims surrounding whitespace and lowercases', () => {
    expect(normalizeHolderRef(`  ${VALID_HEX.toUpperCase()}  `)).toBe(VALID_HEX);
  });
});

describe('isValidHolderRef', () => {
  it('accepts 64 lowercase hex characters', () => {
    expect(isValidHolderRef(VALID_HEX)).toBe(true);
  });

  it('accepts uppercase hex after normalization', () => {
    expect(isValidHolderRef(VALID_HEX.toUpperCase())).toBe(true);
  });

  it.each([
    ['63 characters (one short)', VALID_HEX.slice(0, 63)],
    ['65 characters (one long)', `${VALID_HEX}a`],
    ['a non-hex letter', `${VALID_HEX.slice(0, 63)}g`],
    ['an internal space', `${VALID_HEX.slice(0, 32)} ${VALID_HEX.slice(32)}`],
    ['free text', 'holder-1'],
  ])('rejects %s', (_label, value) => {
    expect(isValidHolderRef(value)).toBe(false);
  });

  it('treats blank/whitespace-only input as absent, not a shape match', () => {
    expect(isValidHolderRef('')).toBe(false);
    expect(isValidHolderRef('   ')).toBe(false);
  });
});
