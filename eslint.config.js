import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // '.amplify' holds Amplify-generated code (env typings for functions) — not
    // ours to lint; it's git-ignored and regenerated on every backend build.
    ignores: [
      'dist',
      'coverage',
      '.amplify',
      '.features-gen',
      'playwright-report',
      'test-results',
      '.claude',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Strict quality requirements: no `any`, ever.
      '@typescript-eslint/no-explicit-any': 'error',
      // Allow intentionally-unused args/vars prefixed with `_` — e.g. a
      // playwright-bdd step whose {string} placeholder must be in the signature
      // for arg-count but isn't needed in the body.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },
);
