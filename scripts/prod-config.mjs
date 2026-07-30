/**
 * Pull amplify_outputs.json from the deployed `main` backend, waiting out an
 * in-progress Amplify deployment.
 *
 * A deploy is often mid-flight (or queued) when CI / a local run calls
 * `ampx generate outputs` — which hard-fails with DeploymentInProgressError.
 * That's a transient race, not a real failure.
 *
 * Strategy (hybrid):
 *   1. Poll `aws amplify list-jobs` until no RUNNING/PENDING deploy. Best-effort:
 *      if the creds can't call ListJobs (or the CLI is absent), skip to step 2.
 *   2. Run `ampx generate outputs`, and STILL retry it on the in-progress error.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

// The prod Amplify app that serves stickies.jpc.io (hosting + backend).
// Set once the app is provisioned in Amplify Hosting (see CLAUDE.md Key facts).
const APP_ID = process.env.AMPLIFY_APP_ID || 'PROD_APP_ID_PLACEHOLDER';
const BRANCH = 'main';
const REGION = 'us-west-2';
const PROFILE = 'personal';

const GENERATE_ARGS = [
  'ampx',
  'generate',
  'outputs',
  '--app-id',
  APP_ID,
  '--branch',
  BRANCH,
  '--profile',
  PROFILE,
];

const MAX_ATTEMPTS = 40; // ~20 min at 30s — deep enough for a few stacked deploys
const DELAY_MS = 30_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isInProgress = (s) =>
  s.includes('DeploymentInProgressError') || s.includes('deployment is in progress');

/** Active deploy jobs (RUNNING/PENDING) on main, or null if we can't tell. */
async function activeDeploys() {
  try {
    const { stdout } = await run('aws', [
      'amplify',
      'list-jobs',
      '--app-id',
      APP_ID,
      '--branch-name',
      BRANCH,
      '--region',
      REGION,
      '--profile',
      PROFILE,
      '--max-results',
      '5',
      '--query',
      "jobSummaries[?status=='RUNNING'||status=='PENDING'].[jobId,status]",
      '--output',
      'text',
    ]);
    return stdout.trim();
  } catch {
    return null; // can't poll — caller falls back to retrying the pull directly
  }
}

/** Wait until no deploy is RUNNING/PENDING. No-op if status polling is unavailable. */
async function waitForQuiet() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const active = await activeDeploys();
    if (active === null) {
      console.log('Cannot poll Amplify job status (ListJobs unavailable) — will retry the pull.');
      return;
    }
    if (active === '') return; // quiet
    const summary = active.replace(/\s+/g, ' ').trim();
    console.log(`Amplify deploy in progress [${summary}] — waiting ${DELAY_MS / 1000}s…`);
    await sleep(DELAY_MS);
  }
}

/** Pull outputs, retrying only on the deploy-in-progress race. */
async function generateOutputs() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { stdout } = await run('npx', GENERATE_ARGS, { encoding: 'utf8' });
      process.stdout.write(stdout);
      return;
    } catch (err) {
      const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
      if (!isInProgress(out) || attempt === MAX_ATTEMPTS) {
        process.stderr.write(out);
        throw err;
      }
      console.log(
        `Deploy started during pull — retry ${attempt}/${MAX_ATTEMPTS - 1} in ${DELAY_MS / 1000}s…`,
      );
      await sleep(DELAY_MS);
    }
  }
}

await waitForQuiet();
await generateOutputs();
