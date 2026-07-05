# Changelog

## 2026-07-05 (v0.7.1)

### 변경 사항
- **버그 수정 — 실기기에서 FAB "+" 버튼이 하단 탭바에 가려 잘림**: v0.7.0에서 빌드한 디버그 APK를 실기기에 설치해 확인한 사용자가 발견. `FeedPage`/`GrowthPage`/`InvestPage`의 플로팅 추가 버튼이 `fixed bottom-24`(뷰포트 하단에서 고정 96px)로 배치돼 있었는데, `AppShell`의 하단 탭바는 `pb-safe`(`env(safe-area-inset-bottom)`)를 적용해 제스처 내비게이션이 있는 기기에서는 96px보다 더 커진다 — 그 결과 FAB의 아래쪽이 탭바에 가려 잘려 보였음. `src/index.css`에 `pb-nav`(`AppShell`의 `<main>` 하단 여백)·`bottom-fab`(FAB 위치) 유틸을 신설해 둘 다 `calc(... + env(safe-area-inset-bottom))`로 안전영역을 계산에 포함하도록 수정.

### 의사결정 배경
- **안전영역을 무시한 고정 px/rem 값이 근본 원인**: 에뮬레이터·데스크톱 브라우저에서는 `safe-area-inset-bottom`이 0이라 `bottom-24`/`pb-20` 같은 고정값도 문제없이 보였다 — 이번 세션 전체에서 Playwright 검증은 데스크톱 크로미움 기반이라 이 값이 항상 0이었고, 실제 제스처 내비 기기(실기기)에서 처음 드러난 회귀였다. **모바일 세이프에어리어가 관여하는 레이아웃은 데스크톱 브라우저 검증만으로는 재현되지 않는다**는 걸 보여준 사례 — 향후 유사한 `fixed`/`sticky` 하단 배치 요소를 추가할 때는 처음부터 `env(safe-area-inset-bottom)`을 계산에 포함해야 한다.
- **하드코딩된 `bottom-24`를 유틸(`bottom-fab`)로 추출**: 같은 패턴(플로팅 액션 버튼)이 세 화면(FeedPage·GrowthPage·InvestPage)에 반복돼 있어, 매직넘버를 각 파일에서 개별 수정하는 대신 공용 유틸 하나로 추출해 앞으로 같은 실수가 반복되지 않도록 함.

## 2026-07-05 (v0.7.0)

### 변경 사항
- **Capacitor 8 Android 프로젝트 추가 + 디버그 APK 빌드**: handoff TODO의 다음 항목 실행. `@capacitor/core`·`@capacitor/android`·`@capacitor/cli`·`@capacitor/assets` 설치, `capacitor.config.ts` 작성(appId `com.wooseokshim.babydiary`), `npx cap add android`로 `android/` 프로젝트 생성.
- **사진 선택에 별도 네이티브 플러그인을 추가하지 않음**: Capacitor Android WebView가 `<input type="file" accept="image/*" multiple>`을 그대로 시스템 Photo Picker(Android 13+, 권한 불필요)로 연결한다는 점을 근거로 `@capacitor/camera`를 도입하지 않기로 결정. `src/lib/photoPicker.ts`의 "Capacitor 도입 시 분기 추가" 주석을 "네이티브 분기 불필요 확인됨"으로 갱신.
- **앱 아이콘/스플래시를 그림일기 톤 그대로 확장**: `scripts/generate-icons.mjs`에 Capacitor용 `assets/icon.png`(1024)·`assets/splash.png`(2732, 아이콘과 동일한 코랄 배경 위에 축소 합성)를 추가하고 `npx capacitor-assets generate --android`로 전 밀도 mipmap·스플래시를 자동 생성. 원형 크롭 등으로 실제 PNG를 육안 검증.
- **JDK 21을 프로젝트 로컬 설정으로 강제**: `android/gradle.properties`에 `org.gradle.java.home=C:\java\jdk-21.0.11+10` 추가 — 시스템 `JAVA_HOME`(깨진 JDK11)에 전혀 의존하지 않게 함. `android/local.properties`에 SDK 경로 작성.
- 빌드 검증: `npm run build` → `npx cap sync android` → `cd android && ./gradlew.bat assembleDebug`가 첫 시도에 성공(2분 31초), `app-debug.apk`(8.2MB) 생성 확인. `npx cap doctor` 정상. `.gitignore`(Capacitor 기본 템플릿)가 `local.properties`·`build/`·`.gradle/`을 정확히 제외하는지 `git add -A -n`으로 확인.

### 의사결정 배경
- **Capacitor 7이 아닌 8을 그대로 사용**: AGENTS.md에 "Capacitor 7"이라 적혀 있었지만, 이는 과거 시점에 작성된 계획값일 뿐 실제로 v7에 의존하는 코드나 검증된 호환성 이슈가 없었다. `npm install` 시점의 최신 안정 메이저(8.4.1)를 그대로 쓰는 것이 특정 버전을 인위적으로 고정하는 것보다 유지보수에 유리하다고 판단 — AGENTS.md 기재값도 실제 설치 버전(8)으로 갱신.
- **`@capacitor/camera` 미도입**: v1 범위는 "갤러리에서 사진 선택"이며 "카메라로 직접 촬영"은 요구사항에 없다. Android WebView의 파일 입력이 이미 시스템 포토피커를 열어주므로 별도 플러그인 없이 요구사항이 충족되고, 그만큼 `AndroidManifest.xml` 권한 선언·플러그인 코드가 늘어나지 않는다. 촬영 기능이 실제로 필요해지는 시점에 플러그인을 추가하는 편이 지금 미리 붙이는 것보다 낫다고 판단(YAGNI).
- **samsung-health 프로젝트 참고 범위를 좁게 해석**: AGENTS.md가 "samsung-health 프로젝트의 빌드 설정 참고"라 적어뒀지만, 실제로 그 프로젝트는 Flutter 기반이라 Capacitor 관련 설정(플러그인, capacitor.config 등)은 전혀 참고할 수 없었고, JDK 21 경로·Android SDK 경로·Gradle 8.x 계열 버전이라는 "환경 사실"만 재사용 가능했다. Gradle 버전은 Capacitor 8 기본 템플릿이 이미 8.14.3을 지정하고 있어 그대로 두고 인위적으로 8.14로 다운그레이드하지 않았다(패치 버전 차이는 무의미).
- **아이콘 소스를 단일 정사각 PNG로 통일(적응형 아이콘 전경/배경 레이어 분리 생략)**: `@capacitor/assets`는 전경/배경을 분리한 레이어를 주면 더 정교한 적응형 아이콘을 만들 수 있지만, 우리 아이콘은 이미 배경색이 전체를 채우는 단순한 정사각 디자인이라 단일 소스로도 원형 크롭 시 클리핑이 없음을 확인했다(웹 매니페스트 마스크러블 아이콘 설계 시 이미 80% 안전영역을 계산해뒀기 때문). 레이어 분리는 복잡도 대비 이득이 적어 생략.

## 2026-07-05 (v0.6.0)

### 변경 사항
- **PWA 설정**(`vite-plugin-pwa`): handoff TODO의 다음 항목을 실행 — 아이폰이 애플 개발자 계정 없이는 네이티브 빌드가 불가능한 하드 제약이 있어 PWA 홈화면 설치가 유일한 배포 경로.
  - 앱 아이콘을 직접 제작(`src/assets/app-icon.svg`): v0.5.0에서 확립한 그림일기 비주얼 언어(폴라로이드+손그림)를 그대로 재사용 — 코랄 배경에 폴라로이드 사진(해+언덕 미니 장면)과 별 스티커. 마스크러블 아이콘 규칙(중앙 80% 안전영역)에 맞춰 좌표를 계산하고, 원형 크롭 시뮬레이션으로 실제 클리핑 여부를 검증.
  - `scripts/generate-icons.mjs`(`npm run icons`, `sharp` 사용)로 마스터 SVG → 192/512/maskable-512/apple-touch-icon(180)/favicon(32) PNG 일괄 생성. 기존 Vite 스캐폴드 기본 아이콘(`public/favicon.svg`, 보라색 Vite 로고) 제거.
  - `vite.config.ts`에 manifest(이름·설명·테마색·배경색·standalone·아이콘 3종·`lang: 'ko'`) + `registerType: 'autoUpdate'` + workbox `generateSW`(JS/CSS/HTML/폰트만 프리캐시) 설정.
  - `index.html`에 `theme-color`·`apple-touch-icon`·`mobile-web-app-capable`(신)·`apple-mobile-web-app-capable`(구, iOS Safari 전용) 메타 태그 추가.
  - **신규 `IosInstallBanner.tsx`**: iOS Safari + 미설치 상태에서만 "홈 화면에 추가" 안내(그림일기 sticker 톤 재사용), 닫으면 `localStorage`로 영구 숨김. `AppShell.tsx`에 배치.
  - Playwright로 서비스워커 실제 등록/활성화 확인, 마스크러블 아이콘 원형 크롭 시뮬레이션, iOS UA 오버라이드로 배너 노출·닫기 후 미재노출 확인. 콘솔 에러 0건.

### 의사결정 배경
- **오프라인 데이터 캐싱은 의도적으로 하지 않음**: workbox `generateSW`의 `globPatterns`을 빌드 산출물(JS/CSS/HTML/폰트)로 한정하고 Supabase API에는 런타임 캐싱 규칙을 추가하지 않았다 — 육아일기·투자 데이터는 가족 간 실시간 공유가 핵심 가치라 오래된 캐시를 보여주는 것이 사진 앱의 "새 글 확인" 경험을 해칠 수 있음. 앱 셸(로그인 화면까지)만 오프라인에서 뜨는 정도가 v1 목표.
- **아이콘 모티프를 새로 구상하지 않고 기존 그림일기 언어를 재사용**: 이미 v0.5.0에서 폴라로이드+손그림 스타일이 사용자 검증을 거쳤으므로, 앱 아이콘도 같은 언어를 쓰는 것이 "홈 화면 아이콘을 눌렀을 때 앱 내부와 톤이 이어지는" 일관성을 준다. 완전히 새로운 로고를 디자인하는 것보다 리스크가 적음.
- **아이콘을 SVG 마스터 + 스크립트 래스터화 방식으로**: PNG를 직접 여러 장 그리는 대신 SVG 하나를 유지하고 `sharp`로 필요한 모든 크기를 뽑아내면, 나중에 아이콘을 수정할 때 좌표 하나만 고치고 `npm run icons`만 다시 실행하면 되어 유지보수가 쉬움.
- **`apple-mobile-web-app-capable`(deprecated) 유지**: Chrome 콘솔은 이 메타 태그를 deprecated로 경고하지만, 표준 `mobile-web-app-capable`는 iOS Safari에서 아직 인식되지 않아 아이폰 홈화면 standalone 모드가 이 태그에 의존한다. 경고를 없애려 구버전을 지우면 정작 PWA의 핵심 타깃인 아이폰에서 기능이 깨지므로, 두 태그를 함께 두고 경고는 감수하기로 결정.

## 2026-07-05 (v0.5.0)

### 변경 사항
- **그림일기 컨셉 디자인 리뉴얼**: "귀엽고 아기자기, 손글씨 그림일기 느낌"을 요청받아 앱 전체 톤을 개편.
  - `@fontsource/hi-melody` self-host 설치 + `--font-hand` 토큰(`font-hand` 유틸) — **일기 탭에만** 적용, 성장·투자 탭은 숫자 가독성을 위해 기존 폰트 유지(사용자 지정 범위).
  - `src/index.css`에 그림일기 전용 유틸 4종 추가: `paper-lines`(줄노트 배경), `polaroid`/`polaroid-tilt-left`/`polaroid-tilt-right`(사진 프레임+교차 회전), `tape`(마스킹테이프 pseudo-element), `sticker`(둥근 뱃지). 파스텔 보조 팔레트(`--sticker-yellow/sky/mint/pink`) 추가, `--radius` 0.75rem→1rem.
  - 이모지 대신 손그림 SVG 세트를 직접 제작(`src/assets/doodles/`: Sun·Cloud·Star·Footprint) — 날짜 헤더·로그인 화면·신규 스플래시 화면 장식에 사용.
  - 적용 범위: `FeedPage`(폴라로이드 사진+줄노트 캡션 카드), `EntryDetailPage`(paper-lines 본문, sticker 좋아요), `EntryEditorPage`(폴라로이드 사진 슬롯, 줄노트 textarea), `AlbumPage`(교차 회전 폴라로이드 그리드), `AppShell`(하단 탭 활성 pill), `LoginPage`.
  - **신규 `SplashScreen.tsx`**: 세션 확인 중(`ProtectedRoute`의 `userId === undefined`) 텍스트만 있던 로딩 화면을 로그인 화면과 톤을 맞춘 브랜드 스플래시로 교체 — 사용자가 "들어가는 메인화면(로딩창)"도 요청해 추가.
  - **부수 버그 수정 2건**(디자인 작업 중 발견):
    1. `EntryEditorPage`의 기존 사진 미리보기가 `storage_path`(실모드에선 스토리지 경로 문자열이지 URL이 아님)를 그대로 `img src`에 사용 — mock에서만 우연히 동작하고 실모드 수정 화면에서는 깨지고 있었음. `usePhotoUrls`로 서명 URL 변환하도록 수정.
    2. `EntryDetailPage`가 사진이 0장인 일기에도 `polaroid`/`tape` 프레임을 빈 채로 렌더 — `entry.photos.length > 0` 조건부 렌더로 수정.
  - Playwright(390×844)로 로그인·피드·상세(사진+좋아요)·작성(사진 업로드)·앨범(사진 2장)·성장·투자·스플래시 전 화면을 mock 모드로 검증(끝나고 `.env.local`을 실제 Supabase 설정으로 원복). 콘솔 에러 0건.
- **(보류) Cloudflare R2 사진 저장소 분리 설계 문서화**: "나중에 지인 확장 시 Supabase 무료 Storage가 감당될지" 질문에서 이어진 설계(Worker presign + household JWT 검증)를 `docs/r2-photo-plan.md`로 보존만 하고 코드는 적용하지 않음.

### 의사결정 배경
- **스택 전체 이전(Neon+Clerk+R2) 대신 Supabase 유지 + 사진만 R2 분리(보류)로 결론**: 이 앱은 서버 코드가 없는 정적 SPA(Capacitor 제약)라 Auth·DB를 바꾸면 브라우저→DB 직결 구조가 깨져 API 서버 계층을 새로 짜야 함. 무료 한도 비교에서도 실질적으로 이기는 지점은 R2의 저장·전송량뿐이었음 — 이미 실연결·실검증까지 끝난 백엔드를 갈아엎을 이득이 없다고 판단해 R2는 "저장소 압박 시" 대비 설계만 남기고 지금은 미실행.
- **손글씨 폰트 적용을 일기 탭으로 한정**: 사용자가 명시적으로 선택("일기 탭만 손글씨") — 성장·투자 탭은 금액·수치 데이터라 손글씨체의 낮은 숫자 가독성이 오독 위험으로 이어질 수 있어 일반 폰트를 유지하는 것이 사용자 의도와 일치.
- **claude.ai/design 연동은 보류**: 초기 계획엔 컴포넌트를 디자인 시스템 프로젝트로 동기화하는 단계가 있었으나, 실제 앱 화면 스크린샷으로 톤을 먼저 확인한 사용자가 "이 상태로 커밋만" 선택 — 별도 디자인 시스템 프로젝트 없이도 목표(귀엽고 아기자기한 그림일기 톤)가 충분히 달성됐다고 판단.
- **이모지 대신 SVG 직접 제작**: 사용자가 명시적으로 이모지 사용을 금지("이모지 사용금지 직접생성하거나 필요한거다운") — 플랫폼마다 렌더링이 다르고 Capacitor/PWA 오프라인에서 일관성이 떨어지는 이모지 대신, 손그림 느낌의 SVG를 코드로 직접 그려 톤·오프라인 동작 모두 통제.
- **스플래시 화면 추가는 범위 외 요청이지만 반영**: "그림일기 디자인" 요청의 핵심은 아니었지만 사용자가 "들어가는 메인화면(로딩창)"을 별도로 지목 — 기존에 브랜딩 없는 텍스트("불러오는 중…")만 있던 진입 화면이 로그인 화면과 톤이 어긋나 있었으므로, 이미 만든 doodle·폰트 자산을 재사용해 일관성을 맞춤.

## 2026-07-04 (v0.4.0)

### 변경 사항
- **실제 Supabase 프로젝트 연결** — 기존 계정에 새 조직(`baby-diary`, Seoul 리전)을 만들어 무료 프로젝트 생성(couple-finance 조직과 별개, 조직당 2개 한도가 새로 생김). `0001_initial_schema.sql` → `0002_growth_invest.sql` 적용, 이메일 회원가입 비활성화, 부부 2계정 생성, household 1개 + profiles 2개 + children 1개(도준, 2023-08-11) 시드, `.env.local`을 `VITE_USE_MOCK=false`로 전환.
- **버그 수정 — PGRST201 임베드 모호성**: `src/features/diary/api.ts`의 `diary_entries` select에서 `profiles(display_name)` 임베드가 직접 FK(`diary_entries.author_id`)와 `likes` 테이블을 통한 다대다 경로 둘 다에 매칭돼 PostgREST가 300으로 거부하던 것을 `profiles!diary_entries_author_id_fkey(display_name)`로 명시해 해결.
- **버그 수정 — 일기 삭제 후 406 레이스**: `EntryDetailPage.handleDeleteEntry`의 순서를 "삭제 완료 → navigate"에서 "**navigate 먼저 → 삭제**"로 변경. `useDeleteEntry`의 `onSuccess`가 상세 쿼리 캐시를 정리(`removeQueries`)하는 시점에 상세 페이지가 여전히 마운트돼 있으면 삭제된 행을 즉시 재조회해 406이 나는 레이스가 있었음.

### 의사결정 배경
- **PGRST201은 스키마 설계(household 개편에서 도입한 `likes` 테이블 구조)와 PostgREST의 자동 관계 추론이 충돌한 사례** — `likes`가 `diary_entries`와 `profiles` 양쪽에 FK를 가지므로 PostgREST가 이를 암묵적 다대다 조인 경로로도 인식함. 스키마를 바꾸는 대신(예: likes를 별도 뷰로 분리) 쿼리 쪽에서 FK를 명시하는 쪽이 변경 범위가 작고 이해하기 쉬워 이 방법을 택함.
- **삭제 레이스는 mock 모드에서는 드러나지 않았던 문제** — mock의 `deleteEntry`는 동기적 배열 조작이라 재조회 자체가 발생할 여지가 없었음. 실제 Supabase(네트워크 지연 있는 비동기 재조회)로 전환하고서야 TanStack Query의 캐시 무효화 타이밍과 컴포넌트 언마운트 타이밍의 경쟁 조건이 드러남 — **mock 검증이 로직은 검증해도 타이밍 버그까지는 못 잡는다는 걸 보여주는 사례**. 다른 페이지에서도 "삭제 후 이동" 패턴이 있으면 동일 원칙(먼저 이동, 나중에 뮤테이션 정리) 적용 검토 필요.
- **테스트는 임시 계정으로, 실제 부부 계정은 건드리지 않음**: 원격 환경이라 실제 비밀번호 공유가 어려운 상황 → 별도 household를 가진 일회용 테스트 계정을 만들어 검증 후 완전히 삭제(cascade). 실 데이터·비밀번호 노출 없이 전체 파이프라인(인증·조인 쿼리·사진 업로드·RLS·삭제) 검증 완료.

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
