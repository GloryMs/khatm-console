import type { components } from './generated/schema';

export type ErrorEnvelope = components['schemas']['ErrorEnvelope'];
export type ErrorDetail = components['schemas']['ErrorDetail'];

/**
 * Typed representation of the platform's uniform error envelope
 * `{code, message, messageKey, traceId, details[]}`, thrown by {@link apiFetch}
 * for every non-2xx response.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly messageKey: string | undefined;
  readonly traceId: string | undefined;
  readonly details: ErrorDetail[];

  constructor(status: number, envelope: Partial<ErrorEnvelope>) {
    super(envelope.message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope.code;
    this.messageKey = envelope.messageKey;
    this.traceId = envelope.traceId;
    this.details = envelope.details ?? [];
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
