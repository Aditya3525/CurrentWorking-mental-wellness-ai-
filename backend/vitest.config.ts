import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html']
    },
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    clearMocks: true
  }
});
