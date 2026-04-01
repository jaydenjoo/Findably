import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * 대시보드 8가지 유효 상태 중 하나 이상이 표시되는지 확인한다.
 *
 * 상태: score | emptyState | analyzing | timedOut | failedPaid | failedFree | parseError | dbError
 */
export async function expectDashboardState(page: Page): Promise<void> {
  const hasScore = await page.locator('[role="meter"]').count()
  const hasEmptyState = await page.getByText('아직 진단 결과가 없어요').count()
  const hasAnalyzing = await page.getByText(/분석이 진행 중입니다/).count()
  const hasTimedOut = await page
    .getByText('분석이 예상보다 오래 걸리고 있습니다')
    .count()
  const hasFailedPaid = await page
    .getByText('상세 분석에 일시적 문제가 발생했습니다')
    .count()
  const hasFailedFree = await page.getByText('진단에 실패했습니다').count()
  const hasParseError = await page
    .getByText('진단 데이터를 읽을 수 없습니다')
    .count()
  const hasDbError = await page.getByText('데이터를 불러올 수 없습니다').count()

  const total =
    hasScore +
    hasEmptyState +
    hasAnalyzing +
    hasTimedOut +
    hasFailedPaid +
    hasFailedFree +
    hasParseError +
    hasDbError

  expect(total).toBeGreaterThan(0)
}
