# Changelog

## 2026-07-04 (v0.1.0)

### 변경 사항
- 프로젝트 스캐폴드: Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui(new-york/neutral/lucide) + TanStack Query + react-router v8 + Supabase JS 클라이언트.
- 인증: `supabase-js` + `onAuthStateChange` 기반 `AuthProvider`, `ProtectedRoute`/`RedirectIfAuthed`, 로그인 화면. `VITE_USE_MOCK` 플래그로 Supabase 연결 전 인메모리 mock(`src/lib/mockDb.ts`) 전환 가능.
- 앱 셸(하단 탭 3개: 일기/투자/설정), 따뜻한 크림·코랄 톤 테마(`src/index.css` `@theme`).
- 육아일기: 피드(D+N일·개월 헤더, 날짜 역순 카드), 작성/수정(사진 3장 제한, 같은 날 재진입 시 자동 수정 모드, 리사이즈 1600px+WebP 압축 파이프라인, 업로드 실패 롤백), 상세(사진 캐러셀, 좋아요·댓글 옵티미스틱 업데이트).
- 투자 탭: 거래 기록(매수/매도) + 메모 CRUD, `holdings.ts` 순수함수로 종목별 수량·평단·투입원금 클라이언트 집계.
- 새 글 뱃지: `profiles.last_seen_diary_at` 기준선을 모듈 스코프 싱글턴으로 유지해 탭 이동 중에는 유지되고 다음 앱 실행부터 사라지도록 구현.
- 설정 화면: 아이 이름·생일, 표시 이름 수정, 로그아웃.
- Supabase 마이그레이션 SQL(`supabase/migrations/0001_initial_schema.sql`) 작성: 7개 테이블, RLS(authenticated 공유 + author 소유 제약), 사진 3장 강제 트리거, storage `photos` 버킷 정책.
- `vercel.json`(SPA rewrite) 작성.

### 의사결정 배경
- **queryKey/옵티미스틱 설계**: couple-finance는 Next.js Server Actions 기반이라 TanStack Query 패턴이 없어 새로 설계. 좋아요·댓글만 옵티미스틱 적용(빠른 반복 조작), 사진 업로드가 낀 일기 저장·투자 기록은 로딩 스피너 방식 유지(실패 시 사진 롤백이 더 중요).
- **새 글 뱃지 기준선을 useRef가 아닌 모듈 스코프 변수로 구현**: 최초 `useRef` 구현은 FeedPage가 탭 이동마다 언마운트되면서 기준선이 매번 리셋돼, 다른 탭 방문 후 돌아오면 뱃지가 사라지는 버그가 있었음(Playwright 검증 중 발견). 모듈 스코프로 옮겨 "이번 페이지 세션 동안 유지, 전체 새로고침 시에만 리셋"을 정확히 구현.
- **shadcn CLI 이슈**: `npx shadcn add`가 `vite.config.ts`의 `@` alias를 인식하지 못해 프로젝트 루트에 리터럴 `@/components/ui/...` 폴더를 생성함 — 생성 후 `src/components/ui/`로 수동 이동, `@` 폴더 삭제로 우회. 다음 세션에서 shadcn 컴포넌트 추가 시 동일 증상이면 같은 방식으로 처리할 것.
- **tsconfig `baseUrl` 제거**: 이 프로젝트의 TypeScript(~6.0.2)가 `baseUrl`을 deprecated로 처리해 빌드 실패 → `paths`만 남기고 제거(모던 TS의 `paths`-only 방식은 `baseUrl` 없이도 동작).
- **JSDoc 주석에 `*/` 리터럴 금지**: `src/lib/supabase.ts` 초안에서 주석 안에 `features/*/api.ts` 경로 표기가 `*/`로 해석되어 블록 주석이 조기 종료, 빌드 에러 발생 — 경로 표기 시 `*` 와일드카드 대신 말로 풀어써서 회피.
- **Supabase 프로젝트 생성 보류**: 사용자가 계정 권한이 필요한 작업(새 조직/프로젝트 생성)은 "일단 나중에"로 답변 → 마이그레이션 SQL만 준비해두고 실제 적용은 다음 세션 이후로 미룸. 그 사이 UI 검증은 mock 모드로 진행.
