/**
 * A tenant's public JWKS is served at `/t/{slug}/.well-known/jwks.json`
 * (KH-2.1-BE), same-origin like every other platform endpoint (nginx/Vite
 * proxy `/t` alongside `/api` and `/.well-known` — see `src/api/client.ts`).
 * No env override needed here, unlike the wallet QR base: this link is
 * opened directly in the operator's own browser, not carried to another
 * device.
 */
export function buildTenantJwksUrl(slug: string): string {
  return `${window.location.origin}/t/${encodeURIComponent(slug)}/.well-known/jwks.json`;
}
