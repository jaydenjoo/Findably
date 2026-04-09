-- ============================================================
-- Findably: maintenance_notices 테이블
-- 관리자가 수정하는 "서비스 점검 중" 공지 (단일 row, id=1 강제)
-- ============================================================

-- 1. 테이블
CREATE TABLE IF NOT EXISTS public.findably_maintenance_notices (
  id              int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_active       boolean NOT NULL DEFAULT false,
  title           text NOT NULL DEFAULT '서비스 점검 중입니다',
  body            text NOT NULL DEFAULT '',
  contact_email   text,
  eta_text        text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.findably_maintenance_notices IS 'Findably 점검 공지. 단일 row(id=1)만 허용. 관리자가 Admin UI에서 수정.';
COMMENT ON COLUMN public.findably_maintenance_notices.is_active IS 'true면 랜딩 페이지에 모달 노출';
COMMENT ON COLUMN public.findably_maintenance_notices.body IS '본문. 줄바꿈(\n)은 렌더 시 <p> 분리';
COMMENT ON COLUMN public.findably_maintenance_notices.contact_email IS '문의 이메일. NULL이면 미표시';
COMMENT ON COLUMN public.findably_maintenance_notices.eta_text IS '예상 복구 시간 텍스트 (예: "2026-04-10 18:00 복구 예정"). NULL이면 미표시';

-- 2. 기본 row 1건 삽입 (초기값 = 기존 하드코딩과 동일)
INSERT INTO public.findably_maintenance_notices (id, is_active, title, body, contact_email)
VALUES (
  1,
  false,
  '서비스 점검 중입니다',
  'Findably는 현재 개발 및 점검 중이라 진단 서비스를 이용하실 수 없습니다.' || E'\n' ||
  '더 안정적이고 정확한 진단을 제공해드리기 위해 작업 중이니 조금만 기다려 주세요. 서비스가 정상화되면 공지해드릴게요.',
  'support@findably.kr'
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS 활성화
ALTER TABLE public.findably_maintenance_notices ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
-- SELECT: 누구나 읽기 (랜딩 페이지 공지 노출용, 비로그인 포함)
DROP POLICY IF EXISTS "findably_maintenance_notices_select_public" ON public.findably_maintenance_notices;
CREATE POLICY "findably_maintenance_notices_select_public"
  ON public.findably_maintenance_notices
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: service_role에서만 (Admin Server Action에서 처리)

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.findably_maintenance_notices_update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS findably_maintenance_notices_updated_at_trigger ON public.findably_maintenance_notices;
CREATE TRIGGER findably_maintenance_notices_updated_at_trigger
  BEFORE UPDATE ON public.findably_maintenance_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.findably_maintenance_notices_update_timestamp();

-- ============================================================
-- 롤백 SQL (필요 시 수동 실행)
-- ============================================================
-- DROP TRIGGER IF EXISTS findably_maintenance_notices_updated_at_trigger ON public.findably_maintenance_notices;
-- DROP FUNCTION IF EXISTS public.findably_maintenance_notices_update_timestamp();
-- DROP POLICY IF EXISTS "findably_maintenance_notices_select_public" ON public.findably_maintenance_notices;
-- ALTER TABLE public.findably_maintenance_notices DISABLE ROW LEVEL SECURITY;
-- DROP TABLE IF EXISTS public.findably_maintenance_notices;
