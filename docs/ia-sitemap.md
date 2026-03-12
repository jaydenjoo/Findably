# Site Map — [프로젝트명]
> /init-prd 실행 시 PRD 기반으로 자동 채워짐
> 이 문서에 없는 페이지는 만들지 않는다.
> URL 패턴: /[module]/[action]/[id]

## Public (비로그인)
```
/ (랜딩)
├── /login
├── /signup
├── /pricing
```

## Auth Required (로그인 필수)
```
/dashboard ← 메인 진입점
```

## 확장 규칙
- 새 모듈: 이 문서에 먼저 추가 → 승인 → 개발
- GNB 6개 이하 → 그대로 추가. 7개+ → "더보기" 드롭다운
