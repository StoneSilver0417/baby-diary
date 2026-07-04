# baby-diary - Handoff

## 현재 상태

- **버전**: v0.3.0 (mock 모드 — household 멀티테넌트 스키마로 개편, Supabase 미연결)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과 (번들 663KB / gzip 191KB)
- **배포 상태**: 미배포
- **실행 방법/URL**: `npm run dev` (기본 mock 모드, `.env.local`의 `VITE_USE_MOCK=true`). 로그인 계정: `appa@family.test` / `omma@family.test`, 비밀번호 둘 다 `test1234`

## 최근 작업

- **household(가족) 멀티테넌트 개편**: 지인도 각자 자기 자녀 일기를 기록할 수 있도록, 모든 데이터를 가족 단위로 격리. `households` 테이블 + 모든 테이블에 `household_id` + RLS를 "내 household만"으로(`my_household_id()` 헬퍼). `stock_prices`는 종목명 전역 PK → `(household_id, stock_name)` 복합 PK로 변경(가족 간 현재가 충돌 방지). Storage 경로도 `{household_id}/...`로 격리. 쓰기 경로 전부에 household_id 주입(`useHouseholdId` 훅), mock은 단일 가족(`HOUSEHOLD_ID`)으로 시뮬레이션. 아직 온보딩(가입/초대) 화면은 없음 — 지인이 실제 생길 때 추가.
- 추가 기능 3영역 구현 완료 (전부 mock 모드에서 Playwright 390×844 검증):
  - **일기 편의**: 일기·댓글 삭제(본인 것만, 소유권 검증), 4탭 네비(일기/성장/투자/설정) + 일기 탭 세그먼트(피드/캘린더/앨범), 캘린더 보기(date-fns 월 그리드), 사진 앨범(3열 그리드), 검색.
  - **성장**: 성장기록 CRUD + 직접 SVG 곡선 차트(키/몸무게 토글, 라이브러리 미추가), 마일스톤(D+N일 타임라인, 프리셋 칩).
  - **투자 확장**: 수동 현재가 입력 → 평가금액·수익률(검산 정확: 현재가 80,000 → +14.3%), 배당 기록, 연도별 요약.
- 0002 마이그레이션 SQL(`supabase/migrations/0002_growth_invest.sql`) 작성 — growth_records/milestones/dividends/stock_prices + RLS. **적용은 0001과 함께 보류.**

## 알려진 이슈

- **Supabase 미연결**: `.env.local`에 URL/키 없음, `VITE_USE_MOCK=true`로 인메모리 mock(`src/lib/mockDb.ts`)만 동작. 데이터는 브라우저 **전체 새로고침(`page.goto` 포함) 시 초기화**됨(의도된 동작) — 검증 시 앱 내 링크 클릭으로 이동해야 상태 유지.
- PWA(vite-plugin-pwa)·Capacitor Android 빌드는 아직 미착수.
- 번들 663KB(gzip 191KB) 경고 — v1에서는 code-splitting 안 함, 필요 시 추후 처리.

## 다음 TODO

1. [ ] 사용자가 Supabase 새 조직/프로젝트 생성 → `.env.local`에 URL/anon key 입력, `VITE_USE_MOCK=false`
2. [ ] `0001_initial_schema.sql` → `0002_growth_invest.sql` 순서로 SQL Editor 적용. **household 1개 생성 후** 그 id로 profiles(부부 2계정)·children 시드(각 SQL 하단 주석 참고). 부부만 쓸 땐 이메일 회원가입 비활성화.
7. [ ] (지인 확장 시) 가입 → 가족 생성/초대코드로 배우자 합류 온보딩 화면. 스키마·RLS는 이미 멀티테넌트라 앱 온보딩 UI만 추가하면 됨. 무료 플랜은 2~3가족까지 여유, 5가족 이상 활발하면 스토리지 1GB·전송 5GB 압박 → Pro($25/월) 또는 이미지 압축 강화.
3. [ ] `npx supabase gen types typescript`로 `src/types/database.ts`를 실제 스키마 타입으로 교체 검증
4. [ ] vite-plugin-pwa 설정 (manifest·아이콘·SW, iOS 홈화면 추가 안내 배너)
5. [ ] Capacitor 7 Android 추가 (`npx cap add android`), JDK 21(`C:\java\jdk-21.0.11+10`, 시스템 JAVA_HOME 사용 금지) + Gradle 8.14로 APK 빌드, `lib/photoPicker.ts`에 네이티브 분기 추가
6. [ ] Vercel 배포 + 실기기(안드로이드 APK 수동 설치, 아이폰 홈화면 추가) 검증
