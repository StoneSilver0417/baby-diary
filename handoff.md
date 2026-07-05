# baby-diary - Handoff

## 현재 상태

- **버전**: v0.7.1 (Capacitor 8 Android 추가 + 실기기 FAB 잘림 버그 수정)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과, `cd android && ./gradlew.bat assembleDebug` 통과 — 최신 APK는 FAB 수정 반영본(`android/app/build/outputs/apk/debug/app-debug.apk`)
- **배포 상태**: 미배포 (웹은 로컬 `npm run dev`/`npm run preview`, 안드로이드는 디버그 APK 로컬 생성까지만 — 실기기 설치는 아직 검증 안 됨)
- **실행 방법/URL**: `npm run dev` → `.env.local`에 실제 Supabase URL/anon key 설정됨(`VITE_USE_MOCK=false`). 로그인 계정은 부부가 대시보드에서 만든 실제 이메일(별도 기록 필요 — 이 저장소엔 없음).

## 최근 작업

- **Capacitor 8 Android 추가**: `npm install @capacitor/core @capacitor/android` + devDep `@capacitor/cli`/`@capacitor/assets`. `capacitor.config.ts`(appId `com.wooseokshim.babydiary`, appName `육아일기`, `webDir: 'dist'`) 작성 후 `npx cap add android` → `android/` 프로젝트 생성.
  - **사진 선택은 네이티브 플러그인 없이 해결**: Capacitor Android WebView가 `<input type="file" accept="image/*" multiple>`을 만나면 Android 13+ 시스템 Photo Picker(권한 불필요)를 그대로 띄운다는 점을 확인해 `@capacitor/camera`는 추가하지 않음. `src/lib/photoPicker.ts` 주석을 "네이티브 분기 불필요 확인됨"으로 갱신.
  - **앱 아이콘/스플래시**: `scripts/generate-icons.mjs`에 `assets/icon.png`(1024, Capacitor 소스)·`assets/splash.png`(2732, 코랄 배경 위에 아이콘 축소 합성 — 배경색이 동일해 이음매 없음) 생성을 추가하고, `npx capacitor-assets generate --android`로 `android/app/src/main/res/`에 전 밀도별 mipmap 아이콘·스플래시 자동 생성. 실제 PNG를 열어 원형 크롭·회색 배경 클리핑 없는지 육안 확인 완료.
  - **JDK 21 고정**: 시스템 `JAVA_HOME`이 깨진 JDK11이라 `android/gradle.properties`에 `org.gradle.java.home=C:\java\jdk-21.0.11+10`을 명시해 프로젝트 로컬 설정만으로 강제(시스템 환경변수 무관). `android/local.properties`에 `sdk.dir` 작성.
  - Gradle 버전은 Capacitor 8 기본 템플릿의 `8.14.3`을 그대로 사용(AGENTS.md의 "8.14" 검증 버전과 사실상 동일 — samsung-health는 Flutter 프로젝트라 Capacitor 설정 자체는 참고 불가하고 Gradle 버전·SDK 경로만 재사용).
  - 검증: `npm run build` → `npx cap sync android` → `cd android && ./gradlew.bat assembleDebug` 첫 시도에 빌드 성공. `npx cap doctor`로 프로젝트 무결성 확인("Android looking great!"). `git add -A -n android/`으로 `local.properties`·`build/`·`.gradle/`이 Capacitor 기본 `.gitignore`에 의해 정확히 제외되는지 확인.
- **(v0.6.0) PWA 설정**: manifest·서비스워커·앱 아이콘·iOS 홈화면 안내 배너. 상세는 CHANGELOG 참고.
- **버그 수정 — 실기기에서 FAB "+" 버튼이 하단 탭바에 가려 잘림**: 사용자가 실기기(APK 설치)에서 발견. `FeedPage`/`GrowthPage`/`InvestPage`의 플로팅 추가 버튼이 `fixed bottom-24`(96px 고정)였는데, `AppShell`의 하단 탭바는 `pb-safe`로 기기별 제스처 내비게이션 안전영역만큼 더 커져서 96px보다 실제로 더 높아지는 기기에서 버튼과 겹쳐 잘려 보였음. `src/index.css`에 `pb-nav`(메인 콘텐츠 하단 여백)·`bottom-fab`(FAB 위치) 유틸을 추가해 둘 다 `env(safe-area-inset-bottom)`을 계산에 포함하도록 수정 — 세 FAB와 `AppShell`의 `<main>` 패딩에 적용. APK 재빌드해 재검증 필요.

## 알려진 이슈

- **부부 실제 로그인 정보(이메일/비밀번호)는 이 문서에 없음** — 보안상 기록하지 않음. 대시보드 Authentication → Users에서 UID로 계정 관리 가능. 비밀번호를 잊으면 대시보드에서 재설정.
- **안드로이드 실기기 재검증 필요**: FAB 잘림 수정 후 새 APK(`android/app/build/outputs/apk/debug/app-debug.apk`)를 아직 실기기에서 재확인하지 못함.
- Release 서명 키스토어는 아직 없음(debug 빌드까지만) — Play Store 배포 또는 정식 배포 시 별도 생성 필요.
- `src/types/database.ts`는 여전히 수동 작성 타입(gen-types 미적용).
- claude.ai/design 연동, Cloudflare R2 사진 분리는 보류 상태(설계만 `docs/r2-photo-plan.md`에 보존).

## 다음 TODO

1. [ ] 안드로이드 실기기에 새 `android/app/build/outputs/apk/debug/app-debug.apk` 재설치 → FAB 잘림 해결 확인 + 로그인·사진 업로드(시스템 Photo Picker 동작)·전체 플로우 검증
2. [ ] Vercel 배포 + 실기기(아이폰 홈화면 추가 PWA) 검증 — HTTPS 필요한 PWA 설치 흐름은 배포 후에만 완전 검증 가능
3. [ ] (지인 확장 시) 가입 → 가족 생성/초대코드로 배우자 합류 온보딩 화면. 스키마·RLS는 이미 멀티테넌트라 앱 온보딩 UI만 추가하면 됨. 무료 플랜은 2~3가족까지 여유, 5가족 이상 활발하면 스토리지 1GB·전송 5GB 압박 → Pro($25/월) 또는 이미지 압축 강화.
4. [ ] (저장소 압박 시) 사진만 Cloudflare R2로 분리 — 설계는 `docs/r2-photo-plan.md`에 보존, 아직 미실행.
5. [ ] (정식 배포 시) Android release 서명 키스토어 생성 + release 빌드 서명 설정.
