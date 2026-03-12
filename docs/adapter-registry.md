# 어댑터 레지스트리 — [프로젝트명]
> 교체 가능성 있는 외부 서비스 = 어댑터 필수

| 서비스 | 현재 | 교체 후보 | 어댑터 경로 |
|--------|------|----------|-----------|
| AI | Claude API | OpenAI, Gemini | lib/adapters/ai.ts |
| 결제 | Toss Payments | Stripe | lib/adapters/payment.ts |
| 이메일 | Resend | Postmark | lib/adapters/email.ts |
| 인증 | Supabase Auth | Clerk | lib/adapters/auth.ts |
