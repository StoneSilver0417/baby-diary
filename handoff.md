# baby-diary - Handoff

## 현재 상태

- **버전**: v0.11.4 (앨범 날짜별 그룹 + 사진 뷰어)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과.
- **배포 상태**: 웹은 push로 자동 배포. GitHub Release `android-latest`는 안내문으로 교체(APK 파일 제거). 안드로이드도 아이폰과 동일하게 PWA 단일 경로.
- **실행 방법/URL**: 웹 https://baby-diary-tau.vercel.app (안드로이드는 Chrome에서 접속 후 "홈 화면에 추가"·"앱 설치", `README.md` 참고) / 로컬 `npm run dev`(`.env.local`의 `VITE_USE_MOCK=false`, 실 Supabase 연결).

## 최근 작업

- **앨범 날짜별 그룹 + 사진 뷰어 (v0.11.4)**: 앨범을 평면 그리드→날짜별 타일로 개편. 여러 장이면 대표 사진 + 뒤에 겹침 효과 + 장수 배지, 클릭 시 일기 대신 전체화면 사진 뷰어(라이트박스, 스와이프·object-contain, 앨범 페이지 내부 오버레이 상태로 구현해 뒤로가기 불변식과 무충돌). `PhotoCarousel`에 `fit`/`fill` 옵션 추가(기존 사용처 무영향). Playwright로 실제 업로드 검증 완료.
- **댓글 입력 자동 높이 textarea (v0.11.3)**: 댓글이 길어지면 단일 줄 Input에서 가로 스크롤되던 문제 해결. `AutoGrowTextarea`(scrollHeight 기반 세로 자동 확장, iOS field-sizing 미지원 대응, 최대 `max-h-32` 후 내부 스크롤) 신설해 댓글 작성창·인라인 수정창에 적용. Enter=줄바꿈, 등록/저장은 버튼. Playwright 검증 완료.
- **댓글 수정 기능 추가 (v0.11.2)**: 본인 댓글에 연필 버튼 → 인라인 입력창(저장/취소)으로 수정. `updateComment` API + `useUpdateComment` 옵티미스틱 뮤테이션 + EntryDetailPage UI. 마이그레이션 0005(`comments_update_own` RLS) 실 프로덕션 적용 완료 → 실환경 동작. Playwright(mock)로 UI·옵티미스틱 검증 완료.
- **앱 셸 레이아웃 리팩터 (v0.11.1)**: StyleGallery(CSS 레이아웃 패턴 카탈로그) 참고. `AppShell`의 하단 탭바를 `fixed`+`pb-nav`(매직넘버 여백) 방식에서 **scroll-body-shell grid**(`grid-rows-[minmax(0,1fr)_auto] h-dvh`)로 전환 — 탭바가 grid 실제 행이 되어 콘텐츠가 탭바에 가리는 게 구조적으로 불가능해지고 매직넘버 제거. FAB은 fixed 유지(정석), FAB 화면 3개에만 `pb-20` 여백. 덤으로 EntryDetail 댓글 입력줄에 sticky-footer 패턴(`grid-rows-[1fr_auto]`) 적용해 짧은 글에서 입력줄이 중앙에 뜨던 기존 문제도 해결. Playwright로 짧은 글/긴 글 스크롤 전부 검증.
- **안드로이드 PWA 단일화 — Capacitor/APK 완전 철거 (v0.11.0)**: v0.10.4부터 미뤄온 결정 실행. Capacitor 코드 의존은 `useAndroidBackButton.ts` 1개뿐이라 핵심은 **뒤로가기 훅의 popstate 재구현**이었음.
  - **"홈 앵커 불변식" 설계**: 히스토리 스택을 항상 `['/']` 또는 `['/', 현재화면]`(깊이 2 이하)로 유지 — 비홈→비홈 이동은 `AppLink`/`navigate(...,{replace:true})`로 처리해 스택이 안 쌓이게 하고, 홈으로 가는 이동은 `useGoHome()`이 앵커로 `pop`. 이러면 "비홈에서 백=홈"은 라우터 네이티브 pop으로, "홈에서 백=앱 최소화"는 스택 바닥이라 OS 기본 동작으로 재현됨(Capacitor 하드웨어 백버튼 없이). `src/lib/navigation.tsx`(AppLink·useGoHome), `src/lib/useBackNavigation.ts`(standalone 딥링크 정규화 + POP 안전망) 신설.
  - raw `pushState` 센티널 트랩 방식은 기각 — react-router(v8.1.0)가 `history.state.idx`로 스택을 추적하는데 raw push가 이를 오염시킴(소스 확인).
  - **UX 변경**: 상세·검색 화면의 헤더 ← 버튼이 "직전 화면"이 아닌 "홈"으로 감(하드웨어 백과 동작 통일, 사용자 확정 사항).
  - Capacitor 의존성 5개(`@capacitor/*`) 제거, `capacitor.config.ts`·`android/`·`assets/`(icon·splash 소스) 삭제, `scripts/generate-icons.mjs`의 Capacitor 자산 생성 블록 제거.
  - Playwright로 8가지 시나리오 전부 검증(불변식 유지, 비홈→백=홈, 홈→백=이탈, 헤더←=홈, standalone 딥링크 정규화, 새로고침 멱등, dev/prod 빌드 양쪽, 로그인 리다이렉트 무경합) — dev 서버와 `vite preview`(실제 프로덕션 빌드) 둘 다 확인.
  - GitHub Release `android-latest`의 APK 자산 제거하고 "PWA로 전환됨" 안내문으로 교체. README 방법 B(APK) 섹션 삭제.
- 이전 이력(줄노트 1px 누적 오차 수정 v0.10.7, 앱 아이콘 교체 v0.10.6 등)은 CHANGELOG.md 참고.

## 알려진 이슈

- **줄노트 배경선이 실기기(아이폰)에서 아예 안 보인다는 제보 (조사 중, 미해결)**: v0.10.7 배포 후 와이프 아이폰 스크린샷에서 `paper-lines` 배경선이 완전히 안 보임(정렬 문제가 아니라 부재). 실제 WebKit 엔진 + 프로덕션 빌드로 재현 시도했으나 정상 렌더링됨(코드·빌드 문제 아님으로 확인) — PWA/Safari 캐시가 유력 용의자. **다음 확인 필요**: 앱 완전 종료 후 재실행(또는 삭제 후 재설치)해도 재현되는지 재확인 요청해둔 상태, 아직 회신 없음.
- 부부 실제 로그인 정보(이메일/비밀번호)는 이 문서에 기록하지 않음. (실계정은 `waterdrop11@naver.com`=아빠, `angelkies06@naver.com`=엄마, 가족 "우리집" 하나. 2026-07-08 기준 auth.users 2명·households 1개만 존재)
- **안드로이드·아이폰 실기기 재검증 필요**: 이번 뒤로가기 재구현(홈 앵커 불변식)이 데스크톱 Playwright로는 검증됐지만, 실기기 하드웨어/제스처 백·Chrome의 히스토리 조작 개입 여부는 미확인. 기존 이월 항목(다자녀 스위처·일기 대상 선택·새 앱 아이콘)도 함께 재검증 필요.
- **PWA 서비스워커 캐싱 주의**: 배포 후에도 이미 방문했던 브라우저/설치된 PWA는 이전 버전을 계속 서빙할 수 있음 — 실기기에서 업데이트가 안 보이면 앱 완전 종료 후 재실행 필요.
- `src/types/database.ts`는 여전히 수동 작성 타입(gen-types 미적용).
- 투자일기 거래·배당·메모는 삭제만 가능, 수정(edit) UI는 없음(의도된 범위).
- claude.ai/design 연동, Cloudflare R2 사진 분리는 보류 상태(설계만 `docs/r2-photo-plan.md`에 보존).

## 다음 TODO

0. [x] ~~마이그레이션 0005(`comments_update_own` RLS) 실 프로덕션 적용~~ — 완료(2026-07-08). 댓글 수정 실환경 동작.
0. [x] ~~테스트 계정/가족 정리~~ — 완료(2026-07-08). test-verify + bd-e2e-test-1/2/3 계정과 "테스트가족" household 삭제. 실계정 2명·가족 1개만 남음(대시보드 SQL Editor에서 직접 실행·검증).
1. [ ] 와이프 아이폰 줄노트 배경선 미표시 재확인 (앱 완전 종료 후 재실행 결과 회신 대기 중)
2. [ ] 실기기(안드로이드·아이폰) 재검증: **PWA 단일화 후 뒤로가기 동작**(하드웨어/제스처 백, 헤더 ←, 딥링크) + 다자녀 스위처·일기 대상 선택·새 앱 아이콘
3. [ ] (저장소 압박 시) 사진만 Cloudflare R2로 분리 — 설계는 `docs/r2-photo-plan.md`에 보존, 아직 미실행
