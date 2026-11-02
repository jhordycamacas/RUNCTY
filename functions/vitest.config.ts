import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Rules tests talk to the emulator and can be slow on first start.
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
