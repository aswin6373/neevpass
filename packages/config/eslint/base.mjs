/**
 * Shared ESLint flat config for the pure workspace packages
 * (@neevpass/domain, @neevpass/db, @neevpass/ui, @neevpass/docgen).
 *
 * The Next.js application has its own config because it needs the Next and
 * React rules; everything else shares this one.
 */

import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      // Prisma 7 emits its client as TypeScript source into the repository.
      // It is machine-generated and regenerated on every install.
      'src/generated/**',
    ],
  },

  ...tseslint.configs.recommended,

  {
    rules: {
      // Unused code is a defect, not a style preference. Underscore-prefixed
      // names are the explicit escape hatch for intentionally unused params.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // `import type` keeps type-only imports out of the runtime bundle.
      // With verbatimModuleSyntax enabled this is required, not cosmetic.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // `==` is almost always a typo for `===`. The null exception is allowed
      // because `x == null` is the idiomatic check for null-or-undefined.
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // Shadowing makes a bug hard to read; the domain layer is small enough
      // that there is never a good reason for it.
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // Throwing a string loses the stack trace.
      'no-throw-literal': 'off',
      '@typescript-eslint/only-throw-error': 'error',
    },
  },

  {
    // Tests may assert on values the compiler would otherwise narrow away.
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
