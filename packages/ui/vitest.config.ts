import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@slideforge/schema': fileURLToPath(new URL('../slide-schema/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
  },
});
