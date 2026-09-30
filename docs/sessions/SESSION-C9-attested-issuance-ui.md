# SESSION-C9 — Attested-Document Issuance UI (console, FS-2.4)

> **Repo:** khatm-console · **Spec:** FS-2.4 · **Size:** main session (2–3 days)
> **Platform prereq:** KH-2.4-BE **merged** (PR #54 impl + #55 STATE record, 2026-08-10).
> **The governing constraint (FS-2.4 D1):** the scanned file is hashed **entirely in the browser**
> via WebCrypto and **never reaches the platform**. There is no upload endpoint and there will
> not be one. This is not a performance choice — it is the privacy guarantee the whole product
> line rests on ("proofs, not content"). Every decision in this session defers to it.

---

## 0. Veto points — answer in batch before the session starts

| # | Question | Options | Majd's answer |
|---|---|---|---|
| V1 | **Verifier-side hash comparison** — should the consuming-party/verify screen let a verifier pick their own copy of the document, hash it locally, and compare against the credential's `doc_sha256` claim? | (a) in scope for C9 (b) separate session (c) not now | ___a___ |
| V2 | **File retention in the browser** — after hashing, keep the file reference so the operator can re-hash without re-picking, or drop it immediately? | (a) drop immediately (recommended — smallest blast radius) (b) keep for the wizard's lifetime | ___a___ |
| V3 | **Attested flow entry point** — a dedicated `/issue/attested` route, or the existing issue wizard branching on `requires_attestation`? | (a) branch existing wizard (recommended) (b) separate route | ___b___ |
| V4 | **Schema authoring UI** — expose the `requires_attestation` toggle and the new `pattern` field on the schema authoring screen this session, or defer? | (a) both this session (b) toggle only (c) defer both | ___a___ |

> Default assumptions if left blank: V1=(a), V2=(a), V3=(b), V4=(a). The session proceeds on
> defaults rather than stopping — but says so explicitly in its STATE entry.

## 1. Preamble (mandatory, self-stop on failure)

1. `npm run contract:update` against `origin/main` (public raw fetch works directly now — the
   `gh api` fallback prior sessions needed is no longer necessary). Working tree clean first.
2. **Contract gate — self-stop if any is absent:**
   - `requires_attestation` on **`SchemaSummary`** (`GET /api/v1/schemas`, the list surface the
     wizard reads) **and** on `SchemaDetail`.
   - `attestation` object (`note`, ≤500) on the issue request.
   - `KH-ATT-0400` / `KH-ATT-0401` / `KH-ATT-0402` in the error-code surface.
   - Optional `pattern` on the claim-field authoring shape.
   KH-2.4-BE verified all of these on the platform side, so absence means a contract-vendoring
   problem, not a missing feature — report it as such.
3. **Endpoint path check:** issuance is `POST /api/v1/credentials/issue`. A bare
   `POST /api/v1/credentials` returns a raw 500 (known platform quirk, logged for KH-2.4x) —
   do not route around it, do not "fix" it client-side, just use the correct path.
4. `npm run check` green before any change.

## 2. Scope

### Item 1 — WebCrypto hashing module (`features/attestation`)
- `hashFile(file: File): Promise<string>` → lowercase hex SHA-256, using
  `crypto.subtle.digest('SHA-256', ...)`.
- **Read the file in chunks, not `arrayBuffer()` on the whole thing** — registry scans can be
  large; a 200 MB `arrayBuffer()` will fall over on a modest office machine. Use a streaming or
  chunked read and show progress for anything over a few MB.
- **Non-secure-context guard:** `crypto.subtle` is unavailable over plain HTTP. If absent, show
  an explicit blocking message naming the cause (HTTPS required) — never silently degrade, and
  never fall back to a JS hash implementation.
- Unit tests: known-vector fixtures (empty file, a small known-content file) → known digests;
  chunked path and single-shot path produce identical output for the same input.

### Item 2 — Attested branch of the issue wizard
- Wizard step 1 (schema selection) reads `requires_attestation` off `SchemaSummary` and branches.
- Attested branch, in order: pick file → hash locally (progress shown) → **display the digest
  prominently, in a copyable monospace field** → operator fills `doc_type`,
  `original_issue_date`, optional `attestation_note` → review step showing the digest again →
  submit `POST /api/v1/credentials/issue` with the `attestation` object.
- `doc_sha256` is populated **only** from the hashing module's output — never operator-typed,
  never editable. The `^[0-9a-f]{64}$` pattern is enforced server-side; the UI must make it
  impossible to submit anything else.
- The review step must state plainly, in EN and AR, that **the file itself is not uploaded and
  never leaves this device** — the operator is attesting to having seen the original. This is
  user-facing copy, not a tooltip.
- Non-attested schemas: existing flow untouched, and **no `attestation` object sent** (the
  platform rejects it with `KH-ATT-0401` — deliberately, so silent-ignore bugs surface).

### Item 3 — Error surfaces + i18n
- EN/AR strings for `KH-ATT-0400` / `0401` / `0402`. Arabic wording → Majd's review (hard gate).
- `KH-ATT-0402` (bulk rejects attested schemas) surfaces on the bulk-issue screen: attested
  schemas should be **filtered out or visibly disabled** in the bulk schema picker so the
  operator hits the explanation before the error, not after.
- Full RTL pass on every new surface, including the monospace digest field (digests stay LTR
  inside an RTL layout — a real bidi trap; verify visually, not just by inspection).

### Item 4 — The D1 enforcement test (the session's most important artifact)
- **Automated network-interceptor test** asserting that across a complete attested-issuance
  run: no request carries `multipart/form-data`, no request body contains the file bytes, and
  the only outbound payload from the attested step is the JSON issue request whose
  `doc_sha256` is a 64-hex string.
- Implement with the repo's existing test tooling (MSW or an equivalent fetch/XHR spy) —
  **do not add a new e2e framework for this**.
- The test must fail loudly if someone later adds an upload call. Name it so intent is obvious:
  `attestation.no-file-egress.test.ts` or similar, with a comment pointing at FS-2.4 D1.

### Item 5 — Schema authoring (per V4)
- `requires_attestation` toggle + optional `pattern` field on the claim-field authoring form,
  with a clear helper explaining the pattern applies at issuance.

## 3. Out of scope
- Any upload endpoint or file transmission of any kind (FS-2.4 D1 — architectural).
- Verifier-side hash comparison unless V1=(a).
- The two open contract asks (`MeResponse` tenant slug; 2FA-enrollment signal) — SESSION-KH-2.4x.
- Any platform change. A missing contract surface is a **self-stop and a recorded ask**, never
  a client-side workaround (standing rule, STATE §Open decisions).

## 4. DoD — machine-verifiable
- `npm run check` green (typecheck, lint, format, unit tests, build, contract-freshness).
- The D1 no-egress test present and green.
- Hashing unit tests green, including known vectors.
- `docs/STATE.md` updated before close, recording the V1–V4 answers actually used.

## 5. DoD — Majd walkthrough (hard merge gate, on the PR before merge)
- Arabic review of all new strings, including the "file never leaves this device" copy —
  this sentence carries the product's core promise; its Arabic wording matters more than most.
- Live EN/AR + RTL walkthrough on a real device: pick a real scanned PDF, watch the digest
  appear, issue, verify the credential, and confirm in DevTools' Network tab that **no request
  ever carried the file**. The automated test proves it in CI; seeing it once by hand is what
  makes it believable to a government counterparty later.
