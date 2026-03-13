-- ============================================================
-- Findably: diagnoses + diagnosis_items 테이블 + RLS + 인덱스
-- 진단 요청 메인 테이블 + 개별 검사 항목 (60개+)
-- ============================================================

-- 1. diagnoses 테이블
CREATE TABLE IF NOT EXISTS public.diagnoses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url             text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
    -- pending → crawling → analyzing → completed → failed
  tier            text NOT NULL DEFAULT 'free',  -- 'free' | 'paid'
  target_keywords text[],
  competitor_urls text[],
  industry        text,
  total_score     integer,
  grade           text,  -- 'excellent' | 'good' | 'warning' | 'critical'
  crawl_data      jsonb,
  analysis_data   jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

COMMENT ON TABLE public.diagnoses IS 'Findably 진단 요청. URL 입력 → 크롤링 → 분석 → 완료 흐름 추적.';

-- 2. diagnosis_items 테이블
CREATE TABLE IF NOT EXISTS public.diagnosis_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id    uuid NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  category        text NOT NULL,  -- 'seo' | 'geo' | 'technical' | 'content'
  name            text NOT NULL,
  status          text NOT NULL,  -- 'pass' | 'fail' | 'warning' | 'skip'
  score           integer NOT NULL DEFAULT 0,
  description     text,
  recommendation  text,
  priority        text,  -- 'high' | 'medium' | 'low'
  raw_data        jsonb
);

COMMENT ON TABLE public.diagnosis_items IS 'Findably 개별 검사 항목. diagnoses 1:N 관계. 서버에서만 생성.';

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS findably_diagnoses_user_id_idx
  ON public.diagnoses (user_id);

CREATE INDEX IF NOT EXISTS findably_diagnoses_status_idx
  ON public.diagnoses (status);

CREATE INDEX IF NOT EXISTS findably_diagnosis_items_diagnosis_id_idx
  ON public.diagnosis_items (diagnosis_id);

-- 4. RLS 활성화
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_items ENABLE ROW LEVEL SECURITY;

-- 5. diagnoses RLS 정책
DROP POLICY IF EXISTS "findably_diagnoses_select_own" ON public.diagnoses;
CREATE POLICY "findably_diagnoses_select_own"
  ON public.diagnoses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "findably_diagnoses_insert_own" ON public.diagnoses;
CREATE POLICY "findably_diagnoses_insert_own"
  ON public.diagnoses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE/DELETE 없음 — 상태 변경은 서버(service_role)에서만

-- 6. diagnosis_items RLS 정책
--    본인 진단의 항목만 조회 (서브쿼리로 diagnoses.user_id 검증)
DROP POLICY IF EXISTS "findably_diagnosis_items_select_own" ON public.diagnosis_items;
CREATE POLICY "findably_diagnosis_items_select_own"
  ON public.diagnosis_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.diagnoses
      WHERE public.diagnoses.id = diagnosis_id
        AND public.diagnoses.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE 없음 — 서버에서만 생성

-- ============================================================
-- 롤백 SQL (필요 시 수동 실행)
-- ============================================================
-- DROP POLICY IF EXISTS "findably_diagnosis_items_select_own" ON public.diagnosis_items;
-- DROP POLICY IF EXISTS "findably_diagnoses_insert_own" ON public.diagnoses;
-- DROP POLICY IF EXISTS "findably_diagnoses_select_own" ON public.diagnoses;
-- DROP INDEX IF EXISTS findably_diagnosis_items_diagnosis_id_idx;
-- DROP INDEX IF EXISTS findably_diagnoses_status_idx;
-- DROP INDEX IF EXISTS findably_diagnoses_user_id_idx;
-- DROP TABLE IF EXISTS public.diagnosis_items;
-- DROP TABLE IF EXISTS public.diagnoses;
