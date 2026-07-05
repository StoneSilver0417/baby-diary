# baby-diary - Handoff

## 현재 상태

- **버전**: v0.6.0 (PWA 설정 완료)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과 (앱 번들 665KB/gzip 191KB, SW precache 194개 항목/3.8MB — 대부분 Hi Melody 폰트 서브셋)
- **배포 상태**: 미배포 (로컬 `npm run dev`/`npm run preview`로만 실행 중)
- **실행 방법/URL**: `npm run dev` → `.env.local`에 실제 Supabase URL/anon key 설정됨(`VITE_USE_MOCK=false`). 로그인 계정은 부부가 대시보드에서 만든 실제 이메일(별도 기록 필요 — 이 저장소엔 없음).

## 최근 작업

- **PWA 설정** (`vite-plugin-pwa`): 아이폰이 네이티브 빌드 불가라 PWA가 유일한 설치 경로.
  - 그림일기 톤에 맞춘 앱 아이콘을 직접 제작 (`src/assets/app-icon.svg` — 코랄 배경 + 폴라로이드 사진(해·언덕) + 별 스티커, 마스크러블 80% 안전영역 확인 완료). `scripts/generate-icons.mjs`(`npm run icons`, sharp 사용)로 `public/icons/`에 192·512·maskable-512·apple-touch-icon(180) PNG와 `public/favicon.png` 생성 — 기존 Vite 스캐폴드 기본 `favicon.svg`는 삭제.
  - `vite.config.ts`에 `VitePWA` 플러그인 추가: manifest(이름·설명·테마색·배경색·standalone·아이콘 3종), `registerType: 'autoUpdate'`, workbox `generateSW`로 JS/CSS/HTML/폰트만 프리캐시(Supabase는 별도 origin이라 런타임 캐싱 미설정 시 자동으로 캐시 안 됨 — 육아일기 데이터는 항상 최신 네트워크 응답 사용).
  - `index.html`에 `theme-color`, `apple-touch-icon`, `mobile-web-app-capable`+`apple-mobile-web-app-capable`(신·구 메타 태그 모두, iOS Safari는 구버전만 인식) 추가.
  - **신규 `IosInstallBanner.tsx`**: iOS Safari + 미설치(standalone 아님) + 로컬 미닫음 상태일 때만 "공유 버튼 → 홈 화면에 추가" 안내(그림일기 sticker 톤). 닫으면 `localStorage`에 기록해 재노출 안 됨. `AppShell.tsx` 최상단(로그인 이후 화면)에 배치.
  - 검증: `npm run build`로 `manifest.webmanifest`/`sw.js`/아이콘 생성 확인, `npm run preview`로 서비스워커 실제 등록·활성화(`navigator.serviceWorker.getRegistrations()`) 확인, 마스크러블 아이콘을 원형으로 크롭 시뮬레이션해 주요 그림이 잘리지 않음 확인, Playwright에서 iOS Safari User-Agent로 오버라이드해 배너 노출·닫기 후 재노출 안 됨 확인. 콘솔 에러 0건(서비스워커 관련 경고 없음).
- **(v0.5.0) 그림일기 컨셉 디자인 리뉴얼**: Hi Melody 손글씨(일기 탭 전용)·폴라로이드 사진 프레임·줄노트 배경·손그림 doodle(해·구름·별·발자국) 적용, 브랜드 스플래시 화면 추가. 상세는 CHANGELOG v0.5.0 참고.

## 알려진 이슈

- **부부 실제 로그인 정보(이메일/비밀번호)는 이 문서에 없음** — 보안상 기록하지 않음. 대시보드 Authentication → Users에서 UID로 계정 관리 가능. 비밀번호를 잊으면 대시보드에서 재설정.
- Capacitor Android 빌드는 아직 미착수.
- 번들/precache 용량 경고 — v1에서는 code-splitting 안 함, 필요 시 추후 처리.
- `src/types/database.ts`는 여전히 수동 작성 타입(gen-types 미적용) — 조인 결과를 `mapRawEntry`로 직접 정규화하는 구조라 자동 생성 타입과 단순 교체가 안 됨.
- claude.ai/design 연동, Cloudflare R2 사진 분리는 보류 상태(설계만 `docs/r2-photo-plan.md`에 보존).
- PWA는 로컬 빌드까지만 검증됨 — 실제 아이폰 홈화면 추가·안드로이드 설치 배너는 Vercel 배포(HTTPS 필요) 후에만 실기기 검증 가능.

## 다음 TODO

1. [ ] Capacitor 7 Android 추가 (`npx cap add android`), JDK 21(`C:\java\jdk-21.0.11+10`, 시스템 JAVA_HOME 사용 금지) + Gradle 8.14로 APK 빌드, `lib/photoPicker.ts`에 네이티브 분기 추가
2. [ ] Vercel 배포 + 실기기(안드로이드 APK 수동 설치, 아이폰 홈화면 추가) 검증 — PWA manifest·SW·iOS 배너가 실기기에서 정확히 동작하는지 이 단계에서 최종 확인
3. [ ] (지인 확장 시) 가입 → 가족 생성/초대코드로 배우자 합류 온보딩 화면. 스키마·RLS는 이미 멀티테넌트라 앱 온보딩 UI만 추가하면 됨. 무료 플랜은 2~3가족까지 여유, 5가족 이상 활발하면 스토리지 1GB·전송 5GB 압박 → Pro($25/월) 또는 이미지 압축 강화.
4. [ ] (저장소 압박 시) 사진만 Cloudflare R2로 분리 — 설계는 `docs/r2-photo-plan.md`에 보존, 아직 미실행.
