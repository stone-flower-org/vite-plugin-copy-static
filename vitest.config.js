const os = require('os');

const { configDefaults, defineConfig, mergeConfig } = require('vitest/config');

const viteConfig = require('./vite.config').default;

const workersCount = Math.max(1, os.cpus().length - 1);

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      cache: false,
      css: false,
      clearMocks: true,
      coverage: {
        all: true,
        branches: 75,
        exclude: [...configDefaults.exclude],
        functions: 80,
        include: ['src/**'],
        lines: 80,
        provider: 'v8',
        reportsDirectory: './report/coverage',
        statements: 75,
      },
      environment: 'node',
      exclude: [...configDefaults.exclude],
      globals: true,
      globalSetup: './vitest-setup.js',
      maxConcurrency: workersCount,
      maxWorkers: workersCount,
      minWorkers: workersCount,
      pool: 'forks',
      retry: 1,
      sequence: {
        hooks: 'list',
      },
      testTimeout: 30000,
    },
  }),
);
