-- ============================================================
-- Findably: reports 테이블 + RLS + 인덱스
-- 진단 결과 리포트 (웹 대시보드 데이터 + PDF URL)
-- ============================================================

-- 1. reports 테이블
CREATE TABLE IF NOT EXISTS public.reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id    uuid NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier            text NOT NULL,  -- 'free' | 'paid'
  dashboard_data  jsonb,
  pdf_url         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reports IS 'Findably 리포트. 무료(간단)/유료(상세+PDF) 구분. 서버에서만 생성.';

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS findably_reports_user_id_idx
  ON public.reports (user_id);

CREATE INDEX IF NOT EXISTS findably_reports_diagnosis_id_idx
  ON public.reports (diagnosis_id);

-- 3. RLS 활성화
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 — SELECT만 허용
DROP POLICY IF EXISTS "findably_reports_select_own" ON public.reports;
CREATE POLICY "findably_reports_select_own"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE 정책 없음 — 서버(service_role)에서만 생성

-- ============================================================
-- 롤백 SQL (필요 시 수동 실행)
-- ============================================================
-- DROP POLICY IF EXISTS "findably_reports_select_own" ON public.reports;
-- DROP INDEX IF EXISTS findably_reports_diagnosis_id_idx;
-- DROP INDEX IF EXISTS findably_reports_user_id_idx;
-- DROP TABLE IF EXISTS public.reports;
