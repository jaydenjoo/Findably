-- ============================================================
-- Findably: profiles 테이블 + 자동 생성 트리거 + RLS
-- chatsio-v1 Supabase 프로젝트 공유 사용 — 충돌 방지 위해 함수/트리거명에 findably_ 접두사
-- ============================================================

-- 1. profiles 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  industry    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Findably 사용자 프로필. auth.users와 1:1 매핑.';

-- 2. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.findably_update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS findably_profiles_updated_at ON public.profiles;
CREATE TRIGGER findably_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.findably_update_updated_at();

-- 3. auth.users INSERT 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION public.findably_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS findably_on_auth_user_created ON auth.users;
CREATE TRIGGER findably_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.findably_handle_new_user();

-- 4. RLS 활성화 + 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "findably_profiles_select_own" ON public.profiles;
CREATE POLICY "findably_profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "findably_profiles_update_own" ON public.profiles;
CREATE POLICY "findably_profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 롤백 SQL (필요 시 수동 실행)
-- ============================================================
-- DROP POLICY IF EXISTS "findably_profiles_update_own" ON public.profiles;
-- DROP POLICY IF EXISTS "findably_profiles_select_own" ON public.profiles;
-- DROP TRIGGER IF EXISTS findably_on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.findably_handle_new_user();
-- DROP TRIGGER IF EXISTS findably_profiles_updated_at ON public.profiles;
-- DROP FUNCTION IF EXISTS public.findably_update_updated_at();
-- DROP TABLE IF EXISTS public.profiles;
