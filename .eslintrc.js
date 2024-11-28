const prettierConf = require('./.prettierrc');

const srcOverride = {
  env: {
    es6: true,
    node: true,
  },
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'off', // conflicts with @typescript-eslint/no-unused-vars
    '@typescript-eslint/no-empty-interface': ['off'],
    '@typescript-eslint/no-explicit-any': ['warn'],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
};

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'plugin:prettier/recommended'],
  ignorePatterns: ['dist/*'],
  overrides: [
    // sources
    {
      env: srcOverride.env,
      extends: srcOverride.extends,
      files: ['src/**'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 12,
        project: './tsconfig.json',
        sourceType: 'module',
      },
      rules: srcOverride.rules,
    },
    // tests
    {
      env: Object.assign(srcOverride.env, {
        'vitest-globals/env': true,
      }),
      extends: [...srcOverride.extends, 'plugin:vitest/recommended', 'plugin:vitest-globals/recommended'],
      files: ['tests/**'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 12,
        project: './tsconfig.json',
        sourceType: 'module',
      },
      rules: Object.assign(srcOverride.rules, {}),
    },
  ],
  parser: 'esprima',
  plugins: ['@typescript-eslint', 'import', 'prettier', 'vitest'],
  root: true,
  rules: {
    'arrow-body-style': ['error', 'as-needed'],
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
        },
        groups: ['builtin', 'external', 'parent', ['sibling', 'index'], 'object', 'type'],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '@/src/**',
            group: 'parent',
            position: 'before',
          },
          {
            pattern: '@/tests/**',
            group: 'parent',
            position: 'before',
          },
        ],
      },
    ],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
      },
    ],
    'multiline-ternary': 'off',
    'no-restricted-imports': [
      'error',
      {
        patterns: ['../'],
      },
    ],
    'no-var': ['error'],
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    'prefer-const': 'error',
    'prettier/prettier': ['error', prettierConf],
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
    },
  },
};
