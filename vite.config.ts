/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: ['es2020', 'chrome67', 'safari14', 'firefox68', 'edge79'],
    rollupOptions: {
      output: {
        // Split heavy vendors into their own chunks — they change far less often
        // than app code, so they stay cached across deploys and parse in parallel.
        manualChunks: {
          amplify: ['aws-amplify'],
          ionic: ['@ionic/react', '@ionic/react-router', 'ionicons'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  plugins: [react(), legacy({ modernTargets: 'chrome>=67, safari>=14, firefox>=68, edge>=79' })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    testTimeout: 15000,
    // Acceptance tests live in e2e/ and run under Playwright, not Vitest.
    exclude: ['node_modules', 'dist', 'e2e', '.features-gen', '.idea', '.git', '.cache', '.claude'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      // Measure EVERY source + amplify LOGIC file, even untested ones.
      all: true,
      include: ['src/**/*.{ts,tsx}', 'amplify/**/*.ts'],
      // Excluded: tests, type decls, setup — AND declarative amplify files
      // (resource/backend config, fixtures) + the seed runner entrypoint
      // (side-effects on import; its logic lives in tested helpers).
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/setupTests.ts',
        'src/main.tsx',
        'amplify/**/resource.ts',
        'amplify/backend.ts',
        'amplify/seed/fixtures/**',
        'amplify/seed/seed.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
