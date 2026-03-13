import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './flows',
  use: {
    baseURL: 'http://localhost:3600',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev --port 3600',
    port: 3600,
    reuseExistingServer: true,
  },
})
