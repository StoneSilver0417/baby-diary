# baby-diary - Handoff

## 현재 상태

- **버전**: v0.4.0 (실제 Supabase 연결 완료, 부부 계정으로 운영 가능)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과 (번들 661KB / gzip 190KB)
- **배포 상태**: 미배포 (로컬 `npm run dev`로만 실행 중)
- **실행 방법/URL**: `npm run dev` → `.env.local`에 실제 Supabase URL/anon key 설정됨(`VITE_USE_MOCK=false`). 로그인 계정은 부부가 대시보드에서 만든 실제 이메일(별도 기록 필요 — 이 저장소엔 없음).

## 최근 작업

- **실제 Supabase 프로젝트 연결**: 새 조직(계정은 기존 것 재사용, couple-finance와 별개)에 `baby-diary` 프로젝트 생성(Seoul 리전) → `0001_initial_schema.sql` → `0002_growth_invest.sql` 적용 → 이메일 회원가입 비활성화 → 부부 2계정 생성 → household 1개 + profiles 2개(엄마/아빠) + children 1개(도준, 2023-08-11) 시드 → `.env.local`을 `VITE_USE_MOCK=false`로 전환.
- **검증 중 발견해 고친 실버그 2건** (테스트 전용 임시 계정으로 검증, 완료 후 정리함):
  1. **PGRST201 임베드 모호성**: `diary_entries` select에서 `profiles(display_name)`가 `likes` 테이블을 통한 다대다 경로와 직접 FK 경로 둘 다와 매칭돼 PostgREST가 300 에러로 거부. `profiles!diary_entries_author_id_fkey(display_name)`로 FK 명시해 해결 (`src/features/diary/api.ts`, 3곳).
  2. **일기 삭제 후 406 레이스**: 삭제 성공 직후 `useDeleteEntry`가 캐시를 정리하는데, 그 시점에 상세 페이지가 아직 마운트돼 있어 삭제된 행을 재조회하다 406 발생. `EntryDetailPage.handleDeleteEntry`에서 **먼저 피드로 navigate → 그 다음 mutate** 순서로 바꿔 해결(페이지 언마운트로 쿼리 구독이 먼저 끊김).
- 실계정(테스트 계정)으로 전 플로우 확인: 로그인·세션 유지, 일기 작성(사진 압축→업로드→서명 URL 렌더까지 실제로 확인), 좋아요·댓글, 일기·댓글 삭제, 투자 거래 기록, 성장 기록 upsert. 콘솔 에러 0건.

## 알려진 이슈

- **부부 실제 로그인 정보(이메일/비밀번호)는 이 문서에 없음** — 보안상 기록하지 않음. 대시보드 Authentication → Users에서 UID로 계정 관리 가능. 비밀번호를 잊으면 대시보드에서 재설정.
- PWA(vite-plugin-pwa)·Capacitor Android 빌드는 아직 미착수.
- 번들 661KB(gzip 190KB) 경고 — v1에서는 code-splitting 안 함, 필요 시 추후 처리.
- `src/types/database.ts`는 여전히 수동 작성 타입(gen-types 미적용) — 조인 결과를 `mapRawEntry`로 직접 정규화하는 구조라 자동 생성 타입과 단순 교체가 안 됨.

## 다음 TODO

1. [ ] vite-plugin-pwa 설정 (manifest·아이콘·SW, iOS 홈화면 추가 안내 배너)
2. [ ] Capacitor 7 Android 추가 (`npx cap add android`), JDK 21(`C:\java\jdk-21.0.11+10`, 시스템 JAVA_HOME 사용 금지) + Gradle 8.14로 APK 빌드, `lib/photoPicker.ts`에 네이티브 분기 추가
3. [ ] Vercel 배포 + 실기기(안드로이드 APK 수동 설치, 아이폰 홈화면 추가) 검증
4. [ ] (지인 확장 시) 가입 → 가족 생성/초대코드로 배우자 합류 온보딩 화면. 스키마·RLS는 이미 멀티테넌트라 앱 온보딩 UI만 추가하면 됨. 무료 플랜은 2~3가족까지 여유, 5가족 이상 활발하면 스토리지 1GB·전송 5GB 압박 → Pro($25/월) 또는 이미지 압축 강화.
