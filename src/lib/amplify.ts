/**
 * Configures Amplify (auth + data) from the generated outputs.
 *
 * `amplify_outputs.json` is gitignored and produced by `npm run e2e-config`
 * (sandbox) / `npm run prod-config` (CI). It holds the Cognito pool + AppSync
 * endpoint — public client config, not secrets. Import this once at startup.
 */
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

export { outputs };
