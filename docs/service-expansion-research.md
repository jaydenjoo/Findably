# Findably 서비스 확장 리서치 — 고객 사이트 수정 대행

> 작성일: 2026-04-13
> 목적: 분석 리포트 기반으로 고객이 "고쳐주세요" 요청 시 서비스 모델 설계
> 상태: Jayden 검토 대기

---

## 1. 배경

Findably는 현재 "진단 → 리포트 → 고객이 직접 수정" 모델. 하지만 고객 대부분은:

- 코드를 모름 (비개발자 소상공인)
- 개발자가 없음 (1인 쇼핑몰)
- 사이트 접근 방법을 모름 (임대형 호스팅)
- 보안 걱정으로 접근 권한 주기 싫음

"진단만 하고 끝"이면 고객이 실행을 못 해서 이탈. "진단 + 실행"까지 해야 재구매.

---

## 2. 한국 시장의 웹사이트 유형 분류

| 유형                 | 예시                           | 시장 비중 (추정) | SEO 수정 자유도 | 개발자 존재 |
| -------------------- | ------------------------------ | ---------------- | --------------- | ----------- |
| **A. 임대형 쇼핑몰** | 카페24, 고도몰, 아임웹, 식스샵 | ~40%             | 중간            | 없음        |
| **B. 플랫폼 입점**   | 스마트스토어, 쿠팡             | ~30%             | 극히 낮음       | 없음        |
| **C. WordPress**     | 호스팅 + WP                    | ~15%             | 높음            | 일부        |
| **D. 직접 개발**     | Next.js, React 등              | ~10%             | 완전함          | 있음        |
| **E. 해외 빌더**     | Wix, Squarespace, Webflow      | ~5%              | 중간            | 없음        |

### 유형별 SEO 수정 가능 범위

| 항목             | 카페24         | 스마트스토어 | WordPress      | 직접 개발 | Wix    |
| ---------------- | -------------- | ------------ | -------------- | --------- | ------ |
| title 태그       | 관리자 GUI     | 상품명만     | 완전 통제      | 완전 통제 | GUI    |
| meta description | 관리자 GUI     | 상품설명만   | 완전 통제      | 완전 통제 | GUI    |
| canonical URL    | 자동 생성      | 불가         | 플러그인       | 완전 통제 | 자동   |
| Schema Markup    | head 코드 삽입 | 불가         | 플러그인       | 완전 통제 | 제한적 |
| OG 태그          | 관리자 GUI     | 제한적       | 플러그인       | 완전 통제 | GUI    |
| robots.txt       | 불가           | 불가         | 파일 직접 수정 | 완전 통제 | GUI    |
| sitemap.xml      | 자동 생성      | 자동         | 플러그인       | 완전 통제 | 자동   |
| 서버 속도 최적화 | 불가           | 불가         | 호스팅 변경    | 가능      | 불가   |

---

## 3. 고객 사이트 접근 방법 — 5단계

### Level 0: 가이드 제공 (현재 Findably)

```
리포트 → "이렇게 고치세요" 텍스트 + 코드 스니펫 → 고객이 직접 적용
```

- 장점: 보안 이슈 없음, 책임 한계 명확
- 단점: 고객이 못 함 → 이탈
- 대상: 개발팀 보유 고객 (유형 D)

### Level 1: Google Tag Manager (GTM) 주입

```
고객이 GTM 컨테이너 ID 공유 → Findably가 GTM에서 Schema/OG/메타 태그 주입
```

**작동 원리**: GTM Custom HTML 태그로 JSON-LD를 동적 주입. 사이트 코드 수정 없이 가능.

**고객 필요 작업**:

1. GTM 스니펫 1개를 사이트에 붙이기 (카페24: 관리자 > 고급 설정 > head에 붙여넣기)
2. Findably에 GTM 편집 권한 부여 (Google 계정 기반)

**적용 가능 항목**:

- Schema Markup (Organization, FAQ, Product, HowTo 등)
- OG 태그 (og:title, og:description, og:image)
- canonical 메타 태그
- robots 메타 태그
- 이벤트 추적 (GA4 연동)

**적용 불가 항목**:

- `<title>` 태그 (서버 렌더링 필요)
- robots.txt, sitemap.xml (파일 레벨)
- 서버 응답 속도

**보안**:

- 고객 사이트 FTP/서버 접근 불필요
- GTM은 Google 계정 권한 체계로 관리 (읽기/쓰기 분리 가능)
- 고객이 언제든 권한 회수 가능

**호환 플랫폼**: 카페24 ✅, WordPress ✅, Wix ✅, Shopify ✅, 자체 개발 ✅, 아임웹 ✅

**레퍼런스**: 2026년 기준 GTM으로 Schema Markup 자동 주입은 업계 표준 방법. 개발자/플러그인 없이 ChatGPT로 JSON-LD 생성 → GTM에 배포하는 가이드가 다수 존재.

### Level 2: Cloudflare Edge SEO

```
고객이 DNS를 Cloudflare로 변경 → Cloudflare Worker가 HTML 응답에 태그 주입
```

**작동 원리**: CDN 엣지에서 HTML 응답을 가로채서 `<head>`에 메타/스키마 주입. 원본 서버 접근 완전히 불필요.

**고객 필요 작업**:

1. DNS 네임서버를 Cloudflare로 변경 (5분, 도메인 관리에서)
2. 반영까지 15분~4시간

**적용 가능 항목**: GTM의 모든 것 + `<title>` 태그, 리다이렉트, HTTP 헤더, hreflang — **거의 모든 SEO 항목**

**성능**: 라운드트립 레이턴시 10ms 미만 (CDN PoP에서 처리)

**보안**: 원본 서버 접근 0. DNS 레벨만 연결.

**호환 플랫폼**: 자체 도메인이 있는 모든 사이트 (스마트스토어 제외 — 자체 도메인 없음)

**비용**: Cloudflare Workers 무료 티어 일일 10만 건. 대부분의 소상공인 사이트에 충분.

**레퍼런스**: 2026년 트렌드로 "Edge SEO"가 부상. Cloudflare Workers, Akamai EdgeWorkers, Netlify Edge Functions이 SEO 최적화의 핵심 요소로 자리잡음.

### Level 3: CMS 관리자 대행

```
고객이 카페24/WordPress 관리자 접근 권한 부여 → Findably가 직접 로그인해서 수정
```

**카페24 접근 경로**:

- 관리자 > 쇼핑몰 설정 > 기본 설정 > 검색엔진 최적화(SEO) → 메타태그/title/description
- 관리자 > 상품 > 상품목록 > 상품별 SEO 설정
- 관리자 > 고급 설정 > `<head>` 코드 직접 삽입 (Schema, GTM 등)

**WordPress 접근**:

- AIOSEO/Rank Math 플러그인의 Access Control로 "SEO 편집자" 역할 부여
- SEO 설정만 수정 가능, 콘텐츠는 수정 불가 (보안)

**보안 주의사항**:

- 마스터 계정 공유 금지 → 전용 하위 계정 생성 권장
- 작업 전후 스크린샷 기록
- 작업 완료 후 비밀번호 변경 안내

### Level 4: API 연동 (자동화)

```
고객 사이트의 CMS API에 Findably가 연결 → 자동으로 수정 적용
```

| CMS       | API                   | 자동화 가능 범위                        |
| --------- | --------------------- | --------------------------------------- |
| WordPress | REST API + AIOSEO API | 메타 태그, Schema, sitemap, robots 전체 |
| Shopify   | Admin API             | 메타 태그, theme.liquid 수정            |
| 카페24    | Open API (제한적)     | 상품 SEO 설정, 일부 메타                |
| Wix       | Velo API              | 페이지 SEO 설정                         |

**레퍼런스**: AIOSEO REST API는 application passwords 인증으로 안전. 대량 업데이트 지원.

---

## 4. 고객 상황별 최적 서비스 매핑

| 고객 상황               | 고객 심리                     | 최적 Level           | Findably 제안                                               |
| ----------------------- | ----------------------------- | -------------------- | ----------------------------------------------------------- |
| 카페24 쇼핑몰 사장님    | "코드요? 그게 뭐예요"         | Level 1 (GTM)        | "이 코드 1줄만 붙이세요, 나머지는 저희가 합니다"            |
| WordPress 사이트 운영자 | "플러그인은 깔 수 있어요"     | Level 3 (관리자)     | SEO 플러그인 설치 + 편집자 권한 부여                        |
| 스마트스토어 판매자     | "메타태그 수정이 안 돼요"     | 솔직한 안내          | "스마트스토어는 SEO 제한이 있어요. 자사몰 전환 컨설팅 제공" |
| 자체 개발팀 보유        | "코드 줘, 우리가 적용할게"    | Level 0 (가이드)     | 현재 리포트 + 코드 스니펫으로 충분                          |
| 보안 걱정 고객          | "우리 사이트 접근 안 돼요"    | Level 2 (Cloudflare) | "서버 접근 없이 DNS만 변경하면 됩니다"                      |
| 여러 사이트 운영 기업   | "전부 한번에 관리하고 싶어요" | Level 4 (API)        | API 연동으로 자동 모니터링 + 수정                           |

---

## 5. 서비스 모델 — 5가지 옵션

### 모델 1: 원클릭 자동 수정 (Code Generation) — 현재 기반 있음

- 리포트에서 "고치기" 클릭 → 코드 자동 생성 → 복사/적용
- PRD Epic 7.5~7.7이 이미 이 영역
- 수익: 포함 (9.9만원/건)
- 장점: 개발 비용 낮음
- 한계: 고객이 코드를 직접 붙여야 함

### 모델 2: CMS 플러그인 자동 적용 (Zero-Touch)

- WordPress/Shopify/카페24 플러그인 설치 → Findably가 원격으로 수정 적용
- 레퍼런스: CapstonAI WordPress Agent — schema, meta, alt text 원클릭 적용
- 수익: 월 구독 5~19만원/사이트
- 장점: 비개발자도 사용 가능
- 한계: CMS별 플러그인 개발 필요

### 모델 3: 전문가 매칭 마켓플레이스

- 리포트의 "이 항목 고치기" → 검증된 프리랜서/에이전시 매칭
- 레퍼런스: Upwork, 크몽/숨고 SEO 카테고리
- 수익: 중개 수수료 15~20%
- 가격대: 항목별 5~50만원
- 장점: 개발 부담 없음
- 한계: 품질 관리, 파트너 모집

### 모델 4: Managed Service (직접 대행)

- 진단 리포트 기반으로 Findably 팀이 직접 수정 대행
- 글로벌 가격: 월 $1,500~$5,000. 한국 SEO 대행: 월 150~500만원
- 수익: 항목별 또는 월 리테이너
- 장점: 고객 만족 극대화, 고단가
- 한계: 인력 필요, 스케일 어려움

### 모델 5: AI 에이전트 자동 실행 (2026 트렌드)

- AI가 리포트를 읽고, 고객 사이트에 직접 접속하여 수정 실행
- 레퍼런스: Scrunch AI AXP, DejaFlow (자동화 기술 SEO가 68% 랭킹 이슈 해결)
- 수익: 월 구독 — 자동 모니터링 + 자동 수정 번들
- 장점: 완전 자동화, 무한 스케일
- 한계: 사이트 접근 권한 이슈, 기술 복잡도

---

## 6. Findably 서비스 티어 설계 (제안)

| 티어     | 이름      | 가격        | 포함 내용                                              | 대상             |
| -------- | --------- | ----------- | ------------------------------------------------------ | ---------------- |
| **Free** | 무료 진단 | 0원         | 간단 리포트 + Quick Win 1개 코드                       | 모든 방문자      |
| **Pro**  | 상세 진단 | 9.9만원/건  | 60개+ 항목 + PDF + 90일 로드맵 + 코드 생성             | 개발팀 보유 고객 |
| **Fix**  | 대행 수정 | 29.9만원/건 | GTM 설정 + Schema/OG/메타 전체 적용 + 적용 확인 리포트 | 비개발자         |
| **Care** | 월간 관리 | 19.9만원/월 | 월 1회 재진단 + 변경사항 자동 적용 + 카나리 모니터링   | 장기 고객        |

### Fix 티어 작업 흐름

```
1. 고객이 "대행 수정" 결제 (29.9만원)
2. 온보딩 설문:
   - CMS 유형: [카페24 / WordPress / Shopify / Wix / 직접 개발 / 기타]
   - 접근 방법 선호: [GTM / Cloudflare / 관리자 위임 / API]
   - 보안 우려: [있음 / 없음]
3. Findably가 접근 방법 추천 + 가이드 발송 (고객이 3분 이내 완료할 수 있는 수준)
4. 고객이 접근 권한 부여
5. Findably가 리포트 기반으로 수정 실행 (1~3 영업일)
6. 적용 후 재진단 → "수정 전/후 비교 리포트" 발송
7. 30일 보증 — 적용 후 점수 하락 시 무상 재수정
```

### Care 티어 작업 흐름

```
월간 사이클:
1주차: 자동 재진단 (카나리 시스템 활용)
2주차: 변경사항 감지 → 자동/수동 수정 적용
3주차: 경쟁사 변화 모니터링 (Phase 2)
4주차: 월간 리포트 발송 (점수 변화 + 수정 내역 + 다음 달 계획)
```

---

## 7. 보안 이슈 대응 매트릭스

| 고객 우려      | Level 1 (GTM)             | Level 2 (Cloudflare)        | Level 3 (관리자) |
| -------------- | ------------------------- | --------------------------- | ---------------- |
| 비밀번호 공유  | 불필요 (Google 계정 권한) | 불필요 (DNS만)              | 하위 계정 생성   |
| 서버 접근      | 없음                      | 없음                        | CMS 관리자만     |
| 수정 잘못되면? | GTM 태그 삭제로 즉시 원복 | Worker 비활성화로 즉시 원복 | 수정 전 백업     |
| 법적 책임      | 서비스 약관에 범위 명시   | 동일                        | NDA + 작업 로그  |
| 데이터 유출    | 사이트 데이터 접근 없음   | HTML만 통과 (저장 안 함)    | 최소 권한 원칙   |

### 보안 서비스 약관 필수 조항

1. 작업 범위 명시: "SEO 메타 태그, Schema Markup, OG 태그에 한정. 콘텐츠, 디자인, 결제 시스템 접근 불가"
2. 작업 로그 투명 공개: 수정 전/후 스크린샷 + 변경 코드 전체 공유
3. 즉시 원복 보장: 고객 요청 시 24시간 내 원래 상태로 복구
4. 접근 권한 시한: 작업 완료 후 7일 이내 권한 자동 회수
5. 손해배상: 작업으로 인한 사이트 장애 시 결제 금액 전액 환불

---

## 8. 스마트스토어 고객 대응 전략

스마트스토어는 메타태그 수정이 불가능하여 일반적인 SEO 대행이 어려움. 대안:

### 할 수 있는 것

- 상품명 키워드 최적화 (네이버 검색 알고리즘 대응)
- 상품 상세 설명 구조화 (H2/H3 활용)
- 스토어 소개 최적화
- 네이버 쇼핑 검색 노출 전략

### 할 수 없는 것

- 구글 SEO (스마트스토어는 구글 노출 극히 제한)
- Schema Markup
- OG 태그 커스터마이징
- robots.txt / sitemap 제어

### Findably 대응

1. 진단 시 "스마트스토어" 감지 → 제한사항 명시 리포트 생성
2. "자사몰 전환 컨설팅" 서비스 제안 (카페24/아임웹으로 이전 가이드)
3. 네이버 쇼핑 SEO 전용 진단 모듈 (Phase 3 검토)

---

## 9. 추천 로드맵

| 단계        | 시점      | 서비스                 | 접근 방법   | 월 매출 기대         |
| ----------- | --------- | ---------------------- | ----------- | -------------------- |
| **Phase 1** | 즉시      | Fix 티어 (GTM 기반)    | Level 1     | 건당 29.9만원        |
| **Phase 1** | 즉시      | "전문가 상담" CTA 추가 | Google Form | 수요 검증 (비용 0원) |
| **Phase 2** | 3개월 후  | Care 티어 (월간 관리)  | Level 1+3   | 월 19.9만원/사이트   |
| **Phase 2** | 3개월 후  | Cloudflare Edge 대행   | Level 2     | 포함 (Fix/Care)      |
| **Phase 3** | 6개월 후  | WordPress 플러그인     | Level 4 API | 월 5~19만원/사이트   |
| **Phase 4** | 12개월 후 | AI 자동 수정 에이전트  | Level 4+5   | 월 구독              |

### 가장 빠르게 시작할 수 있는 방법 (개발 0줄)

리포트 하단에 "전문가 상담 요청" 버튼 추가:

1. 클릭 → Google Form (사이트 URL + 수정 희망 항목 체크)
2. Jayden이 직접 견적 → GTM 기반 대행 or 파트너 연결
3. 수요가 검증되면 Fix 티어 시스템 개발

**비용 0원, 개발 0줄, 수요 먼저 검증.**

---

## 10. 시장 가격 참고

### 글로벌 SEO 서비스 가격 (2026)

| 서비스 유형            | 가격 범위                    |
| ---------------------- | ---------------------------- |
| 원타임 SEO 감사        | $300~$50,000 (사이트 규모별) |
| 소규모 월간 SEO        | $1,500~$5,000/월             |
| 엔터프라이즈 SEO       | $7,500+/월                   |
| 감사 + 구현 하이브리드 | 초기비 + 월 $501~$2,000      |

### 한국 SEO 대행 가격 (2026)

| 서비스 유형            | 가격 범위      |
| ---------------------- | -------------- |
| SEO 진단 리포트        | 50~200만원/건  |
| 월간 SEO 관리          | 150~500만원/월 |
| 기술 SEO 수정 (일회성) | 30~100만원     |
| 콘텐츠 SEO (월간)      | 100~300만원/월 |

### Findably 가격 포지셔닝

```
에이전시 월 리테이너: 150~500만원/월 ← 대기업 타겟
                ↑ 비쌈
Findably Fix:   29.9만원/건 ← 소상공인 타겟 (1/5~1/15 가격)
Findably Care:  19.9만원/월
                ↓
Findably Pro:   9.9만원/건
                ↓ 저렴
무료 진단:      0원
```

"에이전시의 1/10 가격으로 80%의 효과" — 이것이 Findably의 포지셔닝.

---

## Sources

- [GTM으로 Schema Markup 자동화](https://medium.com/@manishpersues/how-to-automate-schema-markup-using-google-tag-manager-and-chatgpt-without-developers-or-plugins-679283334a42)
- [Cloudflare Workers Edge SEO](https://www.overthetopseo.com/edge-seo-using-cloudflare-workers-to-deploy-changes-instantly-2/)
- [Edge Meta Injection 기술](https://seojuice.io/glossary/seo/technical-seo/edge-meta-injection/)
- [CapstonAI WordPress Agent](https://capston.ai/ai-wordpress-seo-7-powerful-tools-auto/)
- [카페24 SEO 기본 설정](https://support.cafe24.com/hc/ko/articles/7671792396569)
- [카페24 고급 설정 head 코드 삽입](https://support.cafe24.com/hc/ko/articles/7671862495641)
- [AIOSEO Access Control](https://wordpress.com/blog/2026/02/25/best-wordpress-seo-plugins/)
- [자동화 기술 SEO 68% 이슈 해결](https://www.dejaflow.com/blog/2026/04/07/how-does-automated-technical-seo-fix-68-of-ranking-issues-without-developer-resources/)
- [2026 SEO 서비스 가격 가이드](https://almcorp.com/blog/seo-pricing-guide-2026-how-much-does-seo-really-cost/)
- [SEO Audit 가격 책정](https://fhseohub.com/how-much-to-charge-for-an-seo-audit/)
- [CMS 시장 73% 점유](https://www.searchenginejournal.com/3-cms-platforms-control-73-of-the-market-shape-technical-seo-defaults/568185/)
- [SEO in 2026 트렌드](https://searchengineland.com/seo-2026-higher-standards-ai-influence-web-catching-up-473540)
