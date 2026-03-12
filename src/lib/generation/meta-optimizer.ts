/**
 * Meta Tag Optimization Module
 * Generates SEO-optimized meta tags using Claude API
 */

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicConfig } from "@/lib/config";

/**
 * Input parameters for meta tag optimization
 */
export interface MetaOptimizerInput {
  currentTitle: string;
  currentDescription: string;
  url: string;
  industry: "ecommerce" | "blog" | "saas" | "local_business" | "other";
  headings?: string[]; // H1, H2 headings for context
  ogImage?: string; // Current OG image URL
}

/**
 * Recommended meta tags
 */
export interface MetaRecommendations {
  title: string; // 50-60 chars optimized
  description: string; // 120-160 chars optimized
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null; // Keep current or suggest improvement
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string | null;
}

/**
 * Optimization result data
 */
export interface MetaOptimizerResult {
  currentMeta: {
    title: string;
    description: string;
    titleLength: number;
    descriptionLength: number;
  };
  recommendations: MetaRecommendations;
  reasons: {
    title: string; // Why this title is better (Korean)
    description: string; // Why this description is better (Korean)
    ogTags: string; // Why these OG tags (Korean)
  };
  improvements: {
    titleImproved: boolean;
    descriptionImproved: boolean;
    titleLengthOptimal: boolean; // 50-60 chars
    descriptionLengthOptimal: boolean; // 120-160 chars
  };
}

/**
 * Success result type
 */
interface SuccessResult {
  success: true;
  data: MetaOptimizerResult;
}

/**
 * Error result type
 */
interface ErrorResult {
  success: false;
  error: string;
}

/**
 * Discriminated union Result type
 */
export type Result = SuccessResult | ErrorResult;

/**
 * Create and cache Anthropic client
 */
function getAnthropicClient(): Anthropic {
  const config = getAnthropicConfig();
  return new Anthropic({
    apiKey: config.apiKey,
  });
}

/**
 * Optimizes meta tags for SEO using Claude API
 * Provides recommendations for title, description, OG tags, and Twitter cards
 *
 * @param input - MetaOptimizerInput with current meta tags and context
 * @returns Result - Discriminated union with optimized meta tags or error information
 *
 * @example
 * ```ts
 * const result = await optimizeMeta({
 *   currentTitle: "My Website",
 *   currentDescription: "My description",
 *   url: "https://example.com",
 *   industry: "ecommerce",
 *   headings: ["Products", "Services"]
 * });
 *
 * if (result.success) {
 *   console.log(result.data.recommendations.title);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function optimizeMeta(input: MetaOptimizerInput): Promise<Result> {
  try {
    const client = getAnthropicClient();
    const config = getAnthropicConfig();

    // System prompt in Korean for Korean website optimization
    const systemPrompt = `당신은 SEO 전문가이자 메타 태그 최적화 전문가입니다. 주어진 웹사이트의 현재 메타 태그를 분석하고 다음을 생성합니다:
1. 최적화된 Title (50-60자, 키워드 포함)
2. 최적화된 Description (120-160자, CTA 포함)
3. OG Tags (og:title, og:description, og:image, og:type)
4. Twitter Card Tags (twitter:title, twitter:description, twitter:image)
5. 각 개선 사항의 이유 (한국어, 예상 효과 포함)

반드시 다음의 JSON 형식으로만 응답하세요:
{
  "title": "최적화된 제목 (50-60자)",
  "description": "최적화된 설명 (120-160자)",
  "ogTitle": "OG 제목",
  "ogDescription": "OG 설명",
  "ogImage": "이미지URL 또는 null",
  "twitterTitle": "트위터 제목",
  "twitterDescription": "트위터 설명",
  "twitterImage": "트위터 이미지URL 또는 null",
  "titleReason": "Title 변경 이유 (한국어)",
  "descriptionReason": "Description 변경 이유 (한국어)",
  "ogTagsReason": "OG/Twitter 태그 생성 이유 (한국어)"
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;

    // Build the user message with all context
    const headingsText =
      input.headings && input.headings.length > 0
        ? `\n제목들: ${input.headings.join(", ")}`
        : "";
    const ogImageText = input.ogImage
      ? `\n현재 OG 이미지: ${input.ogImage}`
      : "";

    const userMessage = `
메타 태그 최적화 요청:

URL: ${input.url}
업종: ${input.industry}

현재 Title (${input.currentTitle.length}자): ${input.currentTitle}
현재 Description (${input.currentDescription.length}자): ${input.currentDescription}${headingsText}${ogImageText}

요구사항:
- Title: 50-60자 이내, 핵심 키워드 포함, SEO 최적화
- Description: 120-160자 이내, 클릭 유도 (CTA), 핵심 정보 포함
- OG Tags: 소셜 미디어 공유 최적화
- Twitter Cards: 트위터 공유 최적화
- 각 태그에 대한 개선 이유와 예상 효과

위 정보를 분석하고 JSON 형식의 최적화 제안을 제공하세요.`;

    const response = await client.messages.create({
      model: config.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return {
        success: false,
        error: "Claude API에서 텍스트 응답을 받지 못했습니다.",
      };
    }

    // Parse JSON response
    let optimizationData: unknown;
    try {
      optimizationData = JSON.parse(textContent.text);
    } catch {
      return {
        success: false,
        error: "Claude API 응답을 파싱할 수 없습니다.",
      };
    }

    // Validate and type the response
    if (typeof optimizationData !== "object" || optimizationData === null) {
      return {
        success: false,
        error: "Claude API 응답 형식이 올바르지 않습니다.",
      };
    }

    const data = optimizationData as Record<string, unknown>;

    // Validate required fields
    const title =
      typeof data.title === "string" ? data.title : (data.title as unknown);
    const description =
      typeof data.description === "string"
        ? data.description
        : (data.description as unknown);
    const ogTitle =
      typeof data.ogTitle === "string"
        ? data.ogTitle
        : (data.ogTitle as unknown);
    const ogDescription =
      typeof data.ogDescription === "string"
        ? data.ogDescription
        : (data.ogDescription as unknown);
    const twitterTitle =
      typeof data.twitterTitle === "string"
        ? data.twitterTitle
        : (data.twitterTitle as unknown);
    const twitterDescription =
      typeof data.twitterDescription === "string"
        ? data.twitterDescription
        : (data.twitterDescription as unknown);
    const titleReason =
      typeof data.titleReason === "string"
        ? data.titleReason
        : (data.titleReason as unknown);
    const descriptionReason =
      typeof data.descriptionReason === "string"
        ? data.descriptionReason
        : (data.descriptionReason as unknown);
    const ogTagsReason =
      typeof data.ogTagsReason === "string"
        ? data.ogTagsReason
        : (data.ogTagsReason as unknown);

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof ogTitle !== "string" ||
      typeof ogDescription !== "string" ||
      typeof twitterTitle !== "string" ||
      typeof twitterDescription !== "string" ||
      typeof titleReason !== "string" ||
      typeof descriptionReason !== "string" ||
      typeof ogTagsReason !== "string"
    ) {
      return {
        success: false,
        error: "Claude API 응답에 필수 필드가 누락되었습니다.",
      };
    }

    // Extract and validate og image and twitter image (can be null or string)
    const ogImage =
      data.ogImage === null || typeof data.ogImage === "string"
        ? data.ogImage
        : null;
    const twitterImage =
      data.twitterImage === null || typeof data.twitterImage === "string"
        ? data.twitterImage
        : null;

    // Calculate improvements
    const titleLengthOptimal = title.length >= 50 && title.length <= 60;
    const descriptionLengthOptimal =
      description.length >= 120 && description.length <= 160;
    const titleImproved =
      title.toLowerCase() !== input.currentTitle.toLowerCase() &&
      titleLengthOptimal;
    const descriptionImproved =
      description.toLowerCase() !== input.currentDescription.toLowerCase() &&
      descriptionLengthOptimal;

    const result: MetaOptimizerResult = {
      currentMeta: {
        title: input.currentTitle,
        description: input.currentDescription,
        titleLength: input.currentTitle.length,
        descriptionLength: input.currentDescription.length,
      },
      recommendations: {
        title,
        description,
        ogTitle,
        ogDescription,
        ogImage,
        twitterTitle,
        twitterDescription,
        twitterImage,
      },
      reasons: {
        title: titleReason,
        description: descriptionReason,
        ogTags: ogTagsReason,
      },
      improvements: {
        titleImproved,
        descriptionImproved,
        titleLengthOptimal,
        descriptionLengthOptimal,
      },
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Meta 태그 최적화 중 알 수 없는 오류가 발생했습니다.";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
