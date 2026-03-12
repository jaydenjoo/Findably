/**
 * Diagnosis Orchestrator Module
 * 모든 점수 계산을 조율하고 종합 진단 결과를 생성합니다.
 * 순수 비즈니스 로직: 데이터베이스 접근 없음, 부작용 없음
 */

import type { CrawlResult } from '@/types/crawl';
import { calculateSeoScore } from '@/lib/scoring/seo-scorer';
import { calculateGeoScore } from '@/lib/scoring/geo-scorer';
import { calculatePerformanceScore } from '@/lib/scoring/performance-scorer';
import { analyzeContent } from '@/lib/ai/claude-analyzer';
import { aggregateScores, type Grade } from '@/lib/scoring/score-aggregator';
import { identifyQuickWins, type QuickWin } from '@/lib/diagnosis/quick-win-engine';
import { captureError, addBreadcrumb } from '@/lib/logging/sentry';

/**
 * Orchestrator 입력 파라미터
 */
export interface DiagnosisOrchestratorInput {
  crawlResult: CrawlResult;
  companyId: number;
  crawlResultId: number;
}

/**
 * AI 인사이트 데이터
 */
export interface AiInsights {
  contentQuality?: number;
  keywordDensity?: number;
  uniqueness?: number;
  recommendations?: string[];
}

/**
 * Orchestrator 성공 결과
 */
export interface DiagnosisDataSuccess {
  seoScore: number;
  geoScore: number;
  performanceScore: number;
  aiScore: number | null; // AI 분석 실패 시 null
  overallScore: number;
  grade: Grade;
  quickWins: QuickWin[];
  aiInsights: AiInsights | null;
  aiUnavailable: boolean; // AI 분석 실패 여부
  diagnosedAt: Date;
}

/**
 * Orchestrator 실패 결과
 */
export interface DiagnosisDataError {
  error: string;
}

/**
 * Orchestrator 결과 (Discriminated Union)
 */
export type DiagnosisOrchestrationResult =
  | { success: true; data: DiagnosisDataSuccess }
  | { success: false; data: DiagnosisDataError };

/**
 * 모든 점수 계산을 조율하여 종합 진단 결과를 생성합니다.
 *
 * 실행 흐름:
 * 1. SEO, GEO, 성능 점수를 병렬로 계산 (synchronous)
 * 2. Claude API로 AI 분석 수행 (async, 실패 가능)
 * 3. 모든 점수를 종합 점수로 집계
 * 4. Quick Win 식별
 * 5. 결과 반환 (AI 실패 시에도 다른 점수는 포함)
 *
 * AI 분석 실패 시:
 * - aiScore를 null로 설정
 * - aiInsights를 null로 설정
 * - aiUnavailable을 true로 설정
 * - 다른 점수들은 정상 포함
 *
 * @param input - orchestrator 입력 파라미터
 * @returns 성공/실패 discriminated union 타입
 */
export async function runDiagnosisOrchestration(
  input: DiagnosisOrchestratorInput
): Promise<DiagnosisOrchestrationResult> {
  try {
    const { crawlResult } = input;

    // 1. SEO, GEO, 성능 점수 병렬 계산 (모두 동기적)
    const seoResult = calculateSeoScore(crawlResult);
    const geoResult = calculateGeoScore(crawlResult);
    const performanceResult = calculatePerformanceScore(crawlResult);

    // 2. AI 분석 (비동기, 실패 가능)
    let aiScore: number | null = null;
    let aiInsights: AiInsights | null = null;
    let aiUnavailable = false;

    try {
      const aiAnalysisInput = {
        title: crawlResult.metaTags?.title || '',
        description: crawlResult.metaTags?.description || '',
        h1: crawlResult.headings?.find((h) => h.level === 1)?.text || '',
        headings: crawlResult.headings
          ?.filter((h) => h.level > 1)
          .map((h) => h.text) || [],
        bodyText: extractBodyText(crawlResult.rawHtml),
        industry: 'general', // 실제로는 회사의 업종 정보 활용
        company_size: 'unknown', // 실제로는 회사의 규모 정보 활용
      };

      const analysisResult = await analyzeContent(aiAnalysisInput);

      if (analysisResult.success) {
        aiScore = analysisResult.data.aiScore;
        aiInsights = {
          contentQuality: analysisResult.data.contentQuality,
          keywordDensity: analysisResult.data.keywordDensity,
          uniqueness: analysisResult.data.uniqueness,
          recommendations: analysisResult.data.recommendations,
        };
      } else {
        // AI 분석 실패 — 로깅하고 계속 진행
        aiScore = null;
        aiInsights = null;
        aiUnavailable = true;
        addBreadcrumb('diagnosis', 'AI analysis failed', {
          error: analysisResult.error,
        });
      }
    } catch (error) {
      // AI 호출 중 예외 발생 — 로깅하고 계속 진행
      aiScore = null;
      aiInsights = null;
      aiUnavailable = true;
      captureError(error, {
        action: 'runDiagnosisOrchestration',
        phase: 'AI analysis',
      });
    }

    // 3. 종합 점수 계산 (AI 실패 시 aiScore = 0으로 처리)
    const aggregationResult = aggregateScores({
      seoScore: seoResult.seoScore,
      geoScore: geoResult.geoScore,
      performanceScore: performanceResult.performanceScore,
      aiScore: aiScore ?? 0, // AI 실패 시 0으로 계산
    });

    // 4. Quick Win 식별
    const quickWins = identifyQuickWins(crawlResult);

    // 5. 최종 결과 반환
    return {
      success: true,
      data: {
        seoScore: seoResult.seoScore,
        geoScore: geoResult.geoScore,
        performanceScore: performanceResult.performanceScore,
        aiScore: aiUnavailable ? null : aiScore,
        overallScore: aggregationResult.overallScore,
        grade: aggregationResult.grade,
        quickWins,
        aiInsights: aiUnavailable ? null : aiInsights,
        aiUnavailable,
        diagnosedAt: new Date(),
      },
    };
  } catch (error) {
    return {
      success: false,
      data: {
        error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다',
      },
    };
  }
}

/**
 * HTML에서 본문 텍스트 추출 (첫 2000자)
 * 간단한 구현: HTML 태그 제거
 *
 * @param html - 원본 HTML
 * @returns 추출된 텍스트 (최대 2000자)
 */
function extractBodyText(html: string | undefined): string {
  if (!html) return '';

  // HTML 태그 제거
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.substring(0, 2000);
}
