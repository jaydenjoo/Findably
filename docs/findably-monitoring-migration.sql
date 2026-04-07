-- ============================================================
-- Findably 모니터링 테이블 마이그레이션
-- 용도: n8n Health Check + Crawl 실행 기록 저장
-- 대시보드에서 트렌드/장애 이력 시각화용
-- ============================================================

-- 1. 파이프라인 헬스체크 기록
CREATE TABLE IF NOT EXISTS findably_pipeline_health (
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

-- 인덱스: 최근 N건 빠른 조회 + 상태별 필터
CREATE INDEX idx_pipeline_health_created ON findably_pipeline_health (created_at DESC);
CREATE INDEX idx_pipeline_health_status ON findably_pipeline_health (overall_status, created_at DESC);


-- 2. 크롤 실행 기록 (Crawl v3 워크플로우에서 기록)
CREATE TABLE IF NOT EXISTS findably_crawl_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 진단 연결
  diagnosis_id UUID NOT NULL,
  url TEXT NOT NULL,
  request_id TEXT, -- 멱등성 키
  
  -- 결과
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'quality_rejected')),
  data_completeness INTEGER NOT NULL DEFAULT 0, -- 0-100%
  duration_sec INTEGER,
  
  -- 소스별 결과
  success_sources TEXT[] DEFAULT '{}',
  failed_sources TEXT[] DEFAULT '{}',
  error_details JSONB DEFAULT '[]', -- [{ source, error }]
  
  -- 콜백 결과
  callback_status TEXT CHECK (callback_status IN ('success', 'failed', 'skipped', 'redirect')),
  callback_status_code INTEGER,
  
  -- n8n 메타
  execution_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 진단ID 조회 + 시간순 + 실패 필터
CREATE INDEX idx_crawl_exec_created ON findably_crawl_executions (created_at DESC);
CREATE INDEX idx_crawl_exec_diagnosis ON findably_crawl_executions (diagnosis_id);
CREATE INDEX idx_crawl_exec_status ON findably_crawl_executions (status, created_at DESC);

-- 유니크: 같은 request_id 중복 방지 (멱등성)
CREATE UNIQUE INDEX idx_crawl_exec_request_id ON findably_crawl_executions (request_id) WHERE request_id IS NOT NULL;


-- 3. 알림 이력 (발송된 알림 추적)
CREATE TABLE IF NOT EXISTS findably_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN ('health_critical', 'health_warning', 'callback_failed', 'low_quality', 'crawl_failed')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  message TEXT NOT NULL,
  
  -- 연결 데이터
  diagnosis_id UUID,
  health_check_id UUID REFERENCES findably_pipeline_health(id),
  crawl_execution_id UUID REFERENCES findably_crawl_executions(id),
  
  -- 상태
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_created ON findably_alerts (created_at DESC);
CREATE INDEX idx_alerts_unacked ON findably_alerts (acknowledged, created_at DESC) WHERE acknowledged = FALSE;


-- 4. RLS 정책 (admin만 접근)
ALTER TABLE findably_pipeline_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE findably_crawl_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE findably_alerts ENABLE ROW LEVEL SECURITY;

-- Admin 읽기/쓰기 (Jayden 계정)
CREATE POLICY "admin_full_access_health" ON findably_pipeline_health
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('hidream72@gmail.com')
  );

CREATE POLICY "admin_full_access_crawl_exec" ON findably_crawl_executions
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('hidream72@gmail.com')
  );

CREATE POLICY "admin_full_access_alerts" ON findably_alerts
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('hidream72@gmail.com')
  );

-- n8n 서비스 역할 (service_role key로 접근 — RLS 우회)
-- n8n은 service_role key를 사용하므로 별도 정책 불필요
-- Supabase service_role은 RLS를 우회함


-- 5. 대시보드용 뷰 (편의)

-- 최근 24시간 헬스체크 요약
CREATE OR REPLACE VIEW v_health_summary_24h AS
SELECT 
  overall_status,
  COUNT(*) as check_count,
  MIN(created_at) as first_at,
  MAX(created_at) as last_at
FROM findably_pipeline_health
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY overall_status
ORDER BY 
  CASE overall_status 
    WHEN 'critical' THEN 1 
    WHEN 'warning' THEN 2 
    ELSE 3 
  END;

-- 최근 7일 크롤 성공률
CREATE OR REPLACE VIEW v_crawl_success_rate_7d AS
SELECT 
  DATE(created_at) as day,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'success') as success,
  COUNT(*) FILTER (WHERE status = 'partial') as partial,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'quality_rejected') as rejected,
  ROUND(AVG(data_completeness)) as avg_completeness,
  ROUND(AVG(duration_sec)) as avg_duration_sec
FROM findably_crawl_executions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- 미확인 알림
CREATE OR REPLACE VIEW v_unacknowledged_alerts AS
SELECT *
FROM findably_alerts
WHERE acknowledged = FALSE
ORDER BY created_at DESC;
