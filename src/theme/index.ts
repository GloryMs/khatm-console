/**
 * Theme (light/dark) bootstrap for the Khatm console.
 *
 * Mirrors {@link ../i18n/index.ts} for language: the active theme is read from
 * `localStorage` once at module load, applied to `<html data-theme>` immediately
 * (before React mounts, to avoid a flash of the wrong theme), and re-applied on
 * demand by {@link setTheme} (called from the {@link ThemeSwitcher}).
 *
 * The default is explicit `'light'`; we do NOT auto-follow `prefers-color-scheme`
 * in v1 — the operator's choice is the single source of truth.
 */

export type SupportedTheme = 'light' | 'dark';

const STORAGE_KEY = 'khatm-console:theme';

function isSupportedTheme(value: string | null): value is SupportedTheme {
  return value === 'light' || value === 'dark';
}

function readStoredTheme(): SupportedTheme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isSupportedTheme(stored) ? stored : 'light';
}

export function applyDocumentTheme(theme: SupportedTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Theme resolved at load — the switcher seeds its initial state from this. */
export const initialTheme: SupportedTheme = readStoredTheme();

// Apply immediately on import (side effect), before React renders.
applyDocumentTheme(initialTheme);

/** Persist + apply a new theme. Called by the ThemeSwitcher on click. */
export function setTheme(theme: SupportedTheme): void {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyDocumentTheme(theme);
}
