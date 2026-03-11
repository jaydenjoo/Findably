'use server';

/**
 * Onboarding Server Actions
 *
 * Handles submission of onboarding form data:
 * - Validates input with Zod schema
 * - Creates company record in Supabase
 * - Triggers n8n crawling webhook
 * - Returns company_id for dashboard redirect
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceDb, companiesTable } from '@/lib/db/client';
import { OnboardingFormSchema } from '@/lib/validations/onboarding';
import { getN8nConfig } from '@/lib/config';
import { addBreadcrumb, captureError } from '@/lib/logging/sentry';

/**
 * Result type for successful submission
 */
interface SubmitOnboardingSuccess {
  success: true;
  companyId: number;
  crawlTriggered: boolean;
}

/**
 * Result type for failed submission
 */
interface SubmitOnboardingError {
  success: false;
  error: string;
}

/**
 * Union type for submission result
 */
type SubmitOnboardingResult = SubmitOnboardingSuccess | SubmitOnboardingError;

/**
 * Triggers n8n webhook to start crawling
 * Returns true if successful, false if webhook fails (non-blocking)
 */
async function triggerN8nWebhook(
  companyId: number,
  url: string,
  industry: string,
  companySize: string
): Promise<boolean> {
  try {
    const config = getN8nConfig();
    const webhookUrl = `${config.webhookBaseUrl}/webhook/findably-crawl`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        url,
        industry,
        company_size: companySize,
      }),
    });

    // Log webhook response for debugging
    if (!response.ok) {
      console.error(
        `n8n webhook failed with status ${response.status}:`,
        await response.text()
      );
      return false;
    }

    return true;
  } catch (error) {
    // Log error but don't fail the onboarding
    console.error('Failed to trigger n8n webhook:', error);
    return false;
  }
}

/**
 * Submit onboarding form data
 * Validates input, creates company record, triggers crawling, and redirects
 */
export async function submitOnboarding(
  input: unknown
): Promise<SubmitOnboardingResult> {
  // Step 1: Validate input with Zod schema
  const validation = OnboardingFormSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || '입력 정보를 확인하세요';
    addBreadcrumb('onboarding', 'Validation failed', {
      error: errorMessage,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }

  const { url, industry, companySize } = validation.data;

  try {
    // Step 2: Get current user from Supabase Auth
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      addBreadcrumb('onboarding', 'Authentication failed', {
        error: authError?.message || 'No user found',
      });
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    const userId = authData.user.id;
    addBreadcrumb('onboarding', 'User authenticated', { userId });

    // Step 3: Create company record in database
    try {
      const db = createServiceDb();
      const result = await db
        .insert(companiesTable)
        .values({
          userId,
          url,
          industry: industry as 'ecommerce' | 'blog' | 'saas' | 'local_business' | 'other',
          companySize: companySize as 'solo' | 'small' | 'medium',
        })
        .returning();

      if (!result || result.length === 0) {
        addBreadcrumb('onboarding', 'Database insert failed', {
          userId,
          url,
        });
        return {
          success: false,
          error: '회사 정보를 저장할 수 없습니다. 다시 시도해주세요.',
        };
      }

      const companyId = result[0].id;
      addBreadcrumb('onboarding', 'Company created', {
        companyId,
        userId,
        industry,
      });

      // Step 4: Trigger n8n webhook (non-blocking, best-effort)
      const crawlTriggered = await triggerN8nWebhook(
        companyId,
        url,
        industry,
        companySize
      );

      addBreadcrumb('onboarding', 'Onboarding completed', {
        companyId,
        crawlTriggered,
      });

      return {
        success: true,
        companyId,
        crawlTriggered,
      };
    } catch (dbError) {
      // Handle specific database errors
      const errorMessage = dbError instanceof Error ? dbError.message : '';

      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        addBreadcrumb('onboarding', 'Duplicate company URL', { url });
        return {
          success: false,
          error: '이미 등록된 URL입니다. 대시보드에서 확인하세요.',
        };
      }

      // Generic database error
      captureError(dbError, {
        action: 'submitOnboarding',
        phase: 'database_insert',
        url,
      });
      return {
        success: false,
        error: '서버 오류가 발생했습니다. 다시 시도해주세요.',
      };
    }
  } catch (error) {
    // Catch all other errors
    captureError(error, {
      action: 'submitOnboarding',
      phase: 'unknown',
      url,
    });
    return {
      success: false,
      error: '서버 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}
