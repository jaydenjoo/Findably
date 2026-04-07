# Findably 모니터링 대시보드 — 인터페이스 스펙

> **용도**: Next.js 대시보드 페이지 구현 시 참조
> **스코프**: n8n → Supabase 데이터가 저장된 상태에서 읽기 전용 대시보드
> **구현 주체**: Next.js 전문가 프롬프트 (별도 Task)

---

## 1. 라우트

```
/admin/monitor — 모니터링 대시보드 (admin만 접근)
```

## 2. Supabase 테이블/뷰 참조

| 데이터               | 소스                                    | 용도             |
| -------------------- | --------------------------------------- | ---------------- |
| 현재 파이프라인 상태 | `findably_pipeline_health` (최신 1건)   | 상단 상태 배지   |
| 24시간 상태 요약     | `v_health_summary_24h`                  | 상태 분포 차트   |
| 7일 크롤 성공률      | `v_crawl_success_rate_7d`               | 일별 트렌드 차트 |
| 미확인 알림          | `v_unacknowledged_alerts`               | 알림 목록        |
| 최근 크롤 실행       | `findably_crawl_executions` (최근 20건) | 실행 이력 테이블 |

## 3. 대시보드 레이아웃

```
┌──────────────────────────────────────────────┐
│ 🟢 Pipeline Status: HEALTHY     Last: 5m ago │  ← 상단 배지
├──────────┬──────────┬──────────┬─────────────┤
│ Vercel   │ Callback │ Firecrawl│ Observatory │  ← 4개 서비스 카드
│ ✅ 200   │ ✅ 400   │ ✅ 401  │ ✅ 200     │
├──────────┴──────────┴──────────┴─────────────┤
│ 📊 7-Day Crawl Success Rate                  │  ← 일별 바 차트
│ ████████░░ 89% │ ██████████ 100% │ ...       │
├──────────────────────────────────────────────┤
│ ⚠️ Unacknowledged Alerts (2)                 │  ← 알림 목록
│ • 04-07 09:30 — Callback redirect [308]      │
│ • 04-06 15:00 — Observatory down             │
│                            [Acknowledge All] │
├──────────────────────────────────────────────┤
│ 📋 Recent Crawl Executions                   │  ← 실행 이력
│ ID       │ URL          │ Status │ Time │ %  │
│ 638f2... │ example.com  │ ✅     │ 25s  │89% │
│ 7c0a7... │ test.kr      │ ⚠️     │ 130s │56% │
└──────────────────────────────────────────────┘
```

## 4. 핵심 쿼리

### 최신 파이프라인 상태

```sql
SELECT * FROM findably_pipeline_health
ORDER BY created_at DESC LIMIT 1;
```

### 24시간 체크 이력 (차트용)

```sql
SELECT
  date_trunc('hour', created_at) as hour,
  overall_status,
  checks
FROM findably_pipeline_health
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 알림 acknowledge

```sql
UPDATE findably_alerts
SET acknowledged = true, acknowledged_at = NOW()
WHERE id = $1;
```

## 5. 접근 제어

- `/admin/monitor` 라우트는 기존 admin 체크 패턴 사용
- `ACCESS.ADMIN_EMAILS` 배열에 포함된 이메일만 접근
- Supabase 조회는 서버 컴포넌트에서 service_role key 사용 (클라이언트 노출 금지)

## 6. 새로고침

- Server Component로 구현 (SSR)
- 30초마다 자동 새로고침: `router.refresh()` 또는 `revalidatePath`
- 수동 새로고침 버튼 포함

## 7. 상태 색상 매핑

| 상태     | 색상       | 아이콘 |
| -------- | ---------- | ------ |
| healthy  | green-500  | ✅     |
| warning  | yellow-500 | ⚠️     |
| critical | red-500    | 🚨     |
