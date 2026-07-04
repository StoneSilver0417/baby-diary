# Changelog

## 2026-07-04 (v0.3.0)

### 변경 사항
- **household(가족) 멀티테넌트 모델로 스키마 개편** — 지인도 각자 자기 자녀 일기를 기록하되 가족 간 데이터가 완전히 격리되도록 설계. Supabase 미적용 상태(운영 데이터 0)라 지금이 개편 최적기.
  - `households` 테이블 신설 + `profiles.household_id`(1인 1가족) + children/diary_entries/trades/invest_notes/growth_records/milestones/dividends에 `household_id`.
  - RLS를 "authenticated 전체 공유"에서 `household_id = my_household_id()`(SECURITY DEFINER 헬퍼 함수)로 전면 교체. diary_photos/comments/likes는 부모 엔트리의 household로 판정.
  - `stock_prices` PK를 `stock_name` → `(household_id, stock_name)` 복합키로(가족마다 같은 종목 현재가를 독립 보관).
  - Storage 경로를 `{author_id}/...` → `{household_id}/{entry_id}/...`로 바꾸고 정책도 첫 폴더=household로 격리.
  - 앱: `useHouseholdId()` 훅으로 현재 사용자의 household를 조회해 모든 쓰기 경로(일기 저장·거래·메모·배당·현재가·성장기록·마일스톤)에 주입. mock은 단일 가족(`HOUSEHOLD_ID`)으로 시뮬레이션(RLS가 없으므로 격리는 실제 Supabase에서만 발효).
- mock 전 쓰기 경로를 Playwright로 재검증: 일기 저장(사진 포함)·현재가 90,000 입력 → +28.6% 재계산 정확, 콘솔 에러 0건.

### 의사결정 배경
- **왜 지금**: 스키마 변경은 운영 데이터가 쌓인 뒤엔 마이그레이션 비용이 크지만, 아직 Supabase 미연결이라 파일 수정만으로 끝남. 지인 확장이 "언젠가"라도 스키마에는 미리 넣는 게 정답.
- **1인 1가족(household_id 컬럼) vs 다대다(join 테이블)**: "각 가족이 독립 공간" 요구에는 단일 컬럼이 충분하고 RLS가 단순해짐. 한 사람이 여러 가족에 속할 일이 생기면 그때 join으로 확장.
- **배당·현재가 격리**: 현재가가 종목명 전역 PK였으면 A가족이 삼성전자 현재가를 바꿀 때 B가족에도 반영되는 누수가 있었음 → 복합키로 차단.
- **온보딩은 스키마와 분리**: 지금은 부부 1가족만 수동 시드하면 되고, 가입/초대 UI는 지인이 실제 생길 때 추가(스키마·RLS는 이미 준비됨).

## 2026-07-04 (v0.2.0)

### 변경 사항
- **일기 편의 기능**: 일기·댓글 삭제(본인 것만, `deleteEntry`는 사진 storage 정리 후 삭제 / 댓글은 옵티미스틱). 하단 탭을 3→4개(일기/성장/투자/설정)로 확장하고 일기 탭에 보기 세그먼트(피드/캘린더/앨범) 도입. `CalendarPage`(date-fns 월 그리드, 일기 있는 날 점), `AlbumPage`(전체 사진 3열 그리드), `SearchPage`(일기·댓글 클라이언트 필터).
- **성장 탭 신설**(`src/features/growth/`): 성장기록 CRUD(같은 날짜 upsert) + `GrowthChart`(직접 SVG, 키/몸무게 토글 — 차트 라이브러리 미추가) + 마일스톤(D+N일 타임라인, 제목 프리셋 칩).
- **투자 확장**: `enrichHoldings` 순수함수로 수동 현재가 → 평가금액·수익률(±색)·총계 행, 보유 종목 탭 시 현재가 입력 시트. `dividends`(추가 시트 거래/배당/메모 3탭) + 타임라인 합류. `computeYearlySummary`로 연도별 매수·매도·배당 요약.
- 0002 마이그레이션(`supabase/migrations/0002_growth_invest.sql`): growth_records/milestones/dividends/stock_prices + RLS(부부 공용). database.ts 타입 4개, mockDb 시드, queryKeys 확장.

### 의사결정 배경
- **배당을 trades.side '배당'이 아닌 별도 `dividends` 테이블로**: 배당은 수량×단가가 아닌 "금액" 의미론이라 side를 늘리면 `computeHoldings`의 매수/매도 분기와 CHECK 제약을 오염시킴. 별도 테이블로 두어 holdings 로직 무수정.
- **현재가를 children jsonb가 아닌 `stock_prices(stock_name PK)` 테이블로**: trades가 stock_name 텍스트를 쓰므로 동일 키로 일관성 유지, RLS·타입·쿼리 무효화 단위가 깔끔.
- **성장 곡선은 recharts(gzip +100KB) 대신 직접 SVG**: 시리즈 2개(키/몸무게)를 토글로 하나씩만 표시 → dataviz 스킬의 "one axis" 원칙 준수(이중 축 회피), 단일 시리즈라 범례 불필요. 2px 선·r4 마커·recessive 축으로 ~150줄.
- **새 글 뱃지 회귀 방지 확인**: 4탭 전환 시에도 `useNewBadge`의 모듈 스코프 baseline 덕에 뱃지 유지됨(v0.1.0에서 수정한 내용). Playwright로 재확인.
- **mock 검증 시 `page.goto` 함정**: 전체 페이지 리로드는 인메모리 mockState를 초기화하므로, 새로 생성한 데이터를 확인하려면 앱 내 링크 클릭(client-side navigation)으로 이동해야 함 — 앨범 검증 중 발견해 방식 전환.

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
