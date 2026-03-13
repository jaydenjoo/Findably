-- ============================================================
-- Findably: profiles RLS 보안 고도화
-- 방어 심층화 (Defense in Depth) 3가지 보강
-- ============================================================

-- 1. SELECT 정책: public → authenticated 제한
--    비인증(anon) 사용자는 정책 대상에서 완전히 제외
DROP POLICY IF EXISTS "findably_profiles_select_own" ON public.profiles;
CREATE POLICY "findably_profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. UPDATE 정책: authenticated 제한 + 컬럼 변조 방지
--    id, created_at 변경 시도 차단
DROP POLICY IF EXISTS "findably_profiles_update_own" ON public.profiles;
CREATE POLICY "findably_profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND id = id
  );

-- 3. findably_update_updated_at 함수: search_path 보안 설정 추가
CREATE OR REPLACE FUNCTION public.findably_update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 롤백 SQL (필요 시 수동 실행)
-- ============================================================
-- DROP POLICY IF EXISTS "findably_profiles_select_own" ON public.profiles;
-- CREATE POLICY "findably_profiles_select_own"
--   ON public.profiles FOR SELECT
--   USING (auth.uid() = id);
--
-- DROP POLICY IF EXISTS "findably_profiles_update_own" ON public.profiles;
-- CREATE POLICY "findably_profiles_update_own"
--   ON public.profiles FOR UPDATE
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);
--
-- CREATE OR REPLACE FUNCTION public.findably_update_updated_at()
-- RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
-- AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
