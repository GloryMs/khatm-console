import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type SchemaSummary = components['schemas']['SchemaSummary'];

/** Read-only tenant schema list — no scope required (deliberate platform decision). */
export function listSchemas(): Promise<SchemaSummary[]> {
  return apiFetch<SchemaSummary[]>('/api/v1/schemas');
}
