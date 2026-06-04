import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } }, // sequential — prevents blockchain chain race conditions
    globalSetup:    './tests/setup.js',             // flush Redis + blockchain before any file
    globalTeardown: './tests/teardown.js',         // close pool + redis once after all files
  },
});
