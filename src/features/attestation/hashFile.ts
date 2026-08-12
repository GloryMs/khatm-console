const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8 MiB

/**
 * Thrown when `crypto.subtle` is unavailable — plain HTTP (not a secure
 * context) or a runtime with no WebCrypto implementation. FS-2.4 D1 forbids a
 * JS-hash fallback here: silently degrading to a non-WebCrypto digest would
 * undermine the one guarantee this whole feature exists to make.
 */
export class InsecureHashingContextError extends Error {
  constructor() {
    super('WebCrypto is unavailable outside a secure context (HTTPS or localhost).');
    this.name = 'InsecureHashingContextError';
  }
}

/** True when `crypto.subtle.digest` can actually be called in this context. */
export function isHashingAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle?.digest === 'function';
}

function readChunk(file: File, start: number, end: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error('Failed to read file chunk'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsArrayBuffer(file.slice(start, end));
  });
}

function toHex(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export interface HashFileOptions {
  /** Bytes read per `FileReader` call. Exposed for tests; production callers use the default. */
  chunkSize?: number;
  /** Called after each chunk lands, with cumulative bytes read and the file's total size. */
  onProgress?: (loadedBytes: number, totalBytes: number) => void;
}

/**
 * Compute a file's lowercase-hex SHA-256 digest entirely client-side via
 * WebCrypto (FS-2.4 D1) — the file itself is never sent anywhere, only the
 * digest this returns leaves the browser.
 *
 * Reads the file in bounded `chunkSize` slices via `FileReader` rather than
 * one `Blob#arrayBuffer()` call, reporting progress as each slice lands so a
 * large registry scan doesn't freeze the UI with no feedback. Note this still
 * assembles one full-size buffer before hashing — `SubtleCrypto.digest` has
 * no incremental/streaming form, so a single WebCrypto call over the whole
 * buffer is unavoidable; chunking here bounds each individual read and keeps
 * the UI responsive between them, it does not reduce peak memory below the
 * file's own size.
 */
export async function hashFile(file: File, options: HashFileOptions = {}): Promise<string> {
  if (!isHashingAvailable()) throw new InsecureHashingContextError();

  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const total = file.size;
  const combined = new Uint8Array(total);

  let offset = 0;
  while (offset < total) {
    const end = Math.min(offset + chunkSize, total);
    const chunk = await readChunk(file, offset, end);
    combined.set(new Uint8Array(chunk), offset);
    offset = end;
    options.onProgress?.(offset, total);
  }
  if (total === 0) options.onProgress?.(0, 0);

  const digest = await crypto.subtle.digest('SHA-256', combined);
  return toHex(digest);
}
