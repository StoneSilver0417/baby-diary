# baby-diary - Handoff

## 현재 상태

- **버전**: v0.5.0 (그림일기 디자인 리뉴얼)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과 (번들 665KB / gzip 191KB, 폰트 별도)
- **배포 상태**: 미배포 (로컬 `npm run dev`로만 실행 중)
- **실행 방법/URL**: `npm run dev` → `.env.local`에 실제 Supabase URL/anon key 설정됨(`VITE_USE_MOCK=false`). 로그인 계정은 부부가 대시보드에서 만든 실제 이메일(별도 기록 필요 — 이 저장소엔 없음).

## 최근 작업

- **그림일기 컨셉 디자인 리뉴얼**: 귀엽고 아기자기한 톤 + 손글씨 느낌으로 전면 개편.
  - `@fontsource/hi-melody` self-host 설치, `font-hand` 유틸(Tailwind `--font-hand` 토큰)로 **일기 탭에만** 적용(성장·투자 탭은 숫자 가독성 위해 기존 폰트 유지).
  - `src/index.css`에 그림일기 유틸 추가: `paper-lines`(줄노트 배경), `polaroid`/`polaroid-tilt-left/right`(사진 프레임+회전), `tape`(마스킹테이프 pseudo-element), `sticker`(뱃지). 파스텔 보조 팔레트(`--sticker-*`) 추가, `--radius` 0.75→1rem.
  - 이모지 대신 직접 그린 손그림 SVG 세트(`src/assets/doodles/`: Sun·Cloud·Star·Footprint) — 날짜 헤더, 로그인 화면, 스플래시 화면 장식에 사용.
  - 적용 파일: `FeedPage`(카드=폴라로이드 사진+줄노트 캡션), `EntryDetailPage`(paper-lines 본문, sticker 좋아요 버튼), `EntryEditorPage`(폴라로이드 사진 슬롯, 줄노트 textarea), `AlbumPage`(교차 회전 폴라로이드 그리드), `AppShell`(하단 탭 활성 pill), `LoginPage`+신규 `SplashScreen.tsx`(세션 확인 중 로딩 화면 — 기존엔 텍스트만 있던 것을 브랜드 로딩 화면으로 교체).
  - **부수 버그 수정**: `EntryEditorPage`의 기존 사진 미리보기가 `storage_path`(실모드에선 스토리지 경로, URL 아님)를 그대로 `img src`로 써서 실모드에서 깨지던 문제 — `usePhotoUrls`로 서명 URL 변환하도록 수정. `EntryDetailPage`에서 사진 없는 일기도 빈 폴라로이드 액자가 렌더되던 문제 — `entry.photos.length > 0`일 때만 렌더하도록 수정.
  - Playwright(390×844, mock 모드로 임시 전환해 검증 후 원복)로 로그인·피드·상세(사진 1장/좋아요)·작성(사진 업로드)·앨범(사진 2장)·성장·투자·스플래시 전 화면 스크린샷 확인. 콘솔 에러 0건.
- **(보류) Cloudflare R2 사진 저장소 분리 설계**: 무료 Storage 압박 시를 대비해 Worker presign 방식 설계를 `docs/r2-photo-plan.md`에 문서화만 해둠 — 코드 미적용, 실행 안 함.

## 알려진 이슈

- **부부 실제 로그인 정보(이메일/비밀번호)는 이 문서에 없음** — 보안상 기록하지 않음. 대시보드 Authentication → Users에서 UID로 계정 관리 가능. 비밀번호를 잊으면 대시보드에서 재설정.
- PWA(vite-plugin-pwa)·Capacitor Android 빌드는 아직 미착수.
- 번들 665KB(gzip 191KB) 경고 — v1에서는 code-splitting 안 함, 필요 시 추후 처리. Hi Melody 한글 서브셋(woff2, unicode-range 분할)이 다수 추가됐지만 브라우저가 실제 쓰는 서브셋만 받아가므로 실사용 전송량 영향은 적음.
- `src/types/database.ts`는 여전히 수동 작성 타입(gen-types 미적용) — 조인 결과를 `mapRawEntry`로 직접 정규화하는 구조라 자동 생성 타입과 단순 교체가 안 됨.
- claude.ai/design 연동(디자인 시스템 프로젝트 보관)은 사용자가 보류 결정 — 필요해지면 재논의.

## 다음 TODO

1. [ ] vite-plugin-pwa 설정 (manifest·아이콘·SW, iOS 홈화면 추가 안내 배너) — 아이콘도 이번 그림일기 톤에 맞춰 제작 필요
2. [ ] Capacitor 7 Android 추가 (`npx cap add android`), JDK 21(`C:\java\jdk-21.0.11+10`, 시스템 JAVA_HOME 사용 금지) + Gradle 8.14로 APK 빌드, `lib/photoPicker.ts`에 네이티브 분기 추가
3. [ ] Vercel 배포 + 실기기(안드로이드 APK 수동 설치, 아이폰 홈화면 추가) 검증
4. [ ] (지인 확장 시) 가입 → 가족 생성/초대코드로 배우자 합류 온보딩 화면. 스키마·RLS는 이미 멀티테넌트라 앱 온보딩 UI만 추가하면 됨. 무료 플랜은 2~3가족까지 여유, 5가족 이상 활발하면 스토리지 1GB·전송 5GB 압박 → Pro($25/월) 또는 이미지 압축 강화.
5. [ ] (저장소 압박 시) 사진만 Cloudflare R2로 분리 — 설계는 `docs/r2-photo-plan.md`에 보존, 아직 미실행.
