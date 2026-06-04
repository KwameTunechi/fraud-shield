import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,   // DB + Redis calls can be slow
    hookTimeout: 15000,
  },
});
