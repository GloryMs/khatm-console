import { describe, expect, it, vi } from 'vitest';
import * as client from '@/api/client';
import {
  createIssuerClient,
  listIssuerClients,
  resumeIssuerClient,
  revokeIssuerClient,
  rotateIssuerClient,
  suspendIssuerClient,
} from './api';

describe('issuerClients api', () => {
  it('lists the tenant issuer clients', async () => {
    const apiFetchSpy = vi.spyOn(client, 'apiFetch').mockResolvedValue([]);
    await listIssuerClients();
    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/issuer-clients');
  });

  it('creates a client with exactly the given request body', async () => {
    const apiFetchSpy = vi
      .spyOn(client, 'apiFetch')
      .mockResolvedValue({ id: 'c1', keyPrefix: 'khi_abc', apiKey: 'khi_abc_secret' });

    const req = { name: { en: 'Simulator', ar: 'محاكي' }, allowedSchemaIds: ['s1'] };
    await createIssuerClient(req);

    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/issuer-clients', {
      method: 'POST',
      body: req,
    });
  });

  it('rotates a client at the exact path with the retire window in the body', async () => {
    const apiFetchSpy = vi
      .spyOn(client, 'apiFetch')
      .mockResolvedValue({ id: 'c2', keyPrefix: 'khi_def', apiKey: 'khi_def_secret' });

    await rotateIssuerClient('client-1', { retireAfterHours: 24 });

    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/issuer-clients/client-1/rotate', {
      method: 'POST',
      body: { retireAfterHours: 24 },
    });
  });

  it('suspends, resumes, and revokes at the exact lifecycle paths', async () => {
    const apiFetchSpy = vi.spyOn(client, 'apiFetch').mockResolvedValue({ id: 'c1' });

    await suspendIssuerClient('client-1');
    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/issuer-clients/client-1/suspend', {
      method: 'POST',
    });

    await resumeIssuerClient('client-1');
    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/issuer-clients/client-1/resume', {
      method: 'POST',
    });

    await revokeIssuerClient('client-1');
    expect(apiFetchSpy).toHaveBeenCalledWith('/api/v1/issuer-clients/client-1/revoke', {
      method: 'POST',
    });
  });
});
