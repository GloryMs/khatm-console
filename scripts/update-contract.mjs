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
  JSON.parse(contents); // fail fast on a malformed download
  writeFileSync(OUT_FILE, contents);
  console.log(`Wrote ${OUT_FILE}. Run "npm run gen:api" next to regenerate types.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
