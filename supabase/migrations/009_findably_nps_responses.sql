-- ============================================================
-- Findably: nps_responses 테이블 + RLS
-- NPS 1문항 응답 (0-10 점수 + 선택 코멘트)
-- 한 사용자는 한 진단당 1회만 응답 가능
-- ============================================================

-- 1. nps_responses 테이블
CREATE TABLE IF NOT EXISTS public.nps_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis_id    uuid NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  score           integer NOT NULL,
  comment         text,
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT findably_nps_score_range CHECK (score >= 0 AND score <= 10),
  CONSTRAINT findably_nps_unique_per_diagnosis UNIQUE (user_id, diagnosis_id)
);

COMMENT ON TABLE public.nps_responses IS 'Findably NPS 응답: 진단 완료 후 "추천 의향" 0-10 점수. 진단당 1회.';

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS findably_nps_user_id_idx
  ON public.nps_responses (user_id);

CREATE INDEX IF NOT EXISTS findably_nps_diagnosis_id_idx
  ON public.nps_responses (diagnosis_id);

-- 3. RLS 활성화
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
DROP POLICY IF EXISTS "findably_nps_select_own" ON public.nps_responses;
CREATE POLICY "findably_nps_select_own"
  ON public.nps_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "findably_nps_insert_own" ON public.nps_responses;
CREATE POLICY "findably_nps_insert_own"
  ON public.nps_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE/DELETE 없음 — NPS 응답은 immutable

-- ============================================================
-- 롤백
-- ============================================================
-- DROP POLICY IF EXISTS "findably_nps_insert_own" ON public.nps_responses;
-- DROP POLICY IF EXISTS "findably_nps_select_own" ON public.nps_responses;
-- DROP INDEX IF EXISTS findably_nps_diagnosis_id_idx;
-- DROP INDEX IF EXISTS findably_nps_user_id_idx;
-- DROP TABLE IF EXISTS public.nps_responses;
