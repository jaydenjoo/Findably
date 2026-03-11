import { z } from 'zod';

/**
 * URL validation schema for onboarding Step 1
 * Accepts HTTPS and HTTP URLs
 */
export const URLValidationSchema = z.object({
  url: z
    .string()
    .min(1, 'URL을 입력하세요')
    .url('올바른 URL을 입력하세요 (예: https://example.com)')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      '올바른 URL을 입력하세요 (예: https://example.com)'
    ),
});

export type URLValidationInput = z.infer<typeof URLValidationSchema>;
