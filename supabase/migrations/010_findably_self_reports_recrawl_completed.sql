-- ============================================================
-- Findably: self_reports에 recrawl_completed_at 컬럼 추가
-- 리크롤 실행 멱등성 보장 — NULL=미처리, 값=완료
-- ============================================================

ALTER TABLE public.self_reports
  ADD COLUMN IF NOT EXISTS recrawl_completed_at timestamptz;

COMMENT ON COLUMN public.self_reports.recrawl_completed_at IS '리크롤 실행 완료 시각. NULL이면 미처리, 값이 있으면 처리됨. n8n이 WHERE recrawl_scheduled_at <= now() AND recrawl_completed_at IS NULL로 조회.';

-- 미처리 레코드 조회 최적화
CREATE INDEX IF NOT EXISTS findably_self_reports_pending_recrawl_idx
  ON public.self_reports (recrawl_scheduled_at)
  WHERE recrawl_completed_at IS NULL;

-- ============================================================
-- 롤백
-- ============================================================
-- DROP INDEX IF EXISTS findably_self_reports_pending_recrawl_idx;
-- ALTER TABLE public.self_reports DROP COLUMN IF EXISTS recrawl_completed_at;
