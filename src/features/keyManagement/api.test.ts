import { describe, expect, it, vi } from 'vitest';
import * as client from '@/api/client';
import { rotateSigningKey } from './api';

describe('rotateSigningKey', () => {
  it('sends no request body at all when no provider is chosen — the inherited-provider default (SESSION-C10)', async () => {
    const apiFetchSpy = vi
      .spyOn(client, 'apiFetch')
      .mockResolvedValue({ kid: 'key-1', state: 'ACTIVE' });

    await rotateSigningKey();

    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/admin/signing-keys/rotate', {
      method: 'POST',
      body: undefined,
    });
  });

  it('sends the exact chosen provider in the request body', async () => {
    const apiFetchSpy = vi
      .spyOn(client, 'apiFetch')
      .mockResolvedValue({ kid: 'key-2', state: 'ACTIVE' });

    await rotateSigningKey('VAULT');

    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/admin/signing-keys/rotate', {
      method: 'POST',
      body: { provider: 'VAULT' },
    });
  });
});
