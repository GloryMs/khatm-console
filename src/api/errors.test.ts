import { describe, expect, it } from 'vitest';
import { ApiError, isApiError } from './errors';

describe('ApiError', () => {
  it('maps the platform error envelope onto a typed error', () => {
    const error = new ApiError(403, {
      code: 'KH-RBC-0403',
      message: 'Missing the admin scope',
      messageKey: 'rbac.missing_scope',
      traceId: 'trace-123',
      details: [{ field: 'scope', message: 'admin required', messageKey: 'rbac.missing_scope' }],
    });

    expect(error.status).toBe(403);
    expect(error.code).toBe('KH-RBC-0403');
    expect(error.message).toBe('Missing the admin scope');
    expect(error.messageKey).toBe('rbac.missing_scope');
    expect(error.traceId).toBe('trace-123');
    expect(error.details).toHaveLength(1);
  });

  it('falls back to a generic message when the envelope has none', () => {
    const error = new ApiError(500, {});
    expect(error.message).toBe('Request failed with status 500');
    expect(error.details).toEqual([]);
  });

  it('is recognized by the isApiError type guard, other errors are not', () => {
    expect(isApiError(new ApiError(401, {}))).toBe(true);
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError('boom')).toBe(false);
  });
});
