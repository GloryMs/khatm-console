/**
 * The QR v1 contract (source of truth: `POST /api/v1/claims/redeem`'s OpenAPI
 * description, spec FS-1.2.1 D8). A console issue screen encodes the freshly
 * minted claim code as this exact JSON text; a wallet decodes it and POSTs
 * `code` to `{api}/api/v1/claims/redeem`.
 *
 * `v` lets a future, incompatible QR shape ship without breaking wallets still
 * reading `v: 1`.
 */
export interface QrPayloadV1 {
  v: 1;
  api: string;
  code: string;
}

/**
 * Serialize the QR payload as byte-exact JSON: key order `v`, `api`, `code`,
 * no extra fields, no whitespace. The wallet side parses this strictly, so the
 * serialization must stay stable — do not reorder or add fields.
 */
export function serializeQrPayload(payload: QrPayloadV1): string {
  // Object insertion order is preserved for string keys, and JSON.stringify
  // follows it, so this yields {"v":1,"api":"…","code":"…"} deterministically.
  return JSON.stringify({ v: 1, api: payload.api, code: payload.code });
}

/**
 * Resolve the platform base URL a QR encodes. Defaults to the console's own
 * origin (correct when the console and API share a host via the nginx proxy);
 * override with `VITE_QR_API_BASE` for LAN/wallet-device setups.
 */
export function getQrApiBase(): string {
  const override = import.meta.env.VITE_QR_API_BASE;
  if (override && override.trim()) return override.trim();
  return window.location.origin;
}

/**
 * True when the resolved base cannot be reached by a physical wallet device.
 * Callers MUST surface a visible warning when this is true — an unflagged
 * localhost base is the exact "meaningless QR on a scanning phone" bug this
 * guards against. See `IssuePage`'s success view for the required banner.
 */
export function isLocalhostOrigin(apiBase: string): boolean {
  try {
    const host = new URL(apiBase).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch {
    return false;
  }
}
