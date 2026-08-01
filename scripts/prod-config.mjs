/**
 * Pull amplify_outputs.json from the deployed backend, waiting out an in-progress
 * deployment.
 *
 * The backend that serves stickies.jpc.io is the Amplify-Hosting BRANCH backend
 * (app d24w01u3ylemi2, branch main) — the one the Hosting build's
 * `ampx pipeline-deploy` provisions. iOS/Android, CI, local dev and seed ALL
 * pull from it (via this script + `e2e-config`) so the app and the website read
 * and write the SAME data. (Previously mobile/CI used a separate sandbox stack,
 * so the same room showed different notes in the app vs the website.) Override
 * the app id / branch with STICKIES_APP_ID / STICKIES_BRANCH.
 *
 * A deploy can be mid-flight (or queued) when CI / a local run calls
 * `ampx generate outputs` — which hard-fails with DeploymentInProgressError.
 * That's a transient race, not a real failure, so we retry on it.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

// The Amplify-Hosting app + branch whose backend serves stickies.jpc.io.
const APP_ID = process.env.STICKIES_APP_ID || 'd24w01u3ylemi2';
const BRANCH = process.env.STICKIES_BRANCH || 'main';
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

await generateOutputs();
