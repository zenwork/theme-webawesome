import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@codemirror/lang-css'],
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
        },
      ],
    },
    include: ['src/**/*.test.ts'],
  },
})
