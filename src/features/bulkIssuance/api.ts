import { apiFetch } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type BulkIssueRequest = components['schemas']['BulkIssueRequest'];
export type BulkIssueResponse = components['schemas']['BulkIssueResponse'];
export type BulkIssueDefaults = components['schemas']['BulkIssueDefaults'];
export type BulkIssueItem = components['schemas']['BulkIssueItem'];
export type BulkIssueItemResult = components['schemas']['BulkIssueItemResult'];
export type BulkIssueItemError = components['schemas']['BulkIssueItemError'];

/**
 * Issue a batch of up to 200 credentials against one schema (KH-1.1.3). One
 * bad item never rolls back the batch — the response always reports every
 * submitted item's outcome by index, never throwing for a partial failure.
 */
export function bulkIssueCredentials(req: BulkIssueRequest): Promise<BulkIssueResponse> {
  return apiFetch<BulkIssueResponse>('/api/v1/credentials/bulk', { method: 'POST', body: req });
}
