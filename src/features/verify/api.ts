import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type VerifyRequest = components['schemas']['VerifyRequest'];
export type VerifyResponse = components['schemas']['VerifyResponse'];

/**
 * Verify an SD-JWT presentation. Always POSTs `{ sdJwt }`; the contract takes
 * the disclosures inline in the compact presentation (tilde-separated), so there
 * is no separate disclosures field. A well-formed request is always HTTP 200 —
 * a domain failure (`valid: false`) is a result, never an error envelope.
 */
export function verifyPresentation(req: VerifyRequest): Promise<VerifyResponse> {
  return apiFetch<VerifyResponse>('/api/v1/credentials/verify', { method: 'POST', body: req });
}
