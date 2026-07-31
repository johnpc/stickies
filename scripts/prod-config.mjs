/**
 * Pull amplify_outputs.json from the deployed backend, waiting out an in-progress
 * deployment.
 *
 * This project's backend is a self-managed CloudFormation **stack** (the same one
 * web CI + prod use via `e2e-config`), NOT an Amplify-Hosting branch backend — so
 * we generate outputs with `--stack`, not `--app-id/--branch`. (The old app-id
 * path used a literal PROD_APP_ID_PLACEHOLDER and hard-failed with
 * StackDoesNotExist, which broke the iOS/Android deploy workflows.)
 *
 * A deploy can be mid-flight (or queued) when CI / a local run calls
 * `ampx generate outputs` — which hard-fails with DeploymentInProgressError.
 * That's a transient race, not a real failure, so we retry on it.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

// The backend stack that serves stickies.jpc.io (override with STICKIES_STACK).
const STACK = process.env.STICKIES_STACK || 'amplify-stickies-xss-sandbox-d7f764fcf6';
const PROFILE = 'personal';

const GENERATE_ARGS = ['ampx', 'generate', 'outputs', '--stack', STACK, '--profile', PROFILE];

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
