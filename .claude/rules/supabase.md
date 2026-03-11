---
paths:
  - src/lib/supabase/**/*
  - src/db/**/*
  - supabase/**/*
  - src/actions/**/*
---

# Supabase 보안 규칙

## RLS (Row Level Security) — 필수

- 모든 테이블에 RLS 활성화 필수: `ALTER TABLE [name] ENABLE ROW LEVEL SECURITY;`
- RLS 없이 테이블 생성 금지. 테이블 생성 SQL에 RLS 활성화를 항상 포함
- RLS 정책 없으면 → 모든 접근 차단됨 (기본 거부 원칙)
- 정책 작성 시 `auth.uid()` 기반 사용자 격리 필수
- `public` 스키마 테이블은 반드시 anon/authenticated role 정책 분리

## 예시 (필수 패턴)

```sql
-- 테이블 생성 시 RLS 항상 포함
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 읽기
CREATE POLICY "Users read own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 본인 데이터만 수정
CREATE POLICY "Users update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

## service_role 키 사용 제한

- `service_role` 키 = RLS 우회 → 최소한으로 사용
- 사용 가능 상황: 관리자 백엔드, 웹훅 처리, 마이그레이션 스크립트
- 사용 시 반드시 주석으로 사유 기록: `// service_role 사유: [이유]`
- 클라이언트 코드(브라우저)에서 service_role 절대 금지
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 환경변수

## Storage (파일 저장소)

- Storage 버킷도 RLS 정책 필수
- Public 버킷: 읽기만 허용, 쓰기는 인증 사용자만
- Private 버킷: 본인 폴더만 접근 가능하게 설정
- 파일명에 사용자 입력 그대로 사용 금지 → sanitize 필수

## .env 규칙

- `NEXT_PUBLIC_SUPABASE_URL` — 공개 가능 (anon key와 함께 사용)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 공개 가능 (RLS가 보호)
- `SUPABASE_SERVICE_ROLE_KEY` — 절대 공개 금지, 서버 전용
- 의심되면: "이 키가 노출되면 모든 데이터가 털리는가?" → Yes면 서버 전용

## Moltbook 사례 교훈 (2026.01)

- RLS 미설정 Supabase DB → 150만 API 키 + 35,000 이메일 유출
- 원인: 바이브 코딩으로 빠르게 만들면서 RLS 설정 건너뜀
- 교훈: "RLS 없는 Supabase = 문 안 잠근 금고"
