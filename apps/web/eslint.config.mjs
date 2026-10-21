import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

/**
 * ESLint flat config for the Next.js application.
 *
 * `eslint-config-next` ships flat-config arrays directly (no compatibility
 * shim), so they are spread in. Type-aware linting is deliberately NOT enabled
 * yet: it requires every linted file to be part of a tsconfig program, which
 * slows linting substantially. `tsc --noEmit` covers the type-level checks in
 * the meantime.
 */
const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypescript,
  ...tseslint.configs.recommended,

  {
    // Type information for TypeScript source (`projectService` resolves the
    // nearest tsconfig per file). Scoped to TS extensions so plain JavaScript
    // config files do not require a type system. The comment below said typed
    // linting was deferred for speed — but the rules this config turns on are
    // type-aware, so the type information it needs must exist.
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/only-throw-error': 'error',

      // Stray console calls should not reach production. The structured logger
      // is the only sanctioned way to write to stdout, and it is exempted below.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  {
    // Type-aware rules cannot run on plain JavaScript config files.
    files: ['**/*.mjs', '**/*.js'],
    rules: {
      '@typescript-eslint/only-throw-error': 'off',
    },
  },

  {
    files: ['src/lib/logger.ts'],
    rules: {
      // The logger is the one place that is allowed to write to the console.
      'no-console': 'off',
    },
  },
];

export default config;
