import { describe, expect, it, vi } from 'vitest';
import * as client from '@/api/client';
import { simulateConsume } from './api';

describe('simulateConsume', () => {
  it('authenticates with the pasted key via Authorization: Bearer, never the console session, and sends a ConsumeRequest-shaped body', async () => {
    const apiFetchSpy = vi
      .spyOn(client, 'apiFetch')
      .mockResolvedValue({ consumed: true, reason: 'consumed', usesRemaining: 0 });

    await simulateConsume({
      apiKey: 'khk_test_abc.secret',
      credentialId: 'cred-1',
      idempotencyKey: 'idem-1',
    });

    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/credentials/consume', {
      method: 'POST',
      body: { id: 'cred-1', consumer: 'khatm-console-simulator', idempotencyKey: 'idem-1' },
      headers: { Authorization: 'Bearer khk_test_abc.secret' },
    });
  });
});
