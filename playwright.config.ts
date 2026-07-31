import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * Load .env.local (gitignored) for local runs so TEST_USERNAME / TEST_PASSWORD
 * are available without a dependency. In CI these come from GitHub secrets.
 */
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

/**
 * Acceptance tests are Gherkin .feature files in e2e/features/ with step
 * definitions in e2e/steps/. playwright-bdd compiles them into Playwright specs
 * under .features-gen/ at run time.
 */
const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
});

export default defineConfig({
  testDir,
  // Purge the e2e-prefixed rooms this run created from the shared backend so they
  // don't accumulate (and never surface on the live recents feed).
  globalTeardown: './e2e/globalTeardown.ts',
  fullyParallel: true,
  // Every worker hits the SAME shared sandbox backend; a small pool trades a
  // little wall-clock for stability against shared state.
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
    // VIDEO=1 records a .webm per test under test-results/ — used to attach a
    // demo artifact to a PR (see CLAUDE.md). Off by default so CI stays lean.
    video: process.env.VIDEO ? 'on' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
