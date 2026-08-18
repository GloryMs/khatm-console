# khatm-console

Management web console for [Khatm](https://github.com/GloryMs/khatm-platform) —
platform admin and tenant-operator UI for schema management, credential
issuance/consumption, key management, and configuration. See
[CLAUDE.md](CLAUDE.md) for the binding work rules and stack decisions.

## Dev quickstart

Requires the platform API running locally (default `http://localhost:8080`).

```bash
npm install
npm run dev        # http://localhost:5173, Vite proxies /api and /.well-known to :8080
```

Quality gates (types, lint, format, tests — same as CI):

```bash
npm run check
```

## Container quickstart

Requires the shared `khatm-net` Docker network and the platform stack
running with its API reachable as `khatm-api` on that network:

```bash
docker network create khatm-net   # once, if not already created
docker compose up -d --build
# → http://localhost:3000, nginx proxies /api and /.well-known to http://khatm-api:8080
```

Log in with the local bootstrap admin to see the seeded schema list.

## Contract-update workflow

Request/response types are generated from the platform's OpenAPI contract —
nothing here hand-writes API types (ADR-08). To pick up a new contract
version:

```bash
npm run contract:update   # refreshes contracts/openapi.json
npm run gen:api           # regenerates src/api/generated/schema.ts
```

Both are deliberate, reviewed actions — never run automatically. CI
regenerates from the vendored contract and fails the build on any diff, so a
stale `contracts/openapi.json` or generated client is always caught.

`khatm-platform` is currently a private repo, so `contract:update` tries the
public raw URL first and falls back to the GitHub API via the `gh` CLI (using
the caller's existing repo-scoped credentials) — see
`scripts/update-contract.mjs`.

The committed `contracts/openapi.json` is always **pretty-printed, 2-space
indent, with object keys sorted alphabetically at every level** (array order
is left untouched — arrays are semantically ordered). `contract:update`
canonicalizes to this form itself, regardless of whatever format the raw
fetch happened to return that day (it has flip-flopped between minified and
pretty-printed across sessions). This keeps a re-vendor's diff limited to
real schema changes instead of incidental reformatting noise.
