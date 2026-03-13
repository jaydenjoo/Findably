-- ============================================================
-- Findably: payments 테이블 + RLS + 인덱스
-- 🔴 보안 중요: 결제 관련 — 클라이언트 INSERT/UPDATE 완전 차단
-- 모든 조작은 서버(service_role)에서만 수행
-- ============================================================

-- 1. payments 테이블
CREATE TABLE IF NOT EXISTS public.payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis_id      uuid NOT NULL REFERENCES public.diagnoses(id),
  amount            integer NOT NULL,  -- 원 단위 (99000)
  status            text NOT NULL DEFAULT 'pending',
    -- pending → paid → failed → refunded
  toss_payment_key  text,
  toss_order_id     text UNIQUE,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payments IS 'Findably 결제 내역. 🔴 보안 중요 — 서버(service_role)에서만 INSERT/UPDATE. 클라이언트는 SELECT만 허용.';

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS findably_payments_user_id_idx
  ON public.payments (user_id);

CREATE INDEX IF NOT EXISTS findably_payments_diagnosis_id_idx
  ON public.payments (diagnosis_id);

-- 3. RLS 활성화
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 — SELECT만 허용, 나머지 전부 차단
DROP POLICY IF EXISTS "findably_payments_select_own" ON public.payments;
CREATE POLICY "findably_payments_select_own"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE 정책 없음
-- → RLS가 활성화된 상태에서 정책이 없으면 자동 차단
-- → 서버(service_role)는 RLS를 우회하므로 정상 동작

-- ============================================================
-- 롤백 SQL (필요 시 수동 실행)
-- ============================================================
-- DROP POLICY IF EXISTS "findably_payments_select_own" ON public.payments;
-- DROP INDEX IF EXISTS findably_payments_diagnosis_id_idx;
-- DROP INDEX IF EXISTS findably_payments_user_id_idx;
-- DROP TABLE IF EXISTS public.payments;
