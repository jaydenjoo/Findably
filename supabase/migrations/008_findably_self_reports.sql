-- ============================================================
-- Findably: self_reports 테이블 + RLS
-- 사용자가 Quick Win을 "고쳤어요"라고 자기보고한 이력
-- 7일 후 자동 리크롤 검증의 기초 데이터
-- ============================================================

-- 1. self_reports 테이블
CREATE TABLE IF NOT EXISTS public.self_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis_id          uuid NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  rule_id               text NOT NULL,
  reported_at           timestamptz NOT NULL DEFAULT now(),
  recrawl_scheduled_at  timestamptz NOT NULL,
  recrawl_completed_at  timestamptz,
  -- 중복 제출 차단 (이중 클릭 방어)
  CONSTRAINT findably_self_reports_unique UNIQUE (user_id, diagnosis_id, rule_id)
);

COMMENT ON TABLE public.self_reports IS 'Findably 자기보고: Quick Win 수정 완료 선언. 7일 후 자동 리크롤로 실제 반영 여부 검증.';
COMMENT ON COLUMN public.self_reports.rule_id IS '수정했다고 선언한 룰 ID (예: tech-01, cont-03)';
COMMENT ON COLUMN public.self_reports.recrawl_scheduled_at IS '자동 리크롤 예약 시각 (reported_at + 7일)';

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS findably_self_reports_user_id_idx
  ON public.self_reports (user_id);

CREATE INDEX IF NOT EXISTS findably_self_reports_diagnosis_id_idx
  ON public.self_reports (diagnosis_id);

CREATE INDEX IF NOT EXISTS findably_self_reports_recrawl_scheduled_at_idx
  ON public.self_reports (recrawl_scheduled_at);

-- 미처리 리크롤 조회 최적화 (부분 인덱스)
CREATE INDEX IF NOT EXISTS findably_self_reports_pending_recrawl_idx
  ON public.self_reports (recrawl_scheduled_at)
  WHERE recrawl_completed_at IS NULL;

-- 3. RLS 활성화
ALTER TABLE public.self_reports ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: SELECT 자기 행만
DROP POLICY IF EXISTS "findably_self_reports_select_own" ON public.self_reports;
CREATE POLICY "findably_self_reports_select_own"
  ON public.self_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. RLS 정책: INSERT 자기 행만
DROP POLICY IF EXISTS "findably_self_reports_insert_own" ON public.self_reports;
CREATE POLICY "findably_self_reports_insert_own"
  ON public.self_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE/DELETE 없음 — 자기보고는 immutable

-- ============================================================
-- 롤백
-- ============================================================
-- DROP POLICY IF EXISTS "findably_self_reports_insert_own" ON public.self_reports;
-- DROP POLICY IF EXISTS "findably_self_reports_select_own" ON public.self_reports;
-- DROP INDEX IF EXISTS findably_self_reports_recrawl_scheduled_at_idx;
-- DROP INDEX IF EXISTS findably_self_reports_diagnosis_id_idx;
-- DROP INDEX IF EXISTS findably_self_reports_user_id_idx;
-- DROP TABLE IF EXISTS public.self_reports;
