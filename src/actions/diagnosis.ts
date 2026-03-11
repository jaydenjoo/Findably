'use server';

/**
 * Diagnosis Server Action
 * 크롤링 결과를 기반으로 종합 진단 결과를 생성하고 저장합니다.
 */

import { z } from 'zod';
import { createServiceDb } from '@/lib/db/client';
import {
  crawlResultsTable,
  diagnosesTable,
  actionItemsTable,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { runDiagnosisOrchestration } from '@/lib/diagnosis/orchestrator';
import { addBreadcrumb, captureError } from '@/lib/logging/sentry';
import type {
  CrawlResult,
  SchemaMarkupItem,
  PerformanceMetrics,
  SitemapInfo,
  MetaTags,
} from '@/types/crawl';

/**
 * 진단 요청 입력 검증
 */
const RunDiagnosisInputSchema = z.object({
  companyId: z.number().int().positive('회사 ID는 양수여야 합니다'),
  crawlResultId: z.number().int().positive('크롤링 결과 ID는 양수여야 합니다'),
});

export type RunDiagnosisInput = z.infer<typeof RunDiagnosisInputSchema>;

/**
 * 진단 결과 레코드 (DB에서 반환되는 형태)
 */
export interface DiagnosisRecord {
  id: number;
  companyId: number;
  crawlResultId: number | null;
  diagnosedAt: Date;
  seoScore: number | null;
  geoScore: number | null;
  performanceScore: number | null;
  aiScore: number | null;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  aiInsights: Record<string, unknown> | null;
  isLatest: boolean;
}

/**
 * 성공 결과
 */
interface DiagnosisSuccess {
  success: true;
  data: DiagnosisRecord;
}

/**
 * 실패 결과
 */
interface DiagnosisError {
  success: false;
  data: {
    error: string;
  };
}

/**
 * 반환 타입 (Discriminated Union)
 */
export type RunDiagnosisResult = DiagnosisSuccess | DiagnosisError;

/**
 * 크롤링 결과를 기반으로 진단을 실행하고 결과를 저장합니다.
 *
 * 실행 순서:
 * 1. 입력 검증
 * 2. 크롤링 결과 조회
 * 3. Orchestrator로 모든 점수 계산
 * 4. 이전 진단 레코드의 is_latest = false로 업데이트
 * 5. 새 진단 레코드 삽입
 * 6. Quick Win을 action_items 테이블에 삽입
 * 7. 최종 진단 레코드 반환
 *
 * @param input - 회사 ID, 크롤링 결과 ID
 * @returns 성공/실패 discriminated union
 */
export async function runDiagnosis(input: RunDiagnosisInput): Promise<RunDiagnosisResult> {
  try {
    // 1. 입력 검증
    const validated = RunDiagnosisInputSchema.safeParse(input);
    if (!validated.success) {
      // Zod ZodError has flatten() method that returns structured errors
      const errorMap = validated.error.flatten();
      const errorMessages = Object.entries(errorMap.fieldErrors)
        .map(([, msgs]) => (msgs && msgs.length > 0 ? msgs[0] : ''))
        .filter(Boolean);
      const errorMessage = errorMessages.length > 0
        ? errorMessages.join(', ')
        : '입력 검증 실패';
      addBreadcrumb('diagnosis', 'Input validation failed', {
        error: errorMessage,
      });
      return {
        success: false,
        data: {
          error: errorMessage,
        },
      };
    }

    const { companyId, crawlResultId } = validated.data;
    addBreadcrumb('diagnosis', 'Diagnosis started', {
      companyId,
      crawlResultId,
    });

    // 2. 크롤링 결과 조회
    const db = createServiceDb();
    const crawlResults = await db
      .select()
      .from(crawlResultsTable)
      .where(
        and(
          eq(crawlResultsTable.id, crawlResultId),
          eq(crawlResultsTable.companyId, companyId)
        )
      );

    if (crawlResults.length === 0) {
      addBreadcrumb('diagnosis', 'Crawl result not found', {
        companyId,
        crawlResultId,
      });
      return {
        success: false,
        data: {
          error: '크롤링 결과를 찾을 수 없습니다',
        },
      };
    }

    const crawlResult = crawlResults[0];

    // 타입 변환: Drizzle 반환값 → CrawlResult
    const crawlResultTyped: CrawlResult = {
      companyId: crawlResult.companyId,
      crawledAt: crawlResult.crawledAt,
      status: crawlResult.status,
      rawHtml: crawlResult.rawHtml || undefined,
      htmlTruncated: crawlResult.htmlTruncated || undefined,
      metaTags: crawlResult.metaTags ? (crawlResult.metaTags as MetaTags) : undefined,
      headings:
        ((crawlResult.headings as Array<{ text: string; level: number }>)?.filter(
          (h): h is { text: string; level: 1 | 2 | 3 } => [1, 2, 3].includes(h.level)
        ) || []) as Array<{ text: string; level: 1 | 2 | 3 }>,
      schemaMarkup: (crawlResult.schemaMarkup as SchemaMarkupItem[]) || [],
      performanceMetrics: crawlResult.performanceMetrics
        ? (crawlResult.performanceMetrics as PerformanceMetrics)
        : undefined,
      robotsTxt: crawlResult.robotsTxt || undefined,
      sitemapInfo: crawlResult.sitemapInfo ? (crawlResult.sitemapInfo as SitemapInfo) : undefined,
      detectedCms: crawlResult.detectedCms || undefined,
      isLatest: crawlResult.isLatest || false,
    };

    // 3. Orchestrator로 진단 실행
    const orchestrationResult = await runDiagnosisOrchestration({
      crawlResult: crawlResultTyped,
      companyId,
      crawlResultId,
    });

    if (!orchestrationResult.success) {
      addBreadcrumb('diagnosis', 'Orchestration failed', {
        companyId,
        error: orchestrationResult.data.error,
      });
      return {
        success: false,
        data: {
          error: `진단 계산 실패: ${orchestrationResult.data.error}`,
        },
      };
    }

    const orchestrationData = orchestrationResult.data;
    addBreadcrumb('diagnosis', 'Orchestration completed', {
      companyId,
      seoScore: orchestrationData.seoScore,
      geoScore: orchestrationData.geoScore,
      overallScore: orchestrationData.overallScore,
    });

    // 4. 이전 진단 레코드의 is_latest = false로 업데이트 (트랜잭션 시작)
    await db
      .update(diagnosesTable)
      .set({ isLatest: false })
      .where(
        and(
          eq(diagnosesTable.companyId, companyId),
          eq(diagnosesTable.isLatest, true)
        )
      );

    // 5. 새 진단 레코드 삽입
    const insertedDiagnoses = await db
      .insert(diagnosesTable)
      .values({
        companyId,
        crawlResultId,
        diagnosedAt: orchestrationData.diagnosedAt,
        seoScore: orchestrationData.seoScore.toString(),
        geoScore: orchestrationData.geoScore.toString(),
        performanceScore: orchestrationData.performanceScore.toString(),
        aiScore: orchestrationData.aiScore ? orchestrationData.aiScore.toString() : null,
        overallScore: orchestrationData.overallScore.toString(),
        grade: orchestrationData.grade,
        aiInsights: orchestrationData.aiInsights
          ? JSON.parse(JSON.stringify(orchestrationData.aiInsights))
          : null,
        isLatest: true,
      })
      .returning();

    if (insertedDiagnoses.length === 0) {
      addBreadcrumb('diagnosis', 'Database insert failed', {
        companyId,
      });
      return {
        success: false,
        data: {
          error: '진단 레코드 삽입 실패',
        },
      };
    }

    const diagnosisId = insertedDiagnoses[0].id;
    addBreadcrumb('diagnosis', 'Diagnosis record created', {
      companyId,
      diagnosisId,
      grade: orchestrationData.grade,
    });

    // 6. Quick Win을 action_items 테이블에 삽입
    if (orchestrationData.quickWins && orchestrationData.quickWins.length > 0) {
      const actionItemValues = orchestrationData.quickWins.map((quickWin) => {
        // effort 문자열을 난이도로 변환
        let estimatedEffort: '<1h' | '1-8h' | '>8h' = '<1h';
        if (quickWin.effort.includes('8시간')) {
          estimatedEffort = '1-8h';
        } else if (quickWin.effort.includes('1시간') === false) {
          estimatedEffort = '>8h';
        }

        // expectedImpact 문자열에서 숫자 추출
        const impactMatch = quickWin.expectedImpact.match(/\d+/);
        const expectedImpactScore = impactMatch ? parseInt(impactMatch[0], 10) : 5;

        return {
          companyId,
          diagnosisId,
          itemType: 'quick_win' as const,
          title: quickWin.title,
          description: quickWin.description,
          priority: (quickWin.priority === 'high' ? 'high' : 'medium') as 'high' | 'medium' | 'low',
          expectedImpactScore: expectedImpactScore.toString(),
          estimatedEffort,
          completed: false,
        };
      });

      await db.insert(actionItemsTable).values(actionItemValues);
    }

    // 7. 최종 진단 레코드 반환
    const finalDiagnosis = insertedDiagnoses[0];

    addBreadcrumb('diagnosis', 'Diagnosis completed', {
      companyId,
      diagnosisId,
      grade: finalDiagnosis.grade,
    });

    return {
      success: true,
      data: {
        id: finalDiagnosis.id,
        companyId: finalDiagnosis.companyId,
        crawlResultId: finalDiagnosis.crawlResultId,
        diagnosedAt: finalDiagnosis.diagnosedAt,
        seoScore: finalDiagnosis.seoScore ? parseFloat(String(finalDiagnosis.seoScore)) : null,
        geoScore: finalDiagnosis.geoScore ? parseFloat(String(finalDiagnosis.geoScore)) : null,
        performanceScore: finalDiagnosis.performanceScore
          ? parseFloat(String(finalDiagnosis.performanceScore))
          : null,
        aiScore: finalDiagnosis.aiScore ? parseFloat(String(finalDiagnosis.aiScore)) : null,
        overallScore: parseFloat(String(finalDiagnosis.overallScore)),
        grade: finalDiagnosis.grade,
        aiInsights: finalDiagnosis.aiInsights as Record<string, unknown> | null,
        isLatest: finalDiagnosis.isLatest ?? false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다';
    captureError(error, {
      action: 'runDiagnosis',
      phase: 'unknown',
      companyId: (input as unknown as { companyId?: unknown })?.companyId,
    });
    return {
      success: false,
      data: {
        error: errorMessage,
      },
    };
  }
}
