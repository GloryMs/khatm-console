/**
 * `crypto.randomUUID()` requires a secure context (HTTPS, or the
 * `localhost`/`127.0.0.1` special case) and is `undefined` otherwise — e.g.
 * the console reached over plain HTTP via a LAN IP, which is how an operator
 * opens it from another machine on the network. `crypto.getRandomValues()`
 * has no such restriction, so it backs a manual UUIDv4 fallback for that case.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}
