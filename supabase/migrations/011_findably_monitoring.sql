-- ============================================================
-- Findably: 모니터링 테이블 (n8n Health Check + Crawl 실행 기록)
-- 용도:
--   1. n8n Monitor v2.1이 30분마다 헬스체크 결과를 기록
--   2. n8n Crawl v3.2가 모든 크롤 실행을 기록
--   3. /admin/monitor 대시보드에서 트렌드 + 장애 이력 시각화
-- 출처: docs/findably-monitoring-migration.sql + docs/findably-monitoring-prd.md (Task 1-1)
-- 보안: admin 이메일(hidream72@gmail.com)만 접근. n8n은 service_role로 RLS 우회.
-- ============================================================

-- ------------------------------------------------------------
-- 1. 파이프라인 헬스체크 기록
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.findably_pipeline_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 전체 상태
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'warning', 'critical')),
  critical_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,

  -- 개별 체크 결과 (JSON 배열)
  -- [{ name, status, code, detail }]
  checks JSONB NOT NULL DEFAULT '[]',

  -- n8n 메타
  execution_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.findably_pipeline_health IS 'n8n Monitor v2.1이 30분마다 4 health check 결과를 INSERT. /admin/monitor 대시보드에서 최신 상태 + 24시간 트렌드 표시.';

CREATE INDEX IF NOT EXISTS findably_pipeline_health_created_idx
  ON public.findably_pipeline_health (created_at DESC);

CREATE INDEX IF NOT EXISTS findably_pipeline_health_status_idx
  ON public.findably_pipeline_health (overall_status, created_at DESC);


-- ------------------------------------------------------------
-- 2. 크롤 실행 기록 (Crawl v3.2 워크플로우에서 INSERT)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.findably_crawl_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 진단 연결
  diagnosis_id UUID NOT NULL,
  url TEXT NOT NULL,
  request_id TEXT, -- 멱등성 키 (n8n Validate 노드에서 생성)

  -- 결과
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'quality_rejected')),
  data_completeness INTEGER NOT NULL DEFAULT 0, -- 0-100%
  duration_sec INTEGER,

  -- 소스별 결과
  success_sources TEXT[] DEFAULT '{}',
  failed_sources TEXT[] DEFAULT '{}',
  error_details JSONB DEFAULT '[]', -- [{ source, error }]

  -- 콜백 결과 (Verify Callback 노드에서 향후 update 가능)
  callback_status TEXT CHECK (callback_status IN ('success', 'failed', 'skipped', 'redirect')),
  callback_status_code INTEGER,

  -- n8n 메타
  execution_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.findably_crawl_executions IS 'n8n Crawl v3.2의 Save to crawl_executions 노드가 모든 크롤 실행을 INSERT. PRD F6.';

CREATE INDEX IF NOT EXISTS findably_crawl_executions_created_idx
  ON public.findably_crawl_executions (created_at DESC);

CREATE INDEX IF NOT EXISTS findably_crawl_executions_diagnosis_idx
  ON public.findably_crawl_executions (diagnosis_id);

CREATE INDEX IF NOT EXISTS findably_crawl_executions_status_idx
  ON public.findably_crawl_executions (status, created_at DESC);

-- 유니크: 같은 request_id 중복 방지 (멱등성)
CREATE UNIQUE INDEX IF NOT EXISTS findably_crawl_executions_request_id_idx
  ON public.findably_crawl_executions (request_id) WHERE request_id IS NOT NULL;


-- ------------------------------------------------------------
-- 3. 알림 이력 (발송된 알림 추적)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.findably_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  alert_type TEXT NOT NULL CHECK (alert_type IN ('health_critical', 'health_warning', 'callback_failed', 'low_quality', 'crawl_failed')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  message TEXT NOT NULL,

  -- 연결 데이터
  diagnosis_id UUID,
  health_check_id UUID REFERENCES public.findably_pipeline_health(id) ON DELETE SET NULL,
  crawl_execution_id UUID REFERENCES public.findably_crawl_executions(id) ON DELETE SET NULL,

  -- 상태
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.findably_alerts IS 'n8n Monitor v2.1의 Save Alert 노드 또는 Crawl v3.2의 Alert 노드가 INSERT. /admin/monitor 대시보드에서 acknowledge 처리.';

CREATE INDEX IF NOT EXISTS findably_alerts_created_idx
  ON public.findably_alerts (created_at DESC);

CREATE INDEX IF NOT EXISTS findably_alerts_unacked_idx
  ON public.findably_alerts (acknowledged, created_at DESC) WHERE acknowledged = FALSE;


-- ------------------------------------------------------------
-- 4. RLS 정책 (admin 이메일만 접근, n8n은 service_role로 우회)
-- ------------------------------------------------------------
ALTER TABLE public.findably_pipeline_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findably_crawl_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findably_alerts ENABLE ROW LEVEL SECURITY;

-- Admin 읽기/쓰기 (Jayden 계정)
CREATE POLICY "admin_full_access_pipeline_health" ON public.findably_pipeline_health
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'hidream72@gmail.com'
  );

CREATE POLICY "admin_full_access_crawl_executions" ON public.findably_crawl_executions
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'hidream72@gmail.com'
  );

CREATE POLICY "admin_full_access_alerts" ON public.findably_alerts
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'hidream72@gmail.com'
  );

-- 참고: n8n은 service_role key를 사용하므로 RLS를 자동으로 우회 (별도 정책 불필요).
-- service_role은 Supabase의 모든 RLS를 bypass하는 특수 role.


-- ------------------------------------------------------------
-- 5. 대시보드용 뷰 (편의)
-- ------------------------------------------------------------

-- 5-1. 최근 24시간 헬스체크 요약 (대시보드 상태 분포 차트용)
CREATE OR REPLACE VIEW public.findably_v_health_summary_24h AS
SELECT
  overall_status,
  COUNT(*) AS check_count,
  MIN(created_at) AS first_at,
  MAX(created_at) AS last_at
FROM public.findably_pipeline_health
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY overall_status
ORDER BY
  CASE overall_status
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    ELSE 3
  END;

COMMENT ON VIEW public.findably_v_health_summary_24h IS '/admin/monitor 상단 상태 분포 차트용. 24시간 내 healthy/warning/critical 카운트.';

-- 5-2. 최근 7일 크롤 성공률 (일별 트렌드 차트용)
CREATE OR REPLACE VIEW public.findably_v_crawl_success_rate_7d AS
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'success') AS success,
  COUNT(*) FILTER (WHERE status = 'partial') AS partial,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'quality_rejected') AS rejected,
  ROUND(AVG(data_completeness)) AS avg_completeness,
  ROUND(AVG(duration_sec)) AS avg_duration_sec
FROM public.findably_crawl_executions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;

COMMENT ON VIEW public.findably_v_crawl_success_rate_7d IS '/admin/monitor 일별 트렌드 차트용. 7일 내 success/partial/failed/quality_rejected 분포 + 평균 completeness/duration.';

-- 5-3. 미확인 알림
CREATE OR REPLACE VIEW public.findably_v_unacknowledged_alerts AS
SELECT *
FROM public.findably_alerts
WHERE acknowledged = FALSE
ORDER BY created_at DESC;

COMMENT ON VIEW public.findably_v_unacknowledged_alerts IS '/admin/monitor 알림 목록용. 미확인(acknowledged=false) 알림만.';


-- ============================================================
-- 롤백 (필요 시 아래 주석 해제하여 실행)
-- ============================================================
-- DROP VIEW IF EXISTS public.findably_v_unacknowledged_alerts;
-- DROP VIEW IF EXISTS public.findably_v_crawl_success_rate_7d;
-- DROP VIEW IF EXISTS public.findably_v_health_summary_24h;
--
-- DROP POLICY IF EXISTS "admin_full_access_alerts" ON public.findably_alerts;
-- DROP POLICY IF EXISTS "admin_full_access_crawl_executions" ON public.findably_crawl_executions;
-- DROP POLICY IF EXISTS "admin_full_access_pipeline_health" ON public.findably_pipeline_health;
--
-- DROP INDEX IF EXISTS findably_alerts_unacked_idx;
-- DROP INDEX IF EXISTS findably_alerts_created_idx;
-- DROP INDEX IF EXISTS findably_crawl_executions_request_id_idx;
-- DROP INDEX IF EXISTS findably_crawl_executions_status_idx;
-- DROP INDEX IF EXISTS findably_crawl_executions_diagnosis_idx;
-- DROP INDEX IF EXISTS findably_crawl_executions_created_idx;
-- DROP INDEX IF EXISTS findably_pipeline_health_status_idx;
-- DROP INDEX IF EXISTS findably_pipeline_health_created_idx;
--
-- DROP TABLE IF EXISTS public.findably_alerts;
-- DROP TABLE IF EXISTS public.findably_crawl_executions;
-- DROP TABLE IF EXISTS public.findably_pipeline_health;
