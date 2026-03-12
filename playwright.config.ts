import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 테스트 설정
 *
 * baseURL: http://localhost:3000 (개발 서버)
 * 테스트 실행: pnpm exec playwright test
 * 특정 파일: pnpm exec playwright test e2e/critical-flows.spec.ts
 * 디버그: pnpm exec playwright test --debug
 * UI 모드: pnpm exec playwright test --ui
 */

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Disable parallelization for staging environment tests
  forbidOnly: !!process.env.CI, // Fail on .only in CI
  retries: process.env.CI ? 2 : 0, // Retry tests 2 times in CI, 0 times locally
  workers: process.env.CI ? 1 : 1, // Single worker for consistent test runs
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/e2e.json' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  timeout: 30 * 1000, // Global timeout for each test
});
