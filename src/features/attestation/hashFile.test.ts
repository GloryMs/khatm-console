import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashFile, InsecureHashingContextError, isHashingAvailable } from './hashFile';

// Known SHA-256 vectors (verified against Node's `crypto.createHash('sha256')`).
const EMPTY_DIGEST = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'.slice(
  0,
  64,
);
const ABC_DIGEST = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

describe('hashFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('matches the known SHA-256 digest of an empty file', async () => {
    const file = new File([], 'empty.bin');
    await expect(hashFile(file)).resolves.toBe(EMPTY_DIGEST);
  });

  it('matches the known SHA-256 digest of a small known-content file', async () => {
    const file = new File(['abc'], 'abc.txt');
    await expect(hashFile(file)).resolves.toBe(ABC_DIGEST);
  });

  it('returns a lowercase 64-character hex string', async () => {
    const file = new File(['some scanned document bytes'], 'doc.bin');
    const digest = await hashFile(file);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the identical digest whether read in one chunk or many', async () => {
    const file = new File(['khatm-attestation-test-vector'.repeat(50)], 'long.bin');
    const singleShot = await hashFile(file, { chunkSize: file.size });
    const chunked = await hashFile(file, { chunkSize: 7 });
    expect(chunked).toBe(singleShot);
    expect(chunked).toMatch(/^[0-9a-f]{64}$/);
  });

  it('reports monotonically increasing progress that ends at the full file size', async () => {
    const file = new File(['0123456789'], 'progress.bin');
    const calls: [number, number][] = [];
    await hashFile(file, {
      chunkSize: 3,
      onProgress: (loaded, total) => calls.push([loaded, total]),
    });
    expect(calls.length).toBeGreaterThan(1);
    expect(calls.every(([, total]) => total === 10)).toBe(true);
    for (let i = 1; i < calls.length; i++) {
      expect(calls[i][0]).toBeGreaterThan(calls[i - 1][0]);
    }
    expect(calls[calls.length - 1][0]).toBe(10);
  });

  it('reports a single zero/zero progress tick for an empty file', async () => {
    const file = new File([], 'empty.bin');
    const calls: [number, number][] = [];
    await hashFile(file, { onProgress: (loaded, total) => calls.push([loaded, total]) });
    expect(calls).toEqual([[0, 0]]);
  });

  it('reports isHashingAvailable() true in this (WebCrypto-enabled) test runtime', () => {
    expect(isHashingAvailable()).toBe(true);
  });

  it('throws InsecureHashingContextError, never a JS-hash fallback, when crypto.subtle is unavailable', async () => {
    vi.stubGlobal('crypto', {});
    expect(isHashingAvailable()).toBe(false);
    const file = new File(['abc'], 'abc.txt');
    await expect(hashFile(file)).rejects.toBeInstanceOf(InsecureHashingContextError);
  });
});
