import { NextResponse } from 'next/server'

/**
 * API 통일 응답 엔벨로프
 * 모든 API Route가 일관된 형식으로 응답
 */

interface ApiSuccessResponse<T> {
  success: true
  data: T
  error: null
  meta?: Record<string, unknown>
}

interface ApiErrorResponse {
  success: false
  data: null
  error: string
  meta?: Record<string, unknown>
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true as const, data, error: null, meta },
    { status }
  )
}

export function errorResponse(
  error: string,
  status = 400,
  meta?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false as const, data: null, error, meta },
    { status }
  )
}
