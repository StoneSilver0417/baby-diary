# baby-diary - Handoff

## 현재 상태

- **버전**: v0.10.5 (줄노트 정렬 기기별 어긋남 수정)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과. 안드로이드 디버그 APK 재빌드 및 GitHub Release(`android-latest`) 업로드 완료.
- **배포 상태**: 웹·안드로이드 모두 실 프로덕션에서 회원가입→온보딩→초대→다자녀→일기대상→문의→관리자 답변까지 E2E 검증 완료. 마이그레이션 0004·대시보드 이메일 가입 설정 모두 적용 완료. GitHub 저장소는 Public 전환 완료(APK 로그인 없이 다운로드 가능).
- **실행 방법/URL**: 웹 https://baby-diary-tau.vercel.app / 안드로이드 https://github.com/StoneSilver0417/baby-diary/releases/tag/android-latest (PWA 설치도 가능, `README.md` 참고) / 로컬 `npm run dev`(`.env.local`의 `VITE_USE_MOCK=false`, 실 Supabase 연결).

## 최근 작업

- **줄노트 정렬이 기기마다 다르게 어긋나는 문제 수정 (v0.10.5)**: 사용자가 실기기 스크린샷과 함께 재제보 — "휴대폰마다 좀 다름"이 핵심 단서. 원인은 안드로이드 Chrome/WebView의 자동 폰트 확대(`text-size-adjust`, 기기 화면 크기·밀도별 휴리스틱이라 기기마다 다름)가 `paper-lines` 배경의 고정 줄 간격과 어긋나는 것 — v0.9.2의 고정 오프셋 수정과는 다른 원인. `html`에 `text-size-adjust: 100%` 추가해 자동 확대를 꺼서 수정. **데스크톱 Playwright로는 재현 안 되는 모바일 전용 동작이라 실기기 확인 필요.**
- **초보자용 설치 안내 README 추가 + 저장소 Public 전환 (v0.10.4)**: 지인 배포를 위해 루트에 `README.md` 신규 작성(아이폰 PWA / 안드로이드 PWA(추천)·APK(대안) 설치법 + 회원가입·가족합류 안내). 안드로이드 APK를 GitHub 로그인 없이 받을 수 있도록 저장소를 Public으로 전환(전환 전 전체 커밋 이력에 `.env`류·키·시크릿 없음 재확인 완료).
- **지난 날짜 일기 수정 버튼 추가 (v0.10.3)**: 사용자 제보 "일기쓴거 수정안됨" — 상세 화면에 삭제만 있고 수정 버튼이 없어 당일 글 외엔 편집 진입로가 없던 기존(v0.1.0부터) 공백. `EntryDetailPage`에 본인 글 전용 "수정"(연필) 버튼 추가, `/write?date=<entry_date>`로 연결(기존 날짜 기반 upsert 로직 그대로 재사용, 백엔드 변경 없음).
- **관리자 계정 "가족 구성원" 정보 노출 버그 수정 (v0.10.2)**: 사용자가 실 프로덕션에서 관리자 계정 로그인 후 설정 화면에 발견 — "내 가족 구성원에 테스트계정 뜸". 원인은 관리자 대시보드용으로 열어둔 `profiles` select RLS(`or is_admin()`)를 household 필터 없는 범용 쿼리(`getProfiles`)가 그대로 화면에 뿌린 것. `SettingsPage`의 `InviteSection`에서 `household_id` 기준으로 클라이언트 필터링 추가해 수정.
- **공개 회원가입·배우자 초대·다자녀·관리자 문의 + 앱 아이콘 교체 (v0.10.0~v0.10.1)**: 사용자 요청 "회원가입 후 배우자초대 및 자녀둘이상일때 분기, 관리자에게 문의, 관리자페이지 별도 구성"을 전부 구현하고 새 앱 아이콘으로 교체. 상세는 CHANGELOG 참고. 핵심 요약:
  - **마이그레이션 `supabase/migrations/0004_signup_multichild_admin.sql`(적용 완료)**: 가족 생성/초대합류 RPC(`create_household_with_child`/`create_invite`/`join_household`), `diary_entries.child_id`, `admins`/`is_admin()`, `inquiries`, `admin_stats()`.
  - 가입(`AuthProvider.signUp`, `LoginPage` 로그인/가입 토글) + 온보딩(`src/features/onboarding/`, `OnboardingGate`).
  - 다자녀(`SelectedChildProvider`, `ChildSwitcher`, 성장·투자 쿼리 childId 필터, 설정 탭 아이별 수정+추가).
  - 일기 대상 선택(아이 2명 이상일 때만 "모두/아이별" 세그먼트, 피드·상세 뱃지).
  - 문의(설정 탭 등록+내역) + 관리자 페이지(`/admin`, `src/features/admin/`, `admin_stats` 대시보드 + 문의 답변).
  - Playwright(mock, 아이 2명 시드) + **실 프로덕션 E2E(테스트 계정 3개)**로 검증 완료: 가입→온보딩(가족 생성)→초대코드 생성→합류→다자녀(둘째 추가, 성장 기록 완전 분리)→일기 대상 선택(뱃지 확인)→문의 등록→관리자 아닌 계정의 `/admin` 차단→초대코드 재사용 거부까지 전부 실제로 동작 확인.

## 알려진 이슈

- **테스트 데이터 미정리**: 실 프로덕션 E2E 검증에 쓴 테스트 계정 3개(`bd-e2e-test-1/2/3-20260706@example.com`)와 "테스트가족" household가 아직 DB에 남아있음. 정리 SQL:
  ```sql
  delete from households where name = '테스트가족';
  delete from auth.users where email like 'bd-e2e-test-%@example.com';
  ```
- **미결정 사항**: 안드로이드를 Capacitor/APK 없이 PWA 단일화할지 논의만 하고 결정은 안 됨 — 우선 README에 PWA 설치 옵션만 추가해둔 상태. 전환 시 `useAndroidBackButton`의 `@capacitor/app` 의존을 `popstate` 기반으로 재구현 필요(같은 고정 규칙 로직 재사용 가능).
- 부부 실제 로그인 정보(이메일/비밀번호)는 이 문서에 기록하지 않음.
- 안드로이드 실기기 재검증 필요: 이전 라운드(뒤로가기 고정 규칙, 시트 안전영역, 사진 스와이프)에 더해 이번 다자녀 스위처·일기 대상 선택도 실기기 미확인.
- **PWA 서비스워커 캐싱 주의**: 배포 후에도 이미 방문했던 브라우저/설치된 PWA는 이전 버전을 계속 서빙할 수 있음(이번 세션에서 직접 겪음) — 실기기에서 업데이트가 안 보이면 앱 완전 종료 후 재실행 필요.
- Release 서명 키스토어는 아직 없음(debug 빌드까지만).
- `src/types/database.ts`는 여전히 수동 작성 타입(gen-types 미적용).
- 투자일기 거래·배당·메모는 삭제만 가능, 수정(edit) UI는 없음(의도된 범위).
- claude.ai/design 연동, Cloudflare R2 사진 분리는 보류 상태(설계만 `docs/r2-photo-plan.md`에 보존).

## 다음 TODO

0. [ ] 위 "테스트 데이터 미정리" SQL 실행
1. [ ] 안드로이드 실기기에 최신 APK 설치 후 다자녀 스위처·일기 대상 선택·줄노트 정렬(text-size-adjust 수정)·기존 UX(뒤로가기·시트 여백·사진 스와이프) 전체 재검증
2. [ ] (결정 필요) 안드로이드 Capacitor/APK를 걷어내고 PWA로 단일화할지 — 장점(배포 부담 제거)·단점(뒤로가기 재구현) 논의됨, 진행 여부만 확정하면 됨
3. [ ] (저장소 압박 시) 사진만 Cloudflare R2로 분리 — 설계는 `docs/r2-photo-plan.md`에 보존, 아직 미실행
4. [ ] (정식 배포 시) Android release 서명 키스토어 생성 + release 빌드 서명 설정
