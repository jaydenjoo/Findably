'use server';

/**
 * Crawl Server Actions
 *
 * Handles n8n webhook triggering for crawling operations:
 * - Validates input parameters
 * - Triggers n8n webhook with crawl request
 * - Handles errors and logs to Sentry
 * - Returns success/failure result
 */

import { z } from 'zod';
import { getN8nConfig } from '@/lib/config';

/**
 * Input validation schema for triggerCrawling
 */
const TriggerCrawlingSchema = z.object({
  company_id: z
    .number()
    .int()
    .positive('유효하지 않은 company_id입니다'),
  url: z
    .string()
    .min(1, 'URL을 입력하세요')
    .url('유효한 URL이 아닙니다'),
  industry: z
    .enum(['ecommerce', 'blog', 'saas', 'local_business', 'other'], {
      message: '유효한 업종이 아닙니다',
    }),
  company_size: z
    .enum(['solo', 'small', 'medium'], {
      message: '유효한 회사 규모가 아닙니다',
    }),
});

type TriggerCrawlingInput = z.infer<typeof TriggerCrawlingSchema>;

/**
 * Success response for triggerCrawling
 */
interface TriggerCrawlingSuccess {
  success: true;
  message: string;
}

/**
 * Error response for triggerCrawling
 */
interface TriggerCrawlingError {
  success: false;
  error: string;
}

/**
 * Union type for triggerCrawling result
 */
type TriggerCrawlingResult = TriggerCrawlingSuccess | TriggerCrawlingError;

/**
 * Triggers n8n webhook to start crawling
 *
 * Validates input, calls n8n webhook with company_id, url, industry, company_size.
 * Returns success=true if webhook accepted the request, otherwise returns error message.
 * Non-blocking: webhook is called asynchronously and errors are logged to Sentry.
 *
 * @param input - Crawl trigger request data
 * @returns Success or error result
 *
 * @example
 * const result = await triggerCrawling({
 *   company_id: 123,
 *   url: 'https://example.com',
 *   industry: 'ecommerce',
 *   company_size: 'small'
 * });
 * if (result.success) {
 *   // Crawling started, poll for status
 * } else {
 *   // Handle error
 * }
 */
export async function triggerCrawling(
  input: unknown
): Promise<TriggerCrawlingResult> {
  // Step 1: Validate input with Zod schema
  const validation = TriggerCrawlingSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || '입력 정보를 확인하세요';
    return {
      success: false,
      error: errorMessage,
    };
  }

  try {
    // Step 2: Get n8n webhook URL from environment
    const config = getN8nConfig();

    if (!config.webhookBaseUrl) {
      return {
        success: false,
        error: 'N8N_WEBHOOK_URL 환경변수가 설정되지 않았습니다',
      };
    }

    // Step 3: Build webhook URL
    const webhookUrl = `${config.webhookBaseUrl}/webhook/findably-crawl`;

    // Step 4: Prepare request body
    const requestBody = {
      company_id: validation.data.company_id,
      url: validation.data.url,
      industry: validation.data.industry,
      company_size: validation.data.company_size,
    };

    // Step 5: Call n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Step 6: Check response status
    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `n8n 웹훅 호출 실패: 상태 ${response.status}`;

      // Log to console for debugging (Sentry will be added in future)
      console.error('n8n webhook error:', {
        url: webhookUrl,
        status: response.status,
        body: errorText,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Step 7: Return success
    return {
      success: true,
      message: 'n8n 크롤링이 시작되었습니다',
    };
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

    // Log to console for debugging (Sentry will be added in future)
    console.error('triggerCrawling error:', {
      action: 'triggerCrawling',
      phase: 'webhook_call',
      error: errorMessage,
    });

    return {
      success: false,
      error: 'n8n 웹훅 호출 중 오류가 발생했습니다',
    };
  }
}
