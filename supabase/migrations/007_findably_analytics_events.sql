-- ============================================================
-- Findably: analytics_events 테이블 + RLS + 인덱스
-- 퍼널 추적 이벤트 저장 (경량 analytics, 추후 PostHog 등으로 교체 가능)
-- ============================================================

-- 1. analytics_events 테이블
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event       text NOT NULL,
  properties  jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.analytics_events IS '퍼널 추적 이벤트. trackEvent()로 기록, 10명 테스트 시 수동 SQL 조회용.';

-- 2. RLS 활성화
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책: INSERT는 인증된 사용자만 (자기 user_id만)
CREATE POLICY "Users can insert own events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. RLS 정책: SELECT는 자기 이벤트만
CREATE POLICY "Users can read own events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. 인덱스
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- 롤백
-- DROP TABLE IF EXISTS public.analytics_events;
