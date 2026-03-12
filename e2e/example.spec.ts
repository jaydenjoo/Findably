import { test, expect } from '@playwright/test'

// User Flow F-001 예시: 가입 → 메인 화면 확인
test('F-001: 신규 유저가 가입 후 메인 화면을 볼 수 있다', async ({ page }) => {
  await page.goto('/')
  // 이 파일을 프로젝트에 맞게 수정하세요
  await expect(page).toHaveTitle(/.+/)
})
