// Refreshes contracts/openapi.json from the published platform contract.
// Deliberate, reviewed action — never run automatically (not part of CI).
//
// khatm-platform is a private repo, so the raw.githubusercontent.com URL 404s
// without auth. We try it first (works once/if the contract file is made public),
// then fall back to the GitHub API via the `gh` CLI, which carries the caller's
// existing repo-scoped credentials.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const RAW_URL =
  'https://raw.githubusercontent.com/GloryMs/khatm-platform/main/docs/api/openapi.json';
const REPO = 'GloryMs/khatm-platform';
const CONTRACT_PATH = 'docs/api/openapi.json';
const OUT_FILE = 'contracts/openapi.json';

async function fetchPublic() {
  const res = await fetch(RAW_URL);
  if (!res.ok) throw new Error(`raw fetch failed: HTTP ${res.status}`);
  return res.text();
}

function fetchViaGhCli() {
  const b64 = execFileSync(
    'gh',
    ['api', `repos/${REPO}/contents/${CONTRACT_PATH}`, '--jq', '.content'],
    { encoding: 'utf8' },
  );
  return Buffer.from(b64, 'base64').toString('utf8');
}

// Canonical committed form (decided KH-2.3.C11, veto V1): pretty-printed,
// 2-space indent, object keys sorted alphabetically at every level. The raw
// fetch has flip-flopped between minified and pretty-printed across sessions
// depending on the platform's own serving path, producing multi-thousand-line
// diffs that were 100% formatting noise (see C10's ~4,850-line example).
// Sorting keys makes the committed file deterministic regardless of which
// order springdoc happened to emit them in on a given day, so a re-vendor's
// diff shows only real schema changes. Array order is left untouched — arrays
// (paths, enum values, parameter lists, etc.) are semantically ordered.
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalize(value[key]);
    }
    return sorted;
  }
  return value;
}

async function main() {
  let contents;
  try {
    contents = await fetchPublic();
    console.log('Fetched contract from public raw URL.');
  } catch (publicErr) {
    console.warn(`Public fetch failed (${publicErr.message}); trying gh CLI...`);
    contents = fetchViaGhCli();
    console.log('Fetched contract via authenticated gh api.');
  }
  const parsed = JSON.parse(contents); // fail fast on a malformed download
  const canonical = JSON.stringify(canonicalize(parsed), null, 2) + '\n';
  writeFileSync(OUT_FILE, canonical);
  console.log(`Wrote ${OUT_FILE}. Run "npm run gen:api" next to regenerate types.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
