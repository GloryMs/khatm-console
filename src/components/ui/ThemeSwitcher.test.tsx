import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { ThemeSwitcher } from './ThemeSwitcher';

function renderSwitcher() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeSwitcher />
    </I18nextProvider>,
  );
}

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders light and dark options with light active by default', () => {
    renderSwitcher();
    const light = screen.getByRole('button', { name: i18n.t('theme.light') });
    const dark = screen.getByRole('button', { name: i18n.t('theme.dark') });
    expect(light).toHaveAttribute('aria-pressed', 'true');
    expect(dark).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches to dark on click — aria-pressed flips, data-theme applied, choice persisted', async () => {
    renderSwitcher();
    const user = userEvent.setup();
    const dark = screen.getByRole('button', { name: i18n.t('theme.dark') });
    await user.click(dark);
    expect(dark).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('khatm-console:theme')).toBe('dark');
  });

  it('exposes a labelled group for assistive tech', () => {
    renderSwitcher();
    expect(screen.getByRole('group', { name: i18n.t('theme.switcherLabel') })).toBeInTheDocument();
  });
});
