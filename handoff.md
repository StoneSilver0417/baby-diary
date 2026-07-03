# baby-diary - Handoff

## 현재 상태

- **버전**: v0.1.0 (mock 모드 핵심 기능 완성, Supabase 미연결)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과
- **배포 상태**: 미배포
- **실행 방법/URL**: `npm run dev` (기본 mock 모드, `.env.local`의 `VITE_USE_MOCK=true`). 로그인 계정: `appa@family.test` / `omma@family.test`, 비밀번호 둘 다 `test1234`

## 최근 작업

- 스캐폴드부터 핵심 기능까지 전 구간 구현: 인증(mock+실제 분기) → 앱 셸(하단 탭 3개) → 일기 피드/작성·수정/상세(댓글·좋아요 옵티미스틱) → 투자 탭(거래 CRUD+보유현황 집계) → 새 글 뱃지 → 설정. Playwright MCP로 모바일 뷰포트(390×844)에서 로그인→작성(사진 3장, 4장째 차단)→수정 모드 진입→댓글/좋아요→투자 거래/매도 집계→로그아웃까지 전 플로우 검증 완료.
- Supabase 마이그레이션 SQL(`supabase/migrations/0001_initial_schema.sql`) 작성 완료 — 7개 테이블 + RLS + 사진 3장 트리거 + storage 정책. **아직 실제 프로젝트에 적용 안 함** (사용자가 "일단 나중에"로 보류).

## 알려진 이슈

- **Supabase 미연결**: `.env.local`에 URL/키 없음, `VITE_USE_MOCK=true`로 인메모리 mock(`src/lib/mockDb.ts`)만 동작. 실제 데이터는 브라우저 전체 새로고침 시 초기화됨(의도된 동작).
- PWA(vite-plugin-pwa)·Capacitor Android 빌드는 아직 미착수.
- 번들 633KB(gzip 185KB) 경고 — v1에서는 code-splitting 안 함, 필요 시 추후 처리.

## 다음 TODO

1. [ ] 사용자가 Supabase 새 조직/프로젝트 생성 → `.env.local`에 URL/anon key 입력, `VITE_USE_MOCK=false`
2. [ ] `supabase/migrations/0001_initial_schema.sql`을 SQL Editor에 적용, 이메일 회원가입 비활성화, 부부 2계정 생성 후 profiles/children 시드
3. [ ] `npx supabase gen types typescript`로 `src/types/database.ts`를 실제 스키마 타입으로 교체 검증
4. [ ] vite-plugin-pwa 설정 (manifest·아이콘·SW, iOS 홈화면 추가 안내 배너)
5. [ ] Capacitor 7 Android 추가 (`npx cap add android`), JDK 21(`C:\java\jdk-21.0.11+10`, 시스템 JAVA_HOME 사용 금지) + Gradle 8.14로 APK 빌드, `lib/photoPicker.ts`에 네이티브 분기 추가
6. [ ] Vercel 배포 + 실기기(안드로이드 APK 수동 설치, 아이폰 홈화면 추가) 검증
