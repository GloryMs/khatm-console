import i18n from '@/i18n';
import { ApiError, type ErrorEnvelope } from './errors';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface ApiRequestInit extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

async function parseErrorEnvelope(res: Response): Promise<Partial<ErrorEnvelope>> {
  try {
    return (await res.json()) as Partial<ErrorEnvelope>;
  } catch {
    return {};
  }
}

/**
 * The only entry point for calling the Khatm platform API. Handles the
 * session cookie, XSRF header, Accept-Language, and error-envelope mapping
 * so no other module needs a raw `fetch`.
 *
 * Every request is same-origin: Vite's dev proxy or nginx (in the container)
 * forwards `/api`, `/.well-known`, and `/t` (per-tenant public endpoints) to
 * the platform — the console never points at a cross-origin API URL.
 */
export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept-Language', i18n.language);

  if (MUTATING_METHODS.has(method)) {
    const xsrfToken = readCookie('XSRF-TOKEN');
    if (xsrfToken) headers.set('X-XSRF-TOKEN', xsrfToken);
  }

  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.body);
  }

  const res = await fetch(path, {
    ...init,
    method,
    headers,
    body,
    credentials: 'include',
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorEnvelope(res));
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
