export interface AllowlistDiff {
  toAllow: string[];
  toDisallow: string[];
}

/** Diffs the allowlist editor's checked schema ids against the party's current allowlist. */
export function computeAllowlistDiff(initialIds: string[], selectedIds: string[]): AllowlistDiff {
  const initial = new Set(initialIds);
  const selected = new Set(selectedIds);
  return {
    toAllow: selectedIds.filter((id) => !initial.has(id)),
    toDisallow: initialIds.filter((id) => !selected.has(id)),
  };
}
