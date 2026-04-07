-- ============================================================
-- Findably: 모니터링 테이블 제약 보강 (011 후속)
-- 출처: code-reviewer 리뷰 LOW 이슈 (2026-04-07)
-- 목적:
--   1. findably_crawl_executions.diagnosis_id → diagnoses(id) FK 추가
--      → orphan record 방지 + 진단 삭제 시 cascade
--   2. findably_alerts(acknowledged, acknowledged_at) 일관성 CHECK
--      → acknowledged=true면 acknowledged_at 필수
-- 안전성: 011이 방금 적용되어 두 테이블 모두 0 row 상태 → ALTER 즉시 통과
-- ============================================================

-- ------------------------------------------------------------
-- 1. findably_crawl_executions.diagnosis_id FK
-- ------------------------------------------------------------
-- 진단 삭제 시 크롤 실행 기록도 함께 삭제 (감사 이력은 알림에서 보존).
-- chatsio-v1 공유 DB의 public.diagnoses는 Findably가 소유 (findably_diagnoses 마이그레이션 참조).
ALTER TABLE public.findably_crawl_executions
  ADD CONSTRAINT findably_crawl_executions_diagnosis_id_fkey
  FOREIGN KEY (diagnosis_id)
  REFERENCES public.diagnoses(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT findably_crawl_executions_diagnosis_id_fkey
  ON public.findably_crawl_executions
  IS '진단 레코드 삭제 시 크롤 실행 기록도 함께 삭제 (orphan 방지).';

-- ------------------------------------------------------------
-- 2. findably_alerts: acknowledged 일관성 CHECK
-- ------------------------------------------------------------
-- acknowledged=TRUE인데 acknowledged_at이 NULL인 비일관 상태 방지.
-- 대시보드 acknowledge 처리 코드가 timestamp 누락해도 DB가 막아준다.
ALTER TABLE public.findably_alerts
  ADD CONSTRAINT findably_alerts_ack_consistency
  CHECK (acknowledged = FALSE OR acknowledged_at IS NOT NULL);

COMMENT ON CONSTRAINT findably_alerts_ack_consistency
  ON public.findably_alerts
  IS 'acknowledged=true는 반드시 acknowledged_at 동반.';


-- ============================================================
-- 롤백 (필요 시 아래 주석 해제)
-- ============================================================
-- ALTER TABLE public.findably_alerts
--   DROP CONSTRAINT IF EXISTS findably_alerts_ack_consistency;
--
-- ALTER TABLE public.findably_crawl_executions
--   DROP CONSTRAINT IF EXISTS findably_crawl_executions_diagnosis_id_fkey;
