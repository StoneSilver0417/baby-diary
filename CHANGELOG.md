# Changelog

## 2026-07-11 (v0.11.6)

### 변경 사항 — 사진 저장 실패(1장 문제) + 줄노트 재구현 + 에디터 정렬
사용자 3건 제보: ① 사진 3장 중 1장이 있으면 저장 실패, 그 1장을 빼면 저장됨 ② 아이폰 줄노트가 여전히 들쭉날쭉(어떤 화면은 줄 있고 어떤 화면은 없음) ③ 안드로이드는 줄은 보이는데 **글 작성 중** 줄이 안 맞음(저장된 표시는 맞음).

- **① 사진 저장 견고화 (`src/lib/image.ts`, `api.ts`)**: 원인은 특정 사진 1장이 `compressImage`에서 실패하면 전체 저장이 막히는 것 — `createImageBitmap` 디코드 실패(포맷·초대형)나 `canvas.toBlob('image/webp')`의 `null`(일부 사파리 WebP 인코딩 미지원)이 유력. 수정: (a) 디코드를 `createImageBitmap`(EXIF 회전 반영) → 실패 시 `<img>` 디코드로 **이중 폴백**, (b) 인코딩을 WebP → 실패 시 **JPEG 폴백**(확장자·contentType도 blob 타입 따라 지정), (c) 업로드 루프를 **사진별 독립 처리**로 바꿔 한 장이 실패해도 글·나머지 사진은 저장되고 실패 장수를 반환 → 에디터가 "사진 N장은 형식·용량 문제로 첨부하지 못했어요" 경고 토스트 표시. `saveEntry` 반환을 `{ entryId, failedPhotos }`로 변경.
- **② 줄노트 렌더 방식 교체 (`repeating-linear-gradient` → `background-size` 타일)**: v0.11.5의 off-seam 보정에도 아이폰에서 소실이 재발 → `repeating-linear-gradient` 자체가 iOS/WebKit에서 불안정한 것으로 판단하고, 한 칸(1.6rem)짜리 `linear-gradient`를 `background-size: 100% 1.6rem; background-repeat: repeat`로 세로 타일하는 방식으로 전환. 타일 배경은 iOS에서 훨씬 안정적으로 그려진다. 선은 여전히 타일 경계에서 1px 안쪽에 그려 이음새 블렌딩을 피함. 줄 위치·정렬은 기존과 동일(표시 화면 불변).
- **③ 에디터 입력 정렬 수정 (`EntryEditorPage`)**: 원인은 작성용 `<textarea>`의 세로 여백이 `py-2`(Textarea 기본)라 표시용 `<p>`의 `py-1`과 달라, 배경 줄 주기와 텍스트 줄이 어긋난 것. 에디터 textarea를 표시 화면과 같은 `px-1 py-1`로 맞춰 타이핑 중에도 줄이 글자 밑에 오도록 통일.
- **검증**: Playwright(iPhone 뷰포트, 실제 프로덕션 빌드)로 — 에디터에서 6줄 타이핑 시 배경 줄과 정확히 정렬·저장 후 표시 화면도 동일 정렬·피드 카드 줄 렌더링·사진 첨부→저장→표시까지 확인(Chromium=안드로이드 대표). **줄노트 타일 방식의 iOS 소실 해결 여부는 데스크톱에서 재현 불가 — 실기기(아이폰) 최종 확인 필요.**

## 2026-07-10 (v0.11.5)

### 변경 사항 — 줄노트 배경선이 아이폰에서 완전히 사라지는 문제 수정 (실기기 재제보)
와이프 아이폰 스크린샷으로 재제보: v0.10.7 배포 후 `paper-lines` 배경선이 (어긋남이 아니라) **완전히 안 보임**. 앱 완전 종료 후 재실행에도 재현 → 캐시가 아닌 코드 문제로 확정하고 원인을 다시 추적.

- **원인(v0.10.7 회귀)**: v0.10.7의 1px 누적 오차 수정에서 반복 주기는 정확히 `1.6rem`으로 맞췄으나, 그 과정에서 1px 선을 `calc(1.6rem - 1px)`~`1.6rem`, 즉 **반복 타일의 정확한 경계(seam)에 딱 붙여** 그리게 됐다. iOS/WebKit 고해상도(3x) 래스터라이저는 `repeating-linear-gradient` 타일 이음새에서 서브픽셀 안티앨리어싱으로 경계에 붙은 1px 색 밴드를 다음 타일의 투명색과 섞어 **없애버린다**(데스크톱은 DPI·래스터라이저가 달라 정상). "이전엔 어긋난 채로라도 보였는데(=선은 존재) v0.10.7 이후 아이폰에서만 소실, 데스크톱 정상"이라는 증상과 정확히 일치. v0.10.7 diff에서 색·선 두께는 그대로고 밴드 위치만 바뀐 것으로 교차 확인.
- **수정**: 반복 주기는 `1.6rem` 그대로 유지(정렬 불변식 보존)하되, 1px 선을 이음새에서 1px 떼어 타일 내부(`calc(1.6rem - 2px)`~`calc(1.6rem - 1px)`)에 그림. 위·아래로 투명 여백이 생겨 이음새 블렌딩의 영향을 받지 않는다. 덤으로 `--paper-line`을 `oklch(0.9 0.02 78)`→`oklch(0.86 0.025 78)`로 소폭 진하게 해 저휘도 화면 대비 안전마진 확보.
- **검증**: 이음새 소실 버그 자체는 고DPI 기기 의존이라 데스크톱 재현 불가. 대신 신/구 그라디언트를 20줄 텍스트로 나란히 렌더링해 (1) 신규 off-seam 선이 정상 렌더링 (2) 20줄까지 정렬 드리프트 없음 (3) 새 색상 가시성 확인. 이음새에서 밴드를 떼는 것은 WebKit 이 아티팩트의 표준 해법. **실기기 최종 확인은 배포 후 와이프 아이폰 스크린샷으로 필요.**

## 2026-07-08 (v0.11.4)

### 변경 사항 — 앨범(갤러리)을 날짜별 그룹 + 사진 뷰어로 개편
기존 앨범은 전체 사진을 한 장씩 평면 그리드로 펼치고, 사진을 누르면 그 사진이 속한 일기 상세로 이동했다. 요청에 따라 (1) 날짜별로 묶고 (2) 여러 장이면 대표 1장 + "뒤에 더 있는" 겹침 효과로 보여주고 (3) 클릭 시 일기가 아니라 사진 상세 뷰어로 열리게 개편.

- **날짜별 그룹**: 모든 일기의 사진을 `entry_date` 기준으로 묶어 최신 날짜순으로 타일 배치(한 날짜에 부부 두 사람·여러 엔트리의 사진이 있어도 그 날짜 하나로 합쳐짐). 2열 그리드.
- **대표 사진 + 겹침 효과**: 각 타일은 그날 첫 사진을 폴라로이드 대표로 표시. 사진이 2장 이상이면 뒤에 다음 사진이 살짝 회전·오프셋되어 삐져나오는 "사진 더미" 효과 + 우상단에 장수 배지(사진 아이콘 + 개수). 1장이면 겹침·배지 없이 단독 표시.
- **사진 상세 뷰어(라이트박스)**: 타일을 누르면 일기로 가지 않고, 전체화면 검은 배경 뷰어가 열려 그 날짜의 사진을 좌우 스와이프로 넘겨본다(상단에 날짜·닫기 X, 하단 점 인디케이터). 사진은 잘림 없이 전체가 보이도록 `object-contain`. 라우트가 아니라 앨범 페이지 내부 상태(오버레이)로 구현해 "앨범 유지" — 뒤로가기 불변식(비홈→홈)과 충돌하지 않게 했다. Esc·배경 탭·X로 닫힘.
- **`PhotoCarousel` 확장**: 재사용을 위해 `fit`('cover'|'contain')·`fill`(정사각형 대신 부모 높이 채움) 옵션 추가. 피드·상세의 기존 사용처는 기본값(cover, 정사각형) 그대로라 영향 없음.
- **검증**: Playwright(iPhone 뷰포트)로 실제 업로드 플로우(테스트 이미지)로 2개 날짜(3장·1장) 생성 후 — 날짜별 타일·겹침 효과·장수 배지·라이트박스 열림·object-contain 전체 표시·스와이프로 다음 사진 이동·닫기(일기로 안 감) 전부 확인.

## 2026-07-08 (v0.11.3)

### 변경 사항 — 댓글 입력을 자동 높이 조절 textarea로 교체
사용자 제보: 댓글이 길어지면 단일 줄 입력창(`<Input>`)에서 가로로 계속 스크롤돼 읽기·수정이 불편했다.

- **신규 `AutoGrowTextarea` 컴포넌트**: 내용에 따라 세로로 자동으로 늘어나는 textarea. 단일 줄로 시작해 길어지면 줄바꿈되며 높이가 늘고, 최대 높이(`max-h-32`)를 넘으면 그때만 세로 스크롤. CSS `field-sizing`은 iOS Safari 미지원이라 `scrollHeight`로 직접 높이를 맞춘다(값 변경 시 `useLayoutEffect`로 재계산). border-box 보정(테두리 두께를 높이에 더함)으로 불필요한 스크롤바가 뜨지 않게 처리.
- **EntryDetailPage**: 하단 댓글 작성창과 인라인 수정창의 `<Input>`을 모두 `AutoGrowTextarea`로 교체. 입력줄이 늘어나도 `등록`/저장·취소 버튼은 하단 정렬(`items-end`) 유지.
- **Enter 동작 변경**: textarea라 Enter는 줄바꿈, 등록·저장은 버튼으로. 여러 줄 댓글 작성이 자연스러워짐(기존 단일 줄 Input의 Enter=등록 동작 대체).
- **검증**: Playwright(iPhone 뷰포트)로 긴 댓글 입력 시 세로로 늘어남(36→128px, 상한 도달 후 내부 스크롤)·가로 스크롤 없음·등록 후 높이 리셋·인라인 수정창도 동일 동작·빈 상태 스크롤바 없음까지 확인.

## 2026-07-08 (v0.11.2)

### 변경 사항 — 댓글 수정 기능 추가
기존에 댓글은 작성·삭제만 가능하고 수정이 없었다. 오타·내용 변경을 위해 본인 댓글 인라인 수정 기능을 추가.

- **DB(마이그레이션 0005)**: `comments` 테이블에 select/insert/delete 정책만 있고 update 정책이 없어 본인 댓글도 RLS에 막혀 수정이 안 됐다. `comments_update_own` 정책 추가 — `using(author_id = auth.uid())` + `with check(author_id = auth.uid())`로 남의 댓글 수정도, 수정하며 작성자를 바꾸는 것도 차단. **실 프로덕션 반영 필요**: 대시보드 SQL Editor에서 `supabase/migrations/0005_comment_update.sql` 실행.
- **API/mutation**: `updateComment(commentId, entryId, content)` 추가(mock + supabase), `useUpdateComment` 옵티미스틱 뮤테이션 추가(기존 addComment/deleteComment와 동일 패턴 — onMutate에서 캐시 즉시 반영, 실패 시 롤백, onSettled에서 invalidate).
- **UI(EntryDetailPage)**: 본인 댓글에만 연필(수정) 버튼을 삭제 버튼과 함께 노출. 누르면 해당 댓글이 인라인 입력창으로 바뀌고 체크(저장)·X(취소) 버튼 제공. Enter=저장, Esc=취소, 빈 내용은 저장 비활성화. 다른 사람 댓글에는 버튼 미노출.
- **검증**: Playwright(iPhone 뷰포트)로 본인 댓글에만 수정 버튼 노출·인라인 편집·저장 옵티미스틱 반영·취소 시 원문 유지까지 확인.

## 2026-07-08 (v0.11.1)

### 변경 사항 — 앱 셸 레이아웃을 scroll-body-shell 구조로 리팩터
StyleGallery(CSS 레이아웃 패턴 카탈로그, github.com/changeroa/StyleGallery)를 참고해 우리 레이아웃을 점검한 결과, 하단 탭바 처리 방식이 유일하게 개선 여지가 있어 리팩터.

- **원인/동기**: 기존 `AppShell`은 하단 탭바를 `position: fixed`로 띄우고, 본문(`main`)에 `pb-nav`(= `calc(5rem + safe-area)`)라는 **수동 매직넘버 여백**을 줘서 콘텐츠가 탭바에 가리지 않게 했다. 이 방식은 탭바 실제 높이(폰트 확대·기기별 safe-area로 달라짐)와 매직넘버가 어긋나면 콘텐츠가 탭바에 가리는 취약점이 있었다 — 실제로 과거 "실기기에서 FAB·버튼이 하단 탭바에 가려 잘리는 문제"(CHANGELOG 이력)가 이 계열 버그였다.
- **수정**: `AppShell`을 StyleGallery의 **scroll-body-shell** 패턴(`display: grid; grid-template-rows: minmax(0,1fr) auto; height: 100dvh`)으로 바꿔 탭바를 grid의 실제 한 행으로 배치. 이제 본문이 탭바에 가리는 일이 **구조적으로 불가능**하고 `pb-nav` 매직넘버가 필요 없어져 제거했다. 탭바가 겹치지 않으므로 EntryDetail의 sticky 댓글 입력줄도 탭바 위에 깔끔하게 안착한다.
- **FAB 처리**: 플로팅 추가 버튼은 뷰포트 고정이 정석이라 `fixed`(bottom-fab) 유지. 대신 FAB이 뜨는 3개 화면(피드·성장·투자)에는 마지막 콘텐츠가 FAB에 가리지 않도록 화면별 하단 여백(`pb-20`)만 남겼다(탭바 여백은 grid가 담당하므로 분리됨).
- **덤: EntryDetail 댓글 입력줄 sticky-footer 적용**: 기존에는 일기 본문이 짧으면 sticky 댓글 입력줄이 화면 중앙에 떠 보이는 문제가 있었다(콘텐츠가 짧아 스크롤이 없으면 `sticky bottom-0`이 바닥에 붙지 못함, 셸 리팩터와 무관한 기존 버그). StyleGallery의 **sticky-footer** 패턴(`grid-template-rows: 1fr auto`)을 적용해 본문이 짧아도 입력줄이 항상 하단에 붙고, 길면 스크롤되며 sticky로 떠 있도록 통일.
- **검증**: Playwright(iPhone 뷰포트, 실제 프로덕션 빌드 preview)로 피드·성장(스크롤 하단)·EntryDetail(짧은 글/긴 글 스크롤) 전부 확인 — 탭바·FAB에 콘텐츠가 가리지 않고, 댓글 입력줄이 짧은 글에서도 하단에 붙는 것까지 확인.

### 의사결정 배경
- **FAB을 sticky/absolute로 바꾸지 않고 fixed로 남긴 이유**: sticky FAB은 콘텐츠가 짧을 때 화면 중앙에 뜨고, absolute FAB은 콘텐츠가 길 때 스크롤해야만 보이는 문제가 있다. "항상 화면 우하단에 떠 있는" 동작은 뷰포트 고정(fixed)이 정확한 도구다. 셸을 grid로 바꿔도 FAB의 `bottom-fab` 오프셋은 그대로 유효하다(탭바가 시각적으로 여전히 뷰포트 바닥에 있으므로).

## 2026-07-08 (v0.11.0)

### 변경 사항 — 안드로이드 PWA 단일화 (Capacitor/APK 완전 철거)
v0.10.4에서 논의만 하고 미뤄뒀던 결정을 실행. Capacitor 디버그 APK를 GitHub Release로 병행 배포하던 방식은 릴리스마다 `cap sync → gradlew → gh release upload` 수동 3단계가 필요했고, 무엇보다 이미 APK를 설치한 사용자는 앱 자체가 웹 자산을 번들하고 있어 자동 업데이트가 되지 않는 구조적 문제가 있었다. 안드로이드도 아이폰과 동일하게 PWA 단일 경로로 통일해 배포를 웹 push 한 번으로 끝낸다.

- **코드 의존 조사**: Capacitor를 실제로 import하는 소스는 `src/lib/useAndroidBackButton.ts` 단 1개뿐이었고, PWA 인프라(vite-plugin-pwa manifest·아이콘·iOS 설치 배너)는 이미 완비돼 있어 실질 작업은 이 훅의 재구현과 철거·문서 정리로 좁혀짐.
- **뒤로가기 재구현 — "홈 앵커 불변식"**: 기존 Capacitor 하드웨어 백버튼의 고정 규칙("피드가 아니면 무조건 피드로, 피드에서는 앱 종료")을 웹 표준 history API만으로 재현해야 했다. "홈에서 백=앱 최소화"는 히스토리 스택이 바닥일 때만 OS가 해주는 동작이라, 스택을 항상 `['/']` 또는 `['/', 현재화면]`(깊이 2 이하)로 유지하는 불변식을 설계했다:
  - `src/lib/navigation.tsx`: `AppLink`(비홈→비홈 이동은 자동 `replace`, 홈으로 가는 이동은 `useGoHome`에 위임)와 `useGoHome()`(히스토리에 앵커가 있으면 `navigate(-1)`로 pop, 없으면 `replace`)을 신설.
  - `src/lib/useBackNavigation.ts`: 두 가지 보조 역할만 담당하는 안전망. ① standalone PWA로 딥링크 진입 시 히스토리 바닥에 홈 앵커를 끼워 넣는 정규화(브라우저 탭 딥링크는 "공유받은 곳으로 돌아가기" 기대를 지키려 대상에서 제외), ② 뒤로 방향 POP이 비홈에 착지하면 홈으로 교정하는 안전망(네비게이션 규율이 지켜지는 한 발동하지 않음).
  - raw `history.pushState` 센티널 트랩 방식은 기각했다 — react-router(v8.1.0) 소스를 확인해보니 라우터가 `history.state.idx`로 자체 스택 인덱스를 추적하는데, 규약 밖에서 직접 `pushState`를 호출하면 이 인덱스가 오염돼(다음 push에서 `undefined + 1 = NaN`) 라우터 내비게이션이 깨졌다.
  - AppShell 하단 탭, DiaryViewSegment, EntryDetailPage/SearchPage 헤더 ←, EntryEditorPage 저장 후 이동, Calendar/AlbumPage, Settings↔AdminPage 등 네비게이션 표면 전체에 규율을 적용.
- **UX 변경(확정)**: 상세·검색 화면의 헤더 ← 버튼이 "직전 화면"이 아닌 "홈"으로 이동하도록 통일 — 하드웨어 백과 동작을 일치시키는 선택.
- **Capacitor 철거**: `@capacitor/android`·`@capacitor/app`·`@capacitor/core`·`@capacitor/assets`·`@capacitor/cli` 의존성 5종 제거, `capacitor.config.ts`·`android/`(추적 파일 77개)·`assets/`(icon·splash 소스) 삭제, `scripts/generate-icons.mjs`의 Capacitor 자산 생성 블록 제거(웹 아이콘 생성부는 유지).
- **검증**: Playwright로 8가지 시나리오(불변식 유지, 비홈→백=홈, 홈→백=이탈, 헤더←=홈, standalone 딥링크 정규화, 새로고침 멱등, 로그인 리다이렉트 무경합)를 dev 서버와 `vite preview`(실제 프로덕션 빌드) 양쪽에서 확인.
- GitHub Release `android-latest`의 APK 자산을 제거하고 "PWA로 전환됨" 안내문으로 교체, README 방법 B(APK 설치) 섹션 삭제 + 갈아타기 안내 추가, AGENTS.md의 Capacitor/APK 관련 서술 정리.

### 의사결정 배경
- **왜 "히스토리 스택 얕게 유지" 설계를 택했는가**: 대안으로 raw popstate 이벤트에서 즉석으로 판단하는 방식도 검토했으나, popstate 시점엔 location이 이미 새 엔트리로 바뀐 뒤라 타이밍이 꼬이기 쉽고, 무엇보다 "히스토리를 되짚으며 탭 전환 기록을 왔다갔다"하는 문제(과거 v0.9.x에서 겪고 폐기한 문제)가 재발할 위험이 있었다. 대신 애초에 스택이 깊어지지 않도록 모든 네비게이션 지점에서 규율을 지키면, 뒤로가기 자체는 라우터 표준 동작만으로 해결되고 커스텀 훅은 "규율이 깨졌을 때만 발동하는 안전망" 역할로 줄어든다 — 더 적은 코드로 더 예측 가능한 동작.
- **APK 파일을 완전히 지우고 안내문으로 교체한 이유**: 기존 설치자를 방치하면 구버전에 고착된 채로 있게 되는데, 어차피 자동 업데이트가 안 되는 배포 방식이었으니 유지보수 부담만 남기고 실익이 없다고 판단. Release 자체를 삭제하지 않고 안내문으로 남긴 이유는 기존에 이 링크를 북마크했거나 공유받은 사람이 갑자기 404를 마주치지 않고 PWA로 갈아타는 경로를 바로 안내받게 하기 위함.

## 2026-07-08 (v0.10.7)

### 변경 사항 — 줄노트 배경 반복 주기의 1px 누적 오차 수정 (긴 글에서 어긋남)
사용자가 재재제보: v0.10.5(text-size-adjust) 수정 후에도 안드로이드·아이폰 모두 줄이 어긋나며, **글이 길어질수록 심해진다**는 새 단서 제공.

- **원인**: `paper-lines`의 `repeating-linear-gradient`에서 1px 선을 `1.6rem` **뒤에** 붙여(`calc(1.6rem + 1px)`가 마지막 정지점) 배경 반복 주기가 `1.6rem + 1px`(26.6px)가 됨. 텍스트 줄 높이는 정확히 `1.6rem`(25.6px)이라 **한 줄마다 1px씩 어긋남이 누적** — 8줄이면 7px, 15줄이면 반 줄. "글이 길수록", "모든 기기에서"라는 증상과 정확히 일치(기기 무관 공통 버그).
- **수정**: 1px 선을 주기 안쪽 끝(`calc(1.6rem - 1px)`~`1.6rem`)에 그려 반복 주기를 정확히 `1.6rem`으로 맞춤. 첫 줄 위치는 1px 위로 이동하지만 시각적으로 구분 불가.
- **검증**: 구/신 CSS를 20줄 텍스트로 나란히 렌더링한 비교 페이지를 Playwright로 스크린샷 — 기존은 14줄쯤부터 줄이 글자를 관통, 수정본은 20줄 내내 정확히 정렬됨을 확인. 이 버그는 데스크톱에서도 동일하게 재현되는 순수 CSS 산수 오류라 데스크톱 검증이 유효함.
- 안드로이드 APK 재빌드·GitHub Release 갱신, 웹은 push로 자동 배포.

### 의사결정 배경
- **왜 세 번의 수정이 필요했는가**: 줄노트 어긋남은 사실 서로 다른 원인 3개가 겹친 증상이었다 — ① 고정 오프셋(v0.9.2, background-position), ② 기기별 폰트 자동 확대(v0.10.5, text-size-adjust), ③ 반복 주기 1px 초과(이번, 누적 오차). 앞의 두 수정도 각자 실제 원인을 고쳤지만, ③은 어긋남이 서서히 누적되는 형태라 짧은 텍스트 테스트에서는 드러나지 않았다. "글이 길어지면 안 맞는다"는 제보 문구가 결정적 단서.

## 2026-07-07 (v0.10.6)

### 변경 사항 — 앱 아이콘 교체 (다크 네이비 배경)
사용자가 새 아이콘 이미지 제공 요청 — 기존 근백색 배경의 일러스트에서 다크 네이비 배경 + 노트/젖병/곰인형 일러스트로 교체.

- **소스 이미지 분석**: 새 이미지는 1024x1024 투명 PNG로, 코너는 완전 투명(alpha=0)이고 둥근 사각형 카드(배경색 약 `rgb(58,58,65)`)가 중앙에 떠 있는 구조 — 이전 소스(근백색 완전 불투명)와 다름. 그대로 리사이즈만 하면 마스커블 아이콘·스플래시에서 흰 배경 위에 어색한 어두운 사각형이 떠 보이는 이음매 문제가 생김.
- **처리**: 소스를 카드 자체의 네이비 톤(`#3c3a42`)으로 flatten해 완전 불투명한 `src/assets/app-icon.png`로 저장. `scripts/generate-icons.mjs`의 마스커블·스플래시 안전영역 배경색도 동일하게 `#3c3a42`로 변경해 이음매 없이 통일.
- **재생성 대상**: 웹 파비콘·아이콘(`public/icons/*`, `public/favicon.png`), Capacitor 소스(`assets/icon.png`/`splash.png`), 안드로이드 adaptive icon + 스플래시(라이트/다크, 세로/가로 전체 해상도) — `npm run icons` + `npx capacitor-assets generate --android`.
- 안드로이드 디버그 APK 재빌드·GitHub Release(`android-latest`) 갱신, 웹은 push로 자동 배포.

### 의사결정 배경
- **왜 흰색이 아닌 네이비로 flatten했는가**: 소스 이미지의 투명 코너 바로 안쪽(반투명 halo 영역)이 이미 다크 톤으로 그라디언트되어 있어, 흰 배경으로 flatten하면 halo와 배경 사이 색 경계가 부자연스럽게 도드라짐. 카드 배경과 같은 네이비로 맞추면 원본 디자인의 "다크 배경에 떠 있는 카드" 톤을 그대로 살리면서 완전 불투명 처리(iOS 홈스크린 아이콘은 투명 배경을 지원하지 않고 검정으로 덧칠하는 특성이 있어, 의도한 색으로 직접 flatten하는 편이 안전).

## 2026-07-06 (v0.10.5)

### 변경 사항 — 줄노트 정렬이 기기마다 다르게 어긋나는 문제 수정
사용자가 실기기 스크린샷과 함께 재제보: "줄노트형식 줄 안맞는 문제 또발생 이유가뭔지 휴대폰마다 좀 다름". v0.9.2에서 고정 오프셋(`background-position`)만 조정했던 것과 달리, 이번엔 "기기마다 다르다"는 단서로 원인을 다시 추적.

- **원인**: 재제보 스크린샷은 아이폰(iOS Safari)에서 발생한 것으로 확인됨. `-webkit-text-size-adjust`는 애초에 **iOS Safari가 좁은 텍스트 칼럼의 가독성을 위해 폰트 크기를 자동으로 확대하는 "텍스트 자동 크기 조정" 기능용으로 Apple/WebKit이 처음 도입한 속성**이고(안드로이드 Chrome/WebView는 이후 동일 속성으로 이 동작을 채택), 이 확대 비율은 **기기 화면 크기·밀도별 휴리스틱**으로 계산돼 기기마다 다르다. `paper-lines` 배경의 줄 간격은 CSS에 지정된 고정 `rem` 값으로 그려지는데, 실제 텍스트 줄 높이는 이 자동 부스팅으로 조금씩 더 커지므로 몇 줄만 지나도 배경 줄과 글자가 어긋난다 — 정확히 "기기마다 다르게, 줄이 이어질수록 더 어긋나는" 증상과 일치.
- **수정**: `src/index.css`의 `html`에 `-webkit-text-size-adjust: 100%; text-size-adjust: 100%;` 추가해 자동 부스팅을 끄고, 모든 기기에서 CSS에 지정한 폰트 크기 그대로 렌더링되도록 강제.
- 안드로이드 APK 재빌드·GitHub Release 갱신, 웹은 push로 자동 배포.

### 의사결정 배경
- **v0.9.2의 background-position 조정만으로는 부족했던 이유**: 그건 모든 기기에 동일하게 적용되는 "고정 오프셋 어긋남"을 고치는 수정이었고, 실제로 그 문제는 고쳤다. 이번 재발은 기기마다 다르게 나타나는 별개의 원인(폰트 자동 부스팅)이라 같은 종류의 버그가 아니었다 — "기기마다 다르다"는 제보 문구가 핵심 단서였다.
- **실기기에서만 재현 가능해 이번엔 직접 검증하지 못함**: `text-size-adjust` 자동 부스팅은 데스크톱 Chromium(Playwright 테스트 환경)에는 적용되지 않는 모바일 전용 동작이라, 이 수정이 실제로 효과가 있는지는 실기기에서 확인이 필요하다.

## 2026-07-06 (v0.10.4)

### 변경 사항 — 초보자용 설치 안내 README 추가 + 저장소 Public 전환
지인 배포를 앞두고 "APK 다운로드에 GitHub 로그인이 필요하다"는 문제와 "안드로이드도 PWA로 되지 않냐"는 질문이 함께 나와, 두 질문을 한 번에 해소하는 방향으로 정리.

- 루트에 `README.md` 신규 작성: 아이폰 PWA 설치, 안드로이드 PWA(방법 A, 추천)·APK(방법 B, 대안) 설치, 회원가입/온보딩/초대 절차, 문의 방법을 비개발자 기준으로 안내.
- GitHub 저장소를 Private → Public으로 전환. 전환 전 `git log --all`·전체 트리에서 `.env`류·API 키·비밀번호 패턴을 재스캔해 커밋 이력에 시크릿이 전혀 없음을 확인(`.env.local`/`android/local.properties`는 애초에 gitignore 대상이라 커밋된 적 없음). 전환 후 비로그인 상태로 Release APK가 정상 다운로드되는 것까지 확인.
- `AGENTS.md`에 저장소 공개 사실과 재확인 규칙("커밋 전 항상 시크릿 유무 재확인")을 기록.

### 의사결정 배경
- **레포를 Public으로 돌린 이유**: private 레포의 Release 첨부파일은 협업자로 초대되지 않은 사용자는 GitHub에 로그인해도 다운로드할 수 없다(404) — 지인에게 매번 협업자 초대를 보내는 것보다 레포 자체를 공개하는 편이 배포 마찰이 훨씬 적다. 커밋된 코드에는 애초부터 실제 키·비밀번호가 없어(anon key는 RLS로 보호되는 공개 전제 값) 공개로 인한 실질적 보안 손실은 없다.
- **안드로이드에 PWA를 "대안"이 아니라 "추천"으로 배치한 이유**: PWA는 로그인·설치파일·"출처를 알 수 없는 앱" 경고 없이 즉시 시작할 수 있고 업데이트도 자동이라, 이 프로젝트가 원래 아이폰에 강제하고 있던 배포 방식과 사실상 동일한 장점을 안드로이드에도 그대로 준다. Capacitor/APK는 "설치형 앱 느낌"을 원하는 사용자를 위한 대안으로 격을 낮췄다. Capacitor 자체를 걷어낼지는 이번엔 결정하지 않고 다음 TODO로 남김(뒤로가기 로직 재구현이 필요해 별도 작업 단위로 분리).

## 2026-07-06 (v0.10.3)

### 변경 사항 — 지난 날짜 일기 수정 경로 부재 수정
사용자 제보: "일기쓴거 수정안됨". 원인 확인 결과 이번 작업과 무관한 기존(v0.1.0부터) 설계 공백 — `EntryDetailPage`에는 삭제 버튼만 있고 수정 버튼이 없었고, `CalendarPage`도 항상 `/entry/:id`(읽기 전용 상세)로만 이동시켰다. `EntryEditorPage`는 애초에 `?date=` 쿼리로 임의 날짜를 편집할 수 있게 설계돼 있었지만(같은 작성자+날짜로 `getEntryByDate` 조회), 그 화면으로 들어가는 진입점이 "오늘 날짜에 다시 글쓰기"뿐이라 실질적으로 당일 글만 수정 가능했다.

- `EntryDetailPage.tsx`에 본인 글일 때(`isMyEntry`)만 보이는 "수정" 아이콘 버튼 추가 — `/write?date=${entry.entry_date}`로 이동. 기존 편집 로직을 그대로 재사용하므로 백엔드·API 변경 없이 상세 화면에 링크 하나만 추가하면 되는 수정.
- 삭제 버튼과 함께 우측 정렬 그룹으로 묶어 배치.
- 안드로이드 APK 재빌드·GitHub Release 갱신, 웹은 push로 자동 배포.

### 의사결정 배경
- **EntryEditorPage 로직을 건드리지 않은 이유**: `saveEntry`의 upsert(`onConflict: 'author_id,entry_date'`)와 `getEntryByDate(userId, date)` 조회가 이미 "특정 날짜의 내 글"이라는 일반적인 키로 동작하고 있어, "오늘"이라는 가정이 코드 어디에도 하드코딩돼 있지 않았다. 즉 버그는 로직이 아니라 진입점 부재였으므로, 상세 화면에 링크만 추가하는 최소 수정으로 충분했다.

## 2026-07-06 (v0.10.2)

### 변경 사항 — 관리자 계정에서 "가족 구성원"에 타 가족 계정이 노출되는 버그 수정
사용자가 실 프로덕션에서 관리자 계정으로 설정 화면을 열었더니 "내 가족 구성원"에 테스트로 만든 남의 가족 계정이 함께 나온다고 제보.

- **원인**: v0.10.0에서 관리자 대시보드(`/admin`)가 문의 작성자 이름을 보려고 `profiles` 테이블의 select RLS 정책에 `or is_admin()`을 추가했는데, `getProfiles()`(`select('*') from profiles`, household 필터 없이 RLS에 전적으로 의존)는 앱 전역에서 범용으로 쓰이는 함수라 관리자 계정으로 호출되는 순간 어디서든 전 가족의 프로필이 그대로 반환됨. `src/features/settings/SettingsPage.tsx`의 "가족 구성원" 목록은 이 결과를 필터링 없이 그대로 나열하고 있어서, 관리자 계정에서는 본인 가족이 아니라 시스템 전체 계정이 뜨는 정보 노출 버그가 됨.
- **수정**: `InviteSection`에서 `useHouseholdId()`로 얻은 내 household_id로 `profiles` 배열을 클라이언트에서 한 번 더 필터링(`p.household_id === householdId`) 후 렌더링. `EntryDetailPage`/`InvestPage`의 다른 `useProfiles()` 사용처는 특정 `author_id`를 `.find()`로 정확히 찾는 방식이라(그 author는 이미 내 household 소속 콘텐츠의 작성자로 한정됨) 같은 문제가 없어 손대지 않음.
- 안드로이드 APK 재빌드 후 GitHub Release(`android-latest`) 갱신, 웹은 커밋 push로 자동 배포.

### 의사결정 배경
- **RLS 정책을 되돌리는 대신 컴포넌트에서 필터링한 이유**: `is_admin()` 조건 자체는 관리자 대시보드가 문의 작성자 이름을 표시하려면 반드시 필요하다. 문제는 정책이 아니라 "household 필터 없이 전체를 가져오는 범용 쿼리(`getProfiles`)를 화면에 그대로 뿌린 것"이므로, 표시 계층에서 다시 좁혀주는 것이 근본 수정이다. `getProfiles` 자체를 household 인자로 바꾸는 것도 고려했으나, 이미 여러 화면(온보딩 가드, 작성자 이름 조회)이 "전체를 받아서 클라이언트에서 찾기" 패턴에 의존하고 있어 변경 범위가 커짐 — 이번엔 실제로 문제가 있던 한 곳만 최소 수정.
- **실 프로덕션에서 사용자가 직접 발견**: mock 스모크 테스트로는 잡을 수 없는 종류의 버그(관리자 RLS 확장과 여러 계정이 실제로 존재하는 상태에서만 드러남) — E2E 검증 중 실제 관리자 계정으로 확인해야 하는 부분이 여전히 중요하다는 걸 보여준 사례.

## 2026-07-06 (v0.10.1)

### 변경 사항 — 앱 아이콘 교체
- 사용자가 제공한 새 아이콘 이미지(따뜻한 크림톤 육아일기장 + 아기 얼굴 + 곰인형·젖병·별·하트 장식, 1254×1254 PNG)로 교체. `src/assets/app-icon.svg`(손그림 SVG, 코랄 배경)를 삭제하고 `src/assets/app-icon.png`을 새 마스터 소스로 사용.
- `scripts/generate-icons.mjs`를 SVG 래스터화 방식에서 PNG 리사이즈 방식으로 변경. 새 아이콘의 배경색(거의 순백, `#fefdff`)을 스플래시·마스커블 안전영역 배경에도 동일하게 적용해 이음매 없이 이어지도록 함.
- 마스커블 아이콘(`maskable-512.png`)은 새 아이콘을 80% 크기로 축소해 중앙 배치 — 아이콘 자체가 이미 모서리가 둥근 사각형 그래픽이라, 안드로이드 런처가 원형 등으로 마스킹해도 곰인형·젖병 같은 모서리 장식이 잘리지 않도록 여유 안전영역을 확보.
- `public/icons/*`, `public/favicon.png`, `assets/icon.png`(Capacitor), `assets/splash.png` 전체 재생성 후 `npx capacitor-assets generate --android`로 안드로이드 mipmap 아이콘(4종×5밀도)·스플래시(라이트/다크×세로/가로×6밀도) 87개 파일 갱신, APK 재빌드 후 GitHub Release(`android-latest`) 업로드 완료.

### 의사결정 배경
- **SVG 파이프라인을 유지하지 않고 PNG로 완전히 전환**: 사용자가 제공한 이미지가 이미 완성된 래스터 일러스트(음영·질감이 있는 3D 스타일)라 SVG로 재현하는 것은 비현실적이고 불필요 — 원본 품질을 그대로 쓰는 게 낫다고 판단. 기존 SVG는 더 이상 어디서도 참조되지 않아 완전히 삭제(죽은 코드 방지).
- **마스커블 안전영역을 80%로 설정**: 새 아이콘은 이미 자체적으로 둥근 사각형 카드 모양이라 캔버스 전체를 거의 채우고 있음 — 안드로이드 적응형 아이콘 마스크(원형 등)가 그대로 적용되면 곰인형·별 장식의 모서리가 잘릴 수 있어, 기존 아이콘과 동일하게 80% 축소 후 배경색으로 여백을 채우는 방식을 유지.

## 2026-07-06 (v0.10.0)

### 변경 사항 — 공개 회원가입·배우자 초대·다자녀·문의/관리자
사용자 요청: "새로운 사용자 회원가입 후 배우자초대 및 자녀둘이상일때 분기하기 관리자에게 문의남기는것 관리자는 내아이디로 관리자페이지 따로구성". 지금까지 폐쇄형(관리자가 SQL로 수동 계정·가족 생성)이던 온보딩을 실제 공개 서비스 형태로 확장.

- **마이그레이션 `supabase/migrations/0004_signup_multichild_admin.sql`(신규, ⚠️ 미적용)**:
  - `create_household_with_child(household_name, display_name, child_name, child_birth)` SECURITY DEFINER RPC — 회원가입 후 온보딩에서 households/profiles/children 3-테이블 insert를 원자적으로 처리. RLS insert 정책을 직접 여는 대신 RPC로만 열어 household_id 위조를 원천 차단(households/profiles에 insert 정책 자체를 추가하지 않음).
  - `invites` 테이블 + `create_invite()`/`join_household(code, display_name)` RPC — 8자 코드(32^8 조합, 혼동 문자 제외), 72시간 만료, 1회성(`for update`로 동시 사용 경합 차단), 가구당 활성 코드 5개·구성원 4명 제한.
  - `diary_entries.child_id`(nullable, FK children, null="모두") 추가 — insert/update RLS에 "child_id가 null이거나 내 household 소속 아이여야 함" 조건 추가.
  - `admins` 테이블(RLS 정책 0개 — 클라이언트 직접 접근 전면 차단) + `is_admin()` — `profiles.role` 방식은 본인 행 update가 허용된 RLS 특성상 셀프 승격이 가능해 배제. 관리자 계정을 이메일로 조회해 시드(실제 이메일은 공개 문서에 기록 안 함).
  - `inquiries` 테이블(문의 2000자 제한, 답변 대기 5개 초과 트리거 차단) + `admin_stats()` RPC(가족·구성원·아이·일기·미답변 문의 수).
- **가입/온보딩**: `AuthProvider.signUp` 추가(이메일 인증 없이 즉시 가입), `LoginPage`에 로그인/가입 모드 토글. `src/features/onboarding/`(신규) — 가입 직후 "새 가족 만들기" 또는 "초대코드로 합류" 선택. `ProtectedRoute.tsx`에 `OnboardingGate`(profiles 행 없으면 `/onboarding`으로 강제 이동 — `my_household_id()`가 null이라 RLS가 자연 차단되는 상태를 프론트에서 감지)와 `RedirectIfOnboarded` 추가.
- **다자녀 지원**: `getChild().limit(1).single()` 단일 아이 강제 조회를 `getChildren()`(전체, 생일순)으로 교체. `src/features/shared/SelectedChildProvider.tsx`(신규) — 아이 목록 + 선택 상태를 Context+localStorage로 관리, 삭제 등으로 선택값이 무효해지면 첫째로 자동 폴백. `ChildSwitcher`(신규 공용 컴포넌트)를 성장·투자 탭 헤더에 배치(아이 1명이면 자동 숨김). 성장·투자 쿼리(`getGrowthRecords`/`getMilestones`/`getTrades`/`getDividends`)에 `childId` 필터 추가, queryKey에도 포함해 아이별로 캐시 분리. 설정 탭에 아이별 수정 폼 + "아이 추가" 추가.
- **일기 대상 선택**: `EntryEditorPage`에 아이 2명 이상일 때만 노출되는 "모두/아이별" 세그먼트 추가(1명이면 기존 UX 완전 불변). 피드·상세 화면에 대상 아이 뱃지 표시(2명 이상 + 특정 아이 지정 시에만).
- **관리자 문의/페이지**: 설정 탭 "문의하기" 섹션(등록 + 내 문의·답변 목록), `src/features/admin/`(신규) — `/admin` 라우트(`AdminRoute` 가드, `is_admin()` RPC 기반), 문의 목록·답변 작성·전체 현황(`admin_stats`) 대시보드.
- Playwright(mock, 아이 2명 시드)로 스모크: 피드 헤더가 가족명으로 전환 + 대상 뱃지, 성장 탭 아이 전환 시 기록이 완전히 분리(둘째는 빈 상태), 작성 화면 대상 선택 → 저장 → 뱃지 반영, 설정 화면 아이 목록/추가/초대/문의 섹션 렌더 확인(콘솔 에러 0건). 그 과정에서 `ChildSwitcher`의 Tabs가 비제어→제어로 전환되는 React 경고를 발견해 `value={selectedChildId ?? ''}`로 수정.

### 의사결정 배경
- **households/profiles insert를 RLS 정책이 아닌 RPC로만 연 이유**: `with check`로 `household_id`의 정당성(위조 여부)을 표현할 방법이 없다 — RLS insert 정책을 열면 다른 가족의 UUID를 알아내는 것만으로 그 가족에 합류할 수 있는 격리 우회가 생긴다. SECURITY DEFINER 함수 내부에서 household_id를 직접 생성/검증하면 위조가 원천적으로 불가능하고, 3-테이블 insert도 단일 트랜잭션이 되어 중간 실패로 인한 고아 household도 없다.
- **관리자 판별을 profiles.role 대신 admins 테이블로**: role 컬럼 방식은 기존 `profiles_update_own` 정책(`using (id = auth.uid())`)이 본인 행 수정을 허용하므로 사용자가 자기 role을 직접 관리자로 바꾸는 셀프 승격이 가능해진다. admins 테이블은 RLS 정책을 아예 만들지 않아 클라이언트가 읽기/쓰기 어느 것도 할 수 없고, `is_admin()`도 SECURITY DEFINER라 우회 불가능.
- **온보딩 미완료 사용자를 별도 에러 처리 없이 자연 차단으로 설계**: 가입만 하고 아직 `profiles` 행이 없는 사용자는 `my_household_id()`가 null을 반환해 모든 RLS 조건(`household_id = my_household_id()`)이 자동으로 false가 되므로, 별도 방어 코드 없이 전 테이블 접근이 차단된다. 프론트의 `OnboardingGate`는 이 상태를 "에러"가 아니라 "profiles가 빈 배열"로 감지해 온보딩으로 유도할 뿐, 실제 방어는 전적으로 DB 레벨에서 이미 끝나 있다.
- **다자녀 전환에서 기존 API 함수명을 그대로 유지하지 않고 getChild→getChildren으로 이름을 바꾼 이유**: 반환 타입이 단일 객체에서 배열로 바뀌는 파괴적 변경이라, 이름을 유지하면 호출부에서 타입 오류 없이 잘못된 가정(여전히 단일 아이)으로 컴파일될 위험이 있었다. 이름을 바꿔 모든 호출부를 강제로 다시 검토하게 만들었다.
- **일기는 다자녀여도 child_id를 필수로 만들지 않고 nullable(="모두")로 설계**: 사용자가 명시한 요구사항이 "대상을 모두, 자녀선택 고르기 분기"였고, 실제로 형제 공통 이벤트(가족 나들이 등)를 특정 아이 하나에 억지로 귀속시키는 것은 부자연스럽다. null을 "가족 전체"라는 유효한 의미로 설계해 UI에서도 "모두"를 동등한 선택지로 제공했다.
- **mock 모드는 다자녀 UI 검증까지만 지원하고 가입·온보딩·초대·문의·관리자는 지원하지 않음**: 이 기능들의 핵심 위험은 Auth 세션·RPC·RLS 상호작용인데 mock으로는 애초에 검증 불가능한 영역이고, mock에 Auth 시뮬레이션까지 넣으면 유지비만 늘어난다. 대신 각 함수가 mock에서 명시적 에러를 던지게 해 실수로 mock 모드에서 호출되면 바로 드러나게 했다.

## 2026-07-05 (v0.9.2)

### 변경 사항
- **뒤로가기 재수정**: v0.9.1에서 `window.history.back()`으로 고친 안드로이드 뒤로가기를 사용자가 실기기에서 재확인한 결과 "이전에 갔던 탭들을 왔다갔다 한다"는 문제가 남아있었음. React Router의 매 탭 전환이 브라우저 히스토리에 그대로 쌓이는 게 원인 — 히스토리를 따라가는 대신 `src/lib/useAndroidBackButton.ts`를 고정 규칙(경로가 `/`가 아니면 `/`로, `/`면 종료)으로 교체.
- **줄노트 줄·자간 시각 보정**: `paper-lines` 유틸의 `background-position`을 `0.4rem`→`0rem`으로 조정해 밑줄이 각 텍스트 줄 바로 아래 오도록 정렬(기존엔 baseline과 약 0.5rem 어긋나 어색한 공백이 있었음). `.font-hand`에 `letter-spacing: 0.02em` 추가로 Hi Melody 폰트의 좁은 자간을 보정.

### 의사결정 배경
- **히스토리 기반 뒤로가기를 폐기하고 고정 규칙 채택**: 브라우저 히스토리를 따라가는 방식은 이론적으로는 "정확한 이전 화면"으로 보이지만, 바텀탭 앱에서는 탭 전환도 전부 히스토리에 쌓이므로 사용자 체감상 "왔다갔다"하는 것처럼 느껴진다. 안드로이드 바텀 내비게이션의 표준 관례(어느 탭에 있든 뒤로가기 1번=홈 탭, 홈 탭에서 뒤로가기=종료)를 그대로 채택해 예측 가능성을 우선했다.
- **줄노트 정렬을 수치 미세조정 대신 실측(스크린샷 비교)으로 결정**: Hi Melody 같은 손글씨 폰트는 표준 폰트와 베이스라인 비율이 달라 계산만으로 정확한 오프셋을 구하기 어렵다 — Playwright로 실제 렌더링을 스크린샷 찍어 확대 비교하며 오프셋을 조정하는 방식을 택함.

## 2026-07-05 (v0.9.1)

### 변경 사항 — 모바일 UX 버그 3건 수정
실기기(안드로이드 APK) 사용 중 사용자가 발견한 3가지 문제를 수정.

1. **마일스톤 등 하단 시트의 저장 버튼이 기기 하단 버튼/제스처 바와 겹침**: `src/components/ui/sheet.tsx`의 `SheetContent` `side="bottom"` 변형에 `pb-safe`가 빠져 있었다. Radix Dialog는 `document.body`에 포털돼 `AppShell`의 안전영역 처리(`pb-nav`)를 상속받지 못하므로, 시트 자체에 `env(safe-area-inset-bottom)` 패딩을 직접 넣어야 했다. 한 곳만 고치면 투자·성장 탭의 모든 폼(거래·배당·메모·성장기록·마일스톤)에 일괄 적용됨.
2. **일기 상세 화면에서 안드로이드 뒤로가기를 누르면 인앱 이동 대신 앱이 최소화됨**: `@capacitor/app` 플러그인이 아예 설치돼 있지 않아 `backButton` 이벤트에 대한 리스너가 전혀 없었고, 리스너가 없으면 Android 기본 동작(액티비티 종료 = 앱 최소화)만 발생한다. `@capacitor/app` 설치 후 `src/lib/useAndroidBackButton.ts` 신설 — 네이티브 플랫폼에서만 `backButton`을 구독해 `canGoBack`이면 `window.history.back()`(react-router가 popstate로 자동 처리), 아니면(=피드/메인) `App.exitApp()`.
3. **사진 넘기기가 탭 전용이라 인스타그램처럼 스와이프가 안 됨**: `src/components/PhotoCarousel.tsx`를 좌우 탭존 방식에서 포인터 이벤트 기반 드래그로 재작성. 드래그 중 실시간으로 `translateX`가 손가락을 따라가고, 50px 임계값을 넘으면 다음/이전 사진으로 스냅(300ms 트랜지션), 못 넘으면 원위치로 복귀.

### 의사결정 배경
- **안드로이드 뒤로가기는 Playwright로 재현 불가**: 하드웨어/제스처 백버튼은 Capacitor 네이티브 브릿지 이벤트라 웹 브라우저 기반 자동화로는 검증할 수 없다 — 코드 로직(리스너 등록·canGoBack 분기)은 확인했지만 실제 동작은 사용자의 실기기 재확인이 필요함을 handoff.md에 명시.
- **스와이프 임계값을 50px 고정값으로**: 화면 너비 비율(%)로 하면 큰 화면에서 과도하게 많이 밀어야 하고 작은 화면에서 너무 예민해진다 — Instagram 등 참고 앱들도 절대 픽셀 임계값을 쓰는 편이라 동일하게 채택.

## 2026-07-05 (v0.9.0)

### 변경 사항 — 보안·과금 방어 점검 + 전체 리팩토링
전체 코드·마이그레이션·인프라 설정을 전수 점검한 결과를 반영.

**점검 결과: 이미 안전했던 것 (조치 불필요)**
- RLS 13개 테이블 전부 활성 + household 격리, Storage household 폴더 격리, 회원가입 비활성화, XSS 벡터 0건(`dangerouslySetInnerHTML`/`eval` 없음), service_role 키 미사용, 시크릿 커밋 없음.
- **"비정상 요청 시 과금" 위험은 구조적으로 없음**: Supabase 무료 조직·Vercel Hobby 모두 결제수단 미등록 하드캡 플랜 — 한도 초과 시 과금이 아니라 서비스 일시정지. 리스크는 돈이 아니라 "정지"이므로 아래 조치들은 남용으로 한도를 잠식당하는 표면을 줄이는 것.

**신규 조치**
- `supabase/migrations/0003_hardening.sql` (SQL Editor 수동 적용 필요):
  1. photos 버킷 `file_size_limit 3MB` + `allowed_mime_types` 이미지 3종 — 클라이언트 압축(1600px WebP)을 우회한 대용량 직접 업로드로 무료 1GB 스토리지를 잠식하는 경로 차단.
  2. 전 텍스트 컬럼 길이 CHECK(일기 1만자·댓글 1천자·메모 500자 등) — 초대형 텍스트로 DB(500MB) 잠식 차단.
  3. **profiles.household_id 변경 금지 트리거** — `profiles_update_own` RLS가 본인 행 여부만 검사하고 household_id 값 변경은 막지 않아, 타 가족 UUID를 알아내면 자기 소속을 바꿔 그 가족 데이터에 합류할 수 있는 멀티테넌트 격리 우회 구멍이 있었음(이번 점검의 가장 중요한 발견).
  4. children household당 5명 제한 트리거.
- `vercel.json` 보안 헤더: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-Robots-Tag: noindex` + `index.html`에 robots noindex 메타(비공개 가족앱 검색엔진 색인 차단).
- 사진 서명 URL TTL 7일 → **24시간** 단축(유출 시 노출 창 축소), `usePhotoUrls` 캐시도 stale 12h/gc 24h로 연동 조정.

**리팩토링 (동작 불변)**
- `src/features/shared/useHousehold.ts` 신설: `useHouseholdId()` 이동 + `useMyProfile()` 신설 — diary 피처에 있던 훅을 invest/growth/settings 7개 파일이 가져다 쓰던 구조와, `profiles?.find(p => p.id === userId)` 중복 3곳을 정리.
- `src/components/Fab.tsx` 신설: 3개 화면에 중복되던 플로팅 추가 버튼 마크업 통합.
- `mapRawEntry`의 `any` 제거 — 조인 응답 타입 `RawEntryRow` 명시.
- `SettingsPage` 저장 함수에 catch + 에러 토스트 추가(기존엔 실패해도 아무 안내 없음).
- **라우트 lazy loading**: 캘린더/앨범/검색/성장/투자/설정을 `React.lazy`로 분리(`Suspense` fallback은 기존 `SplashScreen` 재사용) — 메인 번들 665KB→343KB(gzip 191→107KB), 초기 로드와 무료 전송량 모두 절약.

### 의사결정 배경
- **CSP(Content-Security-Policy)는 의도적으로 제외**: XSS 벡터가 이미 없고(React 이스케이프, 위험 API 미사용), Vite 번들·서비스워커·Supabase 연결을 정확히 허용하는 CSP를 잘못 쓰면 앱이 통째로 깨진다. 방어 이득 대비 리스크가 커서 기본 헤더 4종+noindex만 적용 — 필요해지면 report-only 모드로 단계 도입.
- **profiles.household_id 방어를 RLS with check가 아닌 트리거로**: with check 안에서 `my_household_id()`를 부르면 함수가 profiles 자신을 읽는 자기참조가 되어 UPDATE 중 평가 시점이 미묘해짐 — `old`/`new`를 직접 비교하는 BEFORE UPDATE 트리거가 의미가 명확하고 확실함.
- **서명 URL TTL을 1시간이 아닌 24시간으로**: 더 짧을수록 안전하지만 React Query 캐시 만료 주기가 짧아져 서명 API 호출이 늘고, 캐시된 만료 URL로 이미지가 깨지는 창이 생김. 가족 전용 앱의 위협 모델(URL을 가족이 실수로 외부 공유)에서는 24h가 보안·UX 균형점.
- **mock 분기 구조는 리팩토링하지 않음**: api.ts마다 반복되는 `if (useMock)` 분기는 중복이지만 AGENTS.md에 문서화된 의도적 패턴이고, 추상화하면 mock/실제 경로가 한눈에 안 보이게 됨 — 유지.

## 2026-07-05 (v0.8.0)

### 변경 사항
- **Vercel 프로덕션 배포**: "아이폰은 어떻게 설치?"라는 질문에서 출발 — 아이폰은 PWA만 설치 가능하고, PWA의 홈화면 추가·서비스워커 등록은 HTTPS로 실제 배포된 URL이 있어야 동작하므로 배포를 먼저 진행.
  - `npx vercel link --yes --project baby-diary`로 Vercel 프로젝트 생성. GitHub 저장소 자동 연결은 실패했지만(권한 문제로 추정) CLI 직접 배포(`vercel --prod`)에는 지장 없어 그대로 진행.
  - 프로덕션 환경변수 3개(`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/`VITE_USE_MOCK=false`) 등록 후 `npx vercel --prod --yes`로 배포 → https://baby-diary-tau.vercel.app.
  - Playwright로 프로덕션 URL 직접 접속해 로그인 화면 렌더·콘솔 에러 0건·`manifest.webmanifest` 200·서비스워커 실제 등록을 확인.

### 의사결정 배경
- **PowerShell 파이프로 등록한 환경변수가 손상됨 — 원인과 대응**: `"value" | npx vercel env add NAME production` 방식으로 처음 등록했을 때 `vercel`이 "Value contains newlines" 경고를 냈다. 의심스러워 `vercel env pull`로 실제 저장된 값을 확인해보니 `VITE_SUPABASE_ANON_KEY`가 `"﻿sb_publishable_...\r\n"`처럼 **BOM(U+FEFF)이 앞에, 리터럴 CRLF가 뒤에 붙은 채로 저장**돼 있었다. Windows PowerShell이 파이프로 문자열을 흘려보낼 때 기본적으로 UTF-16LE+BOM, CRLF 개행으로 인코딩하기 때문 — 이 값 그대로였다면 Supabase anon key가 실제 키와 문자 단위로 달라 프로덕션에서 로그인 자체가 조용히 실패했을 것이다. 세 변수를 모두 삭제하고 Bash의 `printf '%s' "value"`(개행 없음, UTF-8, BOM 없음)로 재등록해 `vercel env pull`로 재검증했다. **교훈**: 이 프로젝트에서 PowerShell 파이프로 외부 서비스(CLI)에 값을 전달할 때는 항상 저장된 값을 다시 읽어 검증하고, 가능하면 Bash의 `printf`를 우선 사용할 것 — 특히 실제 서비스 키처럼 문자 하나만 틀려도 조용히 실패하는 값에서는 눈으로 보이지 않는 손상(BOM·개행)이 치명적이다.
- **GitHub 자동 연동 실패를 원인 추적하지 않고 CLI 직접 배포로 우회(임시)**: `vercel link`가 GitHub 저장소 연결에 실패했지만, 이 세션의 1차 목표(아이폰에서 설치 가능한 URL 확보)에는 자동 배포 여부가 필수가 아니었다. 원인 조사에 시간을 쓰는 대신 `vercel --prod`로 즉시 배포하는 실용적 경로를 먼저 택하고 GitHub 연동은 TODO로 남겼다 — 바로 다음 요청("깃허브 TODO 진행")으로 마저 처리함(아래 참고).

## 2026-07-05 (v0.8.2)

### 변경 사항
- **버그 수정 — 투자일기(거래·배당·메모)에 삭제 수단이 아예 없었음**: 사용자가 "수정하는게 안보임 삭제버튼이나"로 지적. `src/features/invest/api.ts`를 확인해보니 add/get만 있고 delete 함수 자체가 존재하지 않았음 — 성장 탭(`growth_records`/`milestones`)은 이미 삭제가 구현돼 있던 것과 비교되는 누락이었다. `deleteTrade`/`deleteDividend`/`deleteNote`(api.ts)와 `useDeleteTrade`/`useDeleteDividend`/`useDeleteNote`(useInvestQueries.ts)를 성장 탭과 동일한 패턴으로 추가하고, `InvestPage.tsx` 타임라인 각 행에 `X` 삭제 버튼을 달았다. 메모는 작성자 본인 것만(`author_id === userId`) 삭제 버튼이 보이고, 거래·배당은 가족 공용 데이터라 household 구성원 누구나 삭제 가능(기존 RLS `trades_all`/`dividends_all`이 이미 household 단위로 허용하고 있어 스키마 변경 없이 앱 레이어만 추가).

### 의사결정 배경
- **삭제만 추가하고 수정(edit) UI는 만들지 않음**: 사용자의 원문은 수정과 삭제 둘 다를 언급했지만, 이미 이 앱에는 "성장 탭은 삭제만 지원하고 수정 UI가 없다"는 선례가 있고 그 방식이 지금까지 문제로 지적된 적이 없었다. 투자 탭에도 같은 패턴(삭제 후 재작성)을 적용해 앱 전체의 일관성을 유지했다. 특히 `invest_notes` 테이블은 RLS에 `update` 정책이 아예 없어(select/insert/delete만 존재) 진짜 수정 기능을 만들려면 마이그레이션이 별도로 필요한 상태 — 지금 당장의 불편(삭제 자체가 안 됨)을 먼저 해소하는 쪽을 우선했고, 수정 UI가 정말 필요하면 그때 마이그레이션까지 포함해 다시 다루기로 함.
- **거래·배당은 household 전체 삭제 허용, 메모만 작성자 제한**: 이미 마이그레이션에 반영된 기존 RLS 설계를 그대로 따랐을 뿐 새로 정책을 만들지 않았다 — 거래·배당은 "가족 공용 장부"라는 성격이라 배우자가 실수를 정정할 수 있어야 하고, 메모는 "개인 코멘트"에 가까워 diary의 댓글 삭제와 동일하게 본인 것만 지우게 하는 편이 일관적이다.

## 2026-07-05 (v0.8.1)

### 변경 사항
- **Vercel-GitHub 자동 배포 연동 완료**: CLI(`vercel link`/`vercel git connect`)로는 GitHub 저장소 연결이 계속 실패해, 사용자가 Vercel 대시보드(Project Settings → Git → Connect Git Repository)에서 GitHub 앱 접근 권한을 직접 승인하도록 안내. 이후 `npx vercel git connect`가 "already connected"를 반환해 연결을 CLI로 재확인.
- 로컬에만 있던 커밋 5개(v0.5.0~v0.8.0)를 `git push origin master`로 처음 push해 실전 검증: push 23초 만에 새 Production 배포가 자동 생성되고 `Ready` 상태로 전환, 프로덕션 alias(`baby-diary-tau.vercel.app`)도 새 배포로 자동 갱신됨을 확인. 이제 `master` push만으로 재배포됨(수동 `vercel --prod` 불필요).

### 의사결정 배경
- **CLI 실패 시 브라우저 승인으로 전환한 이유**: `vercel link`/`vercel git connect` 모두 "Failed to connect... make sure you have access"라는 동일한 에러만 반복해 CLI 쪽에서 더 파고들 단서가 없었다 — 이런 에러는 대개 Vercel의 GitHub App이 해당 저장소에 대한 설치 권한 자체를 받지 못한 상태(OAuth/App 설치는 브라우저 플로우 전용)라, CLI로 재시도만 반복하기보다 사용자에게 대시보드에서 권한을 승인받는 쪽이 더 빠르고 확실했다.
- **연결 성공을 "already connected" 메시지만으로 끝내지 않고 실제 push로 검증**: 설정 화면상 "연결됨" 표시와 실제 자동 배포 파이프라인 동작은 다를 수 있어(예: 웹훅 미등록 등), 마침 로컬에 밀려있던 실제 커밋들을 push해 종단간(E2E)으로 확인했다 — 배포가 실패했다면 그 자체로 롤백 없이 바로 원인 파악이 가능했던 시점이라 리스크가 낮았다.

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
