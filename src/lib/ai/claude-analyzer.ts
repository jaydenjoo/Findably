/**
 * Claude API Content Analyzer Module
 * Analyzes website content using Claude Sonnet for AI-driven insights
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getAnthropicConfig } from "../config";

/**
 * Zod schema for Claude API response validation
 * Ensures type safety without resorting to type assertions
 */
const analysisResponseSchema = z.object({
  contentQuality: z.number().int().min(0).max(100),
  keywordDensity: z.number().int().min(0).max(100),
  uniqueness: z.number().int().min(0).max(100),
  recommendations: z.array(z.string()).max(3),
  aiScore: z.number().int().min(0).max(100),
});

type AnalysisResponseData = z.infer<typeof analysisResponseSchema>;

/**
 * Zod schema for input validation with length limits and enum constraints
 */
const contentAnalysisInputSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(200),
  h1: z.string().max(200),
  headings: z.array(z.string()).optional().default([]),
  bodyText: z.string().max(2000),
  industry: z.enum([
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
    "Services",
    "Education",
    "Other",
  ]),
  company_size: z.enum(["small", "medium", "large", "enterprise"]),
});

/**
 * Input context for content analysis
 */
export type ContentAnalysisInput = z.infer<typeof contentAnalysisInputSchema>;

/**
 * Analysis result data structure
 */
export interface AnalysisResult {
  contentQuality: number; // 0-100
  keywordDensity: number; // percentage
  uniqueness: number; // 0-100
  recommendations: string[]; // Up to 3 actionable recommendations in Korean
  aiScore: number; // 0-100
}

/**
 * Success result type
 */
interface SuccessResult {
  success: true;
  data: AnalysisResult;
}

/**
 * Error result type
 */
interface ErrorResult {
  success: false;
  error: string;
  data: {
    aiScore: number;
    error: string;
  };
}

/**
 * Discriminated union Result type
 */
export type Result = SuccessResult | ErrorResult;

/**
 * Create and cache Anthropic client
 * Uses validated config from getAnthropicConfig()
 */
function getAnthropicClient(): Anthropic {
  const config = getAnthropicConfig();
  return new Anthropic({
    apiKey: config.apiKey,
  });
}

/**
 * Analyzes website content using Claude API
 * Provides structured analysis of content quality, keyword density, and originality
 *
 * @param input - ContentAnalysisInput with title, description, headings, body, industry, company_size
 * @returns Result - Discriminated union with analysis data or error information
 *
 * @example
 * ```ts
 * const result = await analyzeContent({
 *   title: "My Website Title",
 *   description: "My description",
 *   h1: "Main Heading",
 *   headings: ["Section 1", "Section 2"],
 *   bodyText: "Content here...",
 *   industry: "Technology",
 *   company_size: "small"
 * });
 *
 * if (result.success) {
 *   console.log(result.data.aiScore); // 81
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function analyzeContent(rawInput: unknown): Promise<Result> {
  try {
    // Step 1: Validate input with Zod
    const parseResult = contentAnalysisInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const errorDetails = parseResult.error.issues
        .map((issue) => `${Array.isArray(issue.path) ? issue.path.join(".") : "unknown"}: ${issue.message}`)
        .join("; ");
      return {
        success: false,
        error: "유효하지 않은 입력입니다.",
        data: {
          aiScore: 0,
          error: `Input validation failed: ${errorDetails}`,
        },
      };
    }

    const input = parseResult.data;
    const client = getAnthropicClient();

    // System prompt in Korean for Korean website analysis
    const systemPrompt = `당신은 마케팅과 SEO 전문가입니다. 주어진 웹사이트의 콘텐츠를 분석하고 다음을 평가합니다:
1. 콘텐츠 품질 (0-100): 명확성, 구조, 전문성
2. 키워드 밀도 (0-100%): 주요 키워드의 적절한 사용도
3. 독창성 (0-100): 경쟁사 대비 차별화 정도
4. 추천사항: 즉시 실행 가능한 3가지 개선 사항 (한국어)
5. AI 점수 (0-100): 전반적인 콘텐츠 최적화 점수

반드시 다음의 JSON 형식으로 응답하세요:
{
  "contentQuality": 숫자,
  "keywordDensity": 숫자,
  "uniqueness": 숫자,
  "recommendations": ["추천1", "추천2", "추천3"],
  "aiScore": 숫자
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;

    // Build the user message with all context
    const headingsText =
      input.headings.length > 0 ? `\n부제목: ${input.headings.join(", ")}` : "";
    const userMessage = `
웹사이트 콘텐츠 분석 요청:

제목: ${input.title}
설명: ${input.description}
주제: ${input.h1}${headingsText}
업종: ${input.industry}
회사규모: ${input.company_size}

본문 (처음 2000자):
${input.bodyText}

위 정보를 분석하고 JSON 형식의 평가를 제공하세요.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
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
        data: {
          aiScore: 0,
          error: "No text content in response",
        },
      };
    }

    // Parse JSON response
    let analysisData: unknown;
    try {
      analysisData = JSON.parse(textContent.text);
    } catch (parseError) {
      return {
        success: false,
        error: "Claude API 응답을 파싱할 수 없습니다.",
        data: {
          aiScore: 0,
          error: `JSON parse error: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        },
      };
    }

    // Step 2: Validate response structure and type safety using Zod
    const responseValidation = analysisResponseSchema.safeParse(
      analysisData
    );
    if (!responseValidation.success) {
      const errorDetails = responseValidation.error.issues
        .map((issue) => `${Array.isArray(issue.path) ? issue.path.join(".") : "unknown"}: ${issue.message}`)
        .join("; ");
      return {
        success: false,
        error: "Claude API 응답 형식이 올바르지 않습니다.",
        data: {
          aiScore: 0,
          error: `Response validation failed: ${errorDetails}`,
        },
      };
    }

    const data: AnalysisResponseData = responseValidation.data;

    const result: AnalysisResult = {
      contentQuality: data.contentQuality,
      keywordDensity: data.keywordDensity,
      uniqueness: data.uniqueness,
      recommendations: data.recommendations,
      aiScore: data.aiScore,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Claude API 분석 중 알 수 없는 오류가 발생했습니다.";

    return {
      success: false,
      error: errorMessage,
      data: {
        aiScore: 0,
        error: errorMessage,
      },
    };
  }
}
