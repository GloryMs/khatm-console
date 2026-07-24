import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from './clipboard';

// jsdom does not implement `document.execCommand` at all, so it can't be
// `vi.spyOn`'d — it must be defined outright, the same way a real browser
// exposes the legacy API even where the (secure-context-only) Clipboard API
// isn't available.
function stubExecCommand(returns: boolean) {
  const execCommand = vi.fn().mockReturnValue(returns);
  Object.defineProperty(document, 'execCommand', {
    value: execCommand,
    configurable: true,
  });
  return execCommand;
}

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'execCommand');
  });

  it('uses navigator.clipboard.writeText when available (secure context)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    const result = await copyToClipboard('khk_test_abc.secret');

    expect(writeText).toHaveBeenCalledWith('khk_test_abc.secret');
    expect(result).toBe(true);
  });

  it('falls back to execCommand when navigator.clipboard is unavailable, as it is when the console is loaded over plain HTTP via a LAN IP', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    const execCommand = stubExecCommand(true);

    const result = await copyToClipboard('khk_test_abc.secret');

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
  });

  it('falls back to execCommand when navigator.clipboard.writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const execCommand = stubExecCommand(true);

    const result = await copyToClipboard('khk_test_abc.secret');

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
  });

  it('reports failure when the execCommand fallback is also unsupported', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    stubExecCommand(false);

    const result = await copyToClipboard('khk_test_abc.secret');

    expect(result).toBe(false);
  });
});
