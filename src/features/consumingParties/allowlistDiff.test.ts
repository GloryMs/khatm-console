import { describe, expect, it } from 'vitest';
import { computeAllowlistDiff } from './allowlistDiff';

describe('computeAllowlistDiff', () => {
  it('returns newly checked schemas as toAllow and unchecked ones as toDisallow', () => {
    const diff = computeAllowlistDiff(['a', 'b'], ['b', 'c']);
    expect(diff).toEqual({ toAllow: ['c'], toDisallow: ['a'] });
  });

  it('returns empty diffs when the selection is unchanged', () => {
    expect(computeAllowlistDiff(['a', 'b'], ['b', 'a'])).toEqual({
      toAllow: [],
      toDisallow: [],
    });
  });

  it('allows every schema when starting from an empty allowlist', () => {
    expect(computeAllowlistDiff([], ['a', 'b'])).toEqual({ toAllow: ['a', 'b'], toDisallow: [] });
  });

  it('disallows every schema when clearing the allowlist entirely', () => {
    expect(computeAllowlistDiff(['a', 'b'], [])).toEqual({ toAllow: [], toDisallow: ['a', 'b'] });
  });
});
