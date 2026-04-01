import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD } from './constants'

/**
 * 테스트 계정으로 로그인 후 대시보드 도착을 확인한다.
 *
 * @param page Playwright Page 객체
 * @param options.timeout 대시보드 도착 타임아웃 (기본 15초)
 */
export async function login(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 15_000

  await page.goto('/login')
  await page.getByLabel('이메일').fill(TEST_EMAIL)
  await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: '로그인 →' }).click()
  await page.waitForURL('**/dashboard**', { timeout })
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/dashboard/)
}
