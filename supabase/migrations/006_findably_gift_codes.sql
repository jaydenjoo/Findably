-- ============================================================
-- Findably: gift_codes + gift_code_uses 테이블
-- 유료 진단 선물용 코드 (관리자가 발급, 사용자가 적용)
-- ============================================================

-- 1. gift_codes 테이블
CREATE TABLE IF NOT EXISTS public.gift_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  description     text,
  max_uses        integer NOT NULL DEFAULT 1,
  used_count      integer NOT NULL DEFAULT 0,
  expires_at      timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gift_codes IS 'Findably 선물 코드. 관리자가 발급하고 사용자가 적용하여 유료 진단 1회 무료 제공.';
COMMENT ON COLUMN public.gift_codes.code IS '선물 코드 문자열 (대소문자 무시 권장) — 사용자가 입력하는 값';
COMMENT ON COLUMN public.gift_codes.description IS '관리자 메모 (예: "2026년 3월 마케팅 캠페인")';
COMMENT ON COLUMN public.gift_codes.max_uses IS '최대 사용 가능 횟수';
COMMENT ON COLUMN public.gift_codes.used_count IS '현재까지 사용된 횟수';
COMMENT ON COLUMN public.gift_codes.expires_at IS '만료 날짜. NULL이면 무한정 유효.';
COMMENT ON COLUMN public.gift_codes.is_active IS 'false면 즉시 비활성화 (만료와는 별개로 관리자가 수동 비활성화 가능)';

-- 2. gift_code_uses 테이블
CREATE TABLE IF NOT EXISTS public.gift_code_uses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_code_id    uuid NOT NULL REFERENCES public.gift_codes(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis_id    uuid REFERENCES public.diagnoses(id) ON DELETE SET NULL,
  used_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gift_code_uses IS 'Findably 선물 코드 사용 이력. 한 사용자는 동일 코드를 1회만 사용 가능.';
COMMENT ON COLUMN public.gift_code_uses.diagnosis_id IS '코드를 적용한 진단 ID. NULL이면 코드만 소비되고 아직 진단 미실행.';

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS findably_gift_codes_code_idx
  ON public.gift_codes (code);

CREATE INDEX IF NOT EXISTS findably_gift_codes_is_active_idx
  ON public.gift_codes (is_active);

CREATE INDEX IF NOT EXISTS findably_gift_code_uses_gift_code_id_idx
  ON public.gift_code_uses (gift_code_id);

CREATE INDEX IF NOT EXISTS findably_gift_code_uses_user_id_idx
  ON public.gift_code_uses (user_id);

-- 유니크 제약: 동일 사용자는 동일 코드를 1회만 사용
CREATE UNIQUE INDEX IF NOT EXISTS findably_gift_code_uses_code_user_idx
  ON public.gift_code_uses (gift_code_id, user_id);

-- 4. RLS 활성화
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_code_uses ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 — gift_codes (인증 사용자는 읽기만, 관리자 필요 시 service_role 사용)
DROP POLICY IF EXISTS "findably_gift_codes_select_authenticated" ON public.gift_codes;
CREATE POLICY "findably_gift_codes_select_authenticated"
  ON public.gift_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- INSERT/UPDATE/DELETE는 service_role에서만 (관리자 코드 발급/관리)

-- 6. RLS 정책 — gift_code_uses
-- SELECT: 자신이 사용한 이력만 조회 가능
DROP POLICY IF EXISTS "findably_gift_code_uses_select_own" ON public.gift_code_uses;
CREATE POLICY "findably_gift_code_uses_select_own"
  ON public.gift_code_uses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: 인증된 사용자가 자신의 이름으로만 사용 기록 생성 가능
DROP POLICY IF EXISTS "findably_gift_code_uses_insert_own" ON public.gift_code_uses;
CREATE POLICY "findably_gift_code_uses_insert_own"
  ON public.gift_code_uses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 서버(service_role)에서만 diagnosis_id 업데이트 (유료 진단 완료 후)

-- ============================================================
-- 롤백 SQL (필요 시 수동 실행)
-- ============================================================
-- DROP POLICY IF EXISTS "findably_gift_code_uses_insert_own" ON public.gift_code_uses;
-- DROP POLICY IF EXISTS "findably_gift_code_uses_select_own" ON public.gift_code_uses;
-- DROP POLICY IF EXISTS "findably_gift_codes_select_authenticated" ON public.gift_codes;
-- DROP INDEX IF EXISTS findably_gift_code_uses_code_user_idx;
-- DROP INDEX IF EXISTS findably_gift_code_uses_user_id_idx;
-- DROP INDEX IF EXISTS findably_gift_code_uses_gift_code_id_idx;
-- DROP INDEX IF EXISTS findably_gift_codes_is_active_idx;
-- DROP INDEX IF EXISTS findably_gift_codes_code_idx;
-- ALTER TABLE public.gift_code_uses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.gift_codes DISABLE ROW LEVEL SECURITY;
-- DROP TABLE IF EXISTS public.gift_code_uses;
-- DROP TABLE IF EXISTS public.gift_codes;
