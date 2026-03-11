'use server';

/**
 * Re-Diagnosis Server Actions
 * Handles re-diagnosis flow:
 * - Check if re-diagnosis is allowed (last diagnosis >1 hour ago)
 * - Trigger new crawl and diagnosis
 */

import { z } from 'zod';
import { createServiceDb } from '@/lib/db/client';
import { diagnosesTable, companiesTable } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { triggerCrawling } from './crawl';

/**
 * Check if company can be re-diagnosed (last diagnosis >1 hour ago)
 */
const CheckCanReDiagnoseInputSchema = z.number().int().positive();

interface CheckCanReDiagnoseSuccess {
  success: true;
  data: {
    canReDiagnose: boolean;
    lastDiagnosedAt: Date | null;
  };
}

interface CheckCanReDiagnoseError {
  success: false;
  data: {
    error: string;
  };
}

export type CheckCanReDiagnoseResult =
  | CheckCanReDiagnoseSuccess
  | CheckCanReDiagnoseError;

/**
 * Checks if re-diagnosis is allowed for a company.
 * Returns false if last diagnosis was <1 hour ago.
 *
 * @param companyId - Company ID
 * @returns Result with canReDiagnose flag and lastDiagnosedAt timestamp
 */
export async function checkCanReDiagnose(
  companyId: unknown
): Promise<CheckCanReDiagnoseResult> {
  try {
    const validated = CheckCanReDiagnoseInputSchema.safeParse(companyId);
    if (!validated.success) {
      return {
        success: false,
        data: {
          error: '유효한 회사 ID를 제공하세요',
        },
      };
    }

    const db = createServiceDb();

    // Get latest diagnosis for this company
    const latestDiagnosis = await db
      .select()
      .from(diagnosesTable)
      .where(eq(diagnosesTable.companyId, validated.data))
      .orderBy(desc(diagnosesTable.diagnosedAt))
      .limit(1);

    if (latestDiagnosis.length === 0) {
      // No diagnosis yet, can re-diagnose immediately
      return {
        success: true,
        data: {
          canReDiagnose: true,
          lastDiagnosedAt: null,
        },
      };
    }

    const lastDiagnosis = latestDiagnosis[0];
    const lastDiagnosedAt = lastDiagnosis.diagnosedAt;

    // Check if 1 hour has passed since last diagnosis
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const canReDiagnose = lastDiagnosedAt < oneHourAgo;

    return {
      success: true,
      data: {
        canReDiagnose,
        lastDiagnosedAt,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('checkCanReDiagnose error:', error);
    return {
      success: false,
      data: {
        error: errorMessage,
      },
    };
  }
}

/**
 * Trigger re-diagnosis input schema
 */
const TriggerReDiagnosisInputSchema = z.number().int().positive();

interface TriggerReDiagnosisSuccess {
  success: true;
  data: {
    message: string;
  };
}

interface TriggerReDiagnosisError {
  success: false;
  data: {
    error: string;
  };
}

export type TriggerReDiagnosisResult =
  | TriggerReDiagnosisSuccess
  | TriggerReDiagnosisError;

/**
 * Triggers re-diagnosis for a company.
 * 1. Checks if re-diagnosis is allowed
 * 2. Fetches company details
 * 3. Triggers new crawl
 * 4. Returns success/error result
 *
 * @param companyId - Company ID
 * @returns Result with message or error
 */
export async function triggerReDiagnosis(
  companyId: unknown
): Promise<TriggerReDiagnosisResult> {
  try {
    // 1. Validate input
    const validated = TriggerReDiagnosisInputSchema.safeParse(companyId);
    if (!validated.success) {
      return {
        success: false,
        data: {
          error: '유효한 회사 ID를 제공하세요',
        },
      };
    }

    const companyIdNumber = validated.data;

    // 2. Check if re-diagnosis is allowed
    const checkResult = await checkCanReDiagnose(companyIdNumber);
    if (!checkResult.success) {
      return {
        success: false,
        data: {
          error: checkResult.data.error,
        },
      };
    }

    if (!checkResult.data.canReDiagnose) {
      return {
        success: false,
        data: {
          error:
            '진단이 최근 이루어졌습니다. 1시간 후에 다시 시도하세요',
        },
      };
    }

    // 3. Fetch company details
    const db = createServiceDb();
    const companies = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyIdNumber));

    if (companies.length === 0) {
      return {
        success: false,
        data: {
          error: '회사를 찾을 수 없습니다',
        },
      };
    }

    const company = companies[0];

    // 4. Trigger new crawl
    const crawlResult = await triggerCrawling({
      company_id: companyIdNumber,
      url: company.url,
      industry: company.industry,
      company_size: company.companySize,
    });

    if (!crawlResult.success) {
      return {
        success: false,
        data: {
          error: crawlResult.error,
        },
      };
    }

    return {
      success: true,
      data: {
        message: '재진단이 시작되었습니다',
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('triggerReDiagnosis error:', error);
    return {
      success: false,
      data: {
        error: errorMessage,
      },
    };
  }
}
