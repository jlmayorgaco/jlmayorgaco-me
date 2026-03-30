import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['scripts/bot/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'scripts/bot/__tests__/',
        '**/auto-digest.ts',
        '**/main.ts'
      ]
    },
    // Isolate tests to prevent state leakage
    isolate: true,
    // Fail fast on first failure during development
    bail: process.env.CI ? 0 : 1
  }
});
