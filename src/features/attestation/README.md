# attestation

Client-side SHA-256 hashing for the non-automated issuer portal (FS-2.4 D1).
No routes, no API calls — a pure browser-crypto module consumed by
`attestedIssuance` and `verify`'s hash-compare affordance.

- `hashFile.ts`: `hashFile(file, options?)` → lowercase-hex SHA-256 digest via
  `crypto.subtle.digest`. Reads in bounded chunks through `FileReader`
  (progress-reportable), never `Blob#arrayBuffer()` on the whole file. The
  file's bytes never leave this module — only the digest string returns.
- `isHashingAvailable()` / `InsecureHashingContextError`: the non-secure-context
  guard — plain HTTP has no `crypto.subtle`. Callers must show a blocking
  message naming HTTPS as the cause, never fall back to a JS hash.
- No React here by design — components own their own progress UI, calling
  `hashFile` with an `onProgress` callback.
