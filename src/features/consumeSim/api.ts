import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type ConsumeRequest = components['schemas']['ConsumeRequest'];
export type ConsumeResponse = components['schemas']['ConsumeResponse'];

/** Attributed in the platform's audit trail (`ConsumeRequest.consumer`) to this tool, not a real integration. */
const CONSUMER_LABEL = 'khatm-console-simulator';

export interface ConsumeSimParams {
  apiKey: string;
  credentialId: string;
  idempotencyKey: string;
}

/**
 * Calls the platform's consume endpoint authenticated as the pasted
 * consuming-party API key — `Authorization: Bearer khk_...`, the exact header
 * `ApiKeyAuthFilter` reads — never as the console session. The session cookie
 * still rides along through the proxy, but the platform's consume rule
 * requires a CONSUMING_PARTY key regardless, so the key alone decides.
 */
export function simulateConsume(params: ConsumeSimParams): Promise<ConsumeResponse> {
  const body: ConsumeRequest = {
    id: params.credentialId,
    consumer: CONSUMER_LABEL,
    idempotencyKey: params.idempotencyKey,
  };
  return apiFetch<ConsumeResponse>('/api/v1/credentials/consume', {
    method: 'POST',
    body,
    headers: { Authorization: `Bearer ${params.apiKey}` },
  });
}
