/**
 * GET /api/crawl/status
 *
 * 크롤링 상태 폴링 엔드포인트
 * 특정 회사의 크롤링 진행 상황을 조회합니다.
 *
 * Query params:
 *   - company_id: number (필수) - 조회할 회사 ID
 *
 * Response: CrawlStatusResponse (판별된 합집합)
 *   - status: 'pending' | 'in_progress' | 'completed' | 'failed'
 *   - companyId: number
 *   - result_id?: number (status=completed 일때만)
 *   - error_message?: string (status=failed 일때만)
 *
 * Security:
 *   - 인증된 사용자만 접근 가능
 *   - companiesTable.userId를 통해 user가 company_id 소유권 확인 (RLS)
 *   - 사용자가 소유하지 않은 company_id 조회 시 403 Forbidden 반환
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceDb,
  companiesTable,
  crawlResultsTable,
} from "@/lib/db/client";
import { eq, desc } from "drizzle-orm";

/**
 * 크롤링 상태 응답 - 판별된 합집합 (Discriminated Union)
 * status 필드로 응답 타입을 정확히 구분합니다.
 */
export type CrawlStatusResponse =
  | {
      status: "pending";
      companyId: number;
    }
  | {
      status: "in_progress";
      companyId: number;
    }
  | {
      status: "completed";
      result_id: number;
      companyId: number;
    }
  | {
      status: "failed";
      error_message: string;
      companyId: number;
    };

/**
 * GET handler for crawl status polling
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Query parameter 파싱 및 검증
    const searchParams = request.nextUrl.searchParams;
    const companyIdParam = searchParams.get("company_id");

    if (!companyIdParam) {
      return NextResponse.json(
        { error: "company_id 쿼리 파라미터가 필수입니다" },
        { status: 400 },
      );
    }

    // company_id를 정수로 파싱
    // 엄격한 검증: 숫자만 포함되어야 함
    const isValidIntFormat = /^\d+$/.test(companyIdParam);
    if (!isValidIntFormat) {
      return NextResponse.json(
        { error: "company_id는 양수 정수여야 합니다" },
        { status: 400 },
      );
    }

    const companyId = parseInt(companyIdParam, 10);
    if (isNaN(companyId) || companyId <= 0) {
      return NextResponse.json(
        { error: "company_id는 0보다 큰 정수여야 합니다" },
        { status: 400 },
      );
    }

    // Step 2: 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: 사용자가 인증되지 않았습니다" },
        { status: 401 },
      );
    }

    // Step 3: 사용자가 해당 company_id를 소유하는지 확인 (RLS 체크)
    const db = createServiceDb();

    const companyResult = await db
      .select({ id: companiesTable.id, userId: companiesTable.userId })
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .limit(1);

    if (companyResult.length === 0) {
      // 회사가 존재하지 않음 → 403으로 반환 (404는 정보 노출)
      // 실제 이유를 숨기고 일관된 메시지 반환
      return NextResponse.json(
        { error: "해당 크롤링 상태에 접근할 권한이 없습니다" },
        { status: 403 },
      );
    }

    const company = companyResult[0];
    if (company.userId !== user.id) {
      // 사용자가 이 회사를 소유하지 않음 → 엄격한 접근 제어
      return NextResponse.json(
        { error: "해당 크롤링 상태에 접근할 권한이 없습니다" },
        { status: 403 },
      );
    }

    // Step 4: 최신 크롤링 결과 조회
    const crawlResults = await db
      .select()
      .from(crawlResultsTable)
      .where(eq(crawlResultsTable.companyId, companyId))
      .orderBy((t) => desc(t.crawledAt))
      .limit(1);

    // Step 5: 크롤링 상태 판단 및 응답 구성
    if (crawlResults.length === 0) {
      // 크롤링이 시작되지 않음
      const response: CrawlStatusResponse = {
        status: "pending",
        companyId,
      };
      return NextResponse.json(response);
    }

    const latestCrawl = crawlResults[0];

    // 크롤링 실패 상태 확인
    if (
      latestCrawl.status === "failed_timeout" ||
      latestCrawl.status === "failed_network" ||
      latestCrawl.status === "failed_invalid_url"
    ) {
      const response: CrawlStatusResponse = {
        status: "failed",
        error_message: "크롤링이 실패했습니다",
        companyId,
      };
      return NextResponse.json(response);
    }

    // 크롤링 성공
    if (latestCrawl.status === "success") {
      // 성공 시 result_id와 함께 completed 상태 반환
      const response: CrawlStatusResponse = {
        status: "completed",
        result_id: latestCrawl.id,
        companyId,
      };
      return NextResponse.json(response);
    }

    // Fallback: 진행 중으로 간주
    // (미지정 상태이거나 예상 밖의 상태)
    const response: CrawlStatusResponse = {
      status: "in_progress",
      companyId,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("크롤링 상태 조회 중 오류가 발생했습니다:", error);
    return NextResponse.json(
      { error: "Internal server error: 크롤링 상태를 조회할 수 없습니다" },
      { status: 500 },
    );
  }
}
