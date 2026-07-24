import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('theme bootstrap', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.resetModules();
  });

  it('defaults to light when nothing is stored and applies it to <html>', async () => {
    const { initialTheme } = await import('./index');
    expect(initialTheme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('reads and applies a stored dark theme at load', async () => {
    window.localStorage.setItem('khatm-console:theme', 'dark');
    const { initialTheme } = await import('./index');
    expect(initialTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('falls back to light for an unsupported stored value', async () => {
    window.localStorage.setItem('khatm-console:theme', 'neon');
    const { initialTheme } = await import('./index');
    expect(initialTheme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('setTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.resetModules();
  });

  it('persists the choice and applies it to <html>', async () => {
    const { setTheme } = await import('./index');
    setTheme('dark');
    expect(window.localStorage.getItem('khatm-console:theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('can switch back to light', async () => {
    const { setTheme } = await import('./index');
    setTheme('dark');
    setTheme('light');
    expect(window.localStorage.getItem('khatm-console:theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
