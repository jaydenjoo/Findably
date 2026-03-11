import { z } from "zod";

/**
 * URL validation schema for onboarding Step 1
 * Accepts HTTPS and HTTP URLs
 */
export const URLValidationSchema = z.object({
  url: z
    .string()
    .min(1, "URL을 입력하세요")
    .url("올바른 URL을 입력하세요 (예: https://example.com)")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "올바른 URL을 입력하세요 (예: https://example.com)",
    ),
});

export type URLValidationInput = z.infer<typeof URLValidationSchema>;

/**
 * Industry validation schema for onboarding Step 2
 * Maps Korean industry names to database enum values
 */
export const IndustryValidationSchema = z.object({
  industry: z
    .enum(["ecommerce", "blog", "saas", "local_business", "other"])
    .refine(
      (val) => ["ecommerce", "blog", "saas", "local_business", "other"].includes(val),
      "업종을 선택하세요",
    ),
});

export type IndustryValidationInput = z.infer<typeof IndustryValidationSchema>;
