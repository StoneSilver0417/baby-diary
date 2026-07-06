# baby-diary - Handoff

## 현재 상태

- **버전**: v0.10.1 (공개 회원가입·배우자 초대·다자녀·문의/관리자 + 앱 아이콘 교체)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과. 안드로이드 디버그 APK 재빌드 및 GitHub Release(`android-latest`) 업로드 완료(새 아이콘 반영).
- **배포 상태**: 웹은 GitHub push 시 Vercel 자동 배포(https://baby-diary-tau.vercel.app), 안드로이드는 GitHub Release APK. **단, v0.10.0 기능은 DB 마이그레이션(0004) 미실행 + 대시보드 설정 미변경 상태라 실제로는 아직 동작하지 않음** — 아래 "다음 TODO" #0, #1 먼저 처리 필요.
- **실행 방법/URL**: 웹 https://baby-diary-tau.vercel.app / 안드로이드 https://github.com/StoneSilver0417/baby-diary/releases/tag/android-latest / 로컬 `npm run dev`(`.env.local`의 `VITE_USE_MOCK=false`, 실 Supabase 연결).

## 최근 작업

- **앱 아이콘 교체 (v0.10.1)**: 사용자가 제공한 새 아이콘(육아일기장+아기 얼굴+곰인형 일러스트)으로 교체. `src/assets/app-icon.png`을 새 마스터로, `scripts/generate-icons.mjs`를 PNG 리사이즈 방식으로 전환(기존 SVG 삭제). 웹 아이콘·파비콘·PWA 마스커블 아이콘·Capacitor 안드로이드 mipmap/스플래시 전체 재생성 후 APK 재빌드·GitHub Release 갱신 완료.
- **공개 회원가입·배우자 초대·다자녀·관리자 문의 (v0.10.0)**: 사용자 요청 "회원가입 후 배우자초대 및 자녀둘이상일때 분기, 관리자에게 문의, 관리자페이지 별도 구성"을 전부 구현. 상세는 CHANGELOG 참고. 핵심 요약:
  - **마이그레이션 `supabase/migrations/0004_signup_multichild_admin.sql`(신규, ⚠️ 미적용)**: 가족 생성/초대합류 RPC(`create_household_with_child`/`create_invite`/`join_household`), `diary_entries.child_id`, `admins`/`is_admin()`, `inquiries`, `admin_stats()`.
  - 가입(`AuthProvider.signUp`, `LoginPage` 로그인/가입 토글) + 온보딩(`src/features/onboarding/`, `OnboardingGate`).
  - 다자녀(`SelectedChildProvider`, `ChildSwitcher`, 성장·투자 쿼리 childId 필터, 설정 탭 아이별 수정+추가).
  - 일기 대상 선택(아이 2명 이상일 때만 "모두/아이별" 세그먼트, 피드·상세 뱃지).
  - 문의(설정 탭 등록+내역) + 관리자 페이지(`/admin`, `src/features/admin/`, `admin_stats` 대시보드 + 문의 답변).
  - Playwright(mock, 아이 2명 시드)로 다자녀·일기대상·설정 UI 스모크 통과(콘솔 에러 0). 가입·온보딩·초대·문의·관리자는 mock 미지원(Auth/RPC/RLS 상호작용이라 mock으로 검증 불가 — 각 함수가 명시적 에러를 던짐).

## 알려진 이슈

- **⚠️ `supabase/migrations/0004_signup_multichild_admin.sql` 미적용** — 실행 전까지 가입 자체는 되지만 온보딩 RPC·초대·문의·관리자 기능이 전부 404/에러로 실패한다.
- **⚠️ Supabase 대시보드 설정 미변경** — Authentication → Sign In / Providers → Email에서 "Allow new users to sign up" ON, "Confirm email" OFF 필요. 지금은 회원가입 자체가 막혀 있을 수 있음.
- 위 두 가지 모두 실 Supabase에서 종단 검증(가입→온보딩→초대→다자녀→일기대상→문의/관리자) 안 됨 — mock 스모크만 완료.
- 부부 실제 로그인 정보(이메일/비밀번호)는 이 문서에 기록하지 않음.
- 안드로이드 실기기 재검증 필요: 이전 라운드(뒤로가기 고정 규칙, 시트 안전영역, 사진 스와이프)에 더해 이번 다자녀 스위처·일기 대상 선택도 실기기 미확인.
- Release 서명 키스토어는 아직 없음(debug 빌드까지만).
- `src/types/database.ts`는 여전히 수동 작성 타입(gen-types 미적용).
- 투자일기 거래·배당·메모는 삭제만 가능, 수정(edit) UI는 없음(의도된 범위).
- claude.ai/design 연동, Cloudflare R2 사진 분리는 보류 상태(설계만 `docs/r2-photo-plan.md`에 보존).

## 다음 TODO

0. [ ] **Supabase 대시보드에서 이메일 회원가입 ON + Confirm email OFF 설정**
1. [ ] **`supabase/migrations/0004_signup_multichild_admin.sql`을 SQL Editor에서 실행** 후 `select * from admins;`로 관리자 계정(`waterdrop1137@gmail.com`) 1행 확인
2. [ ] 실 Supabase에서 종단 검증: 새 이메일 가입 → 온보딩(가족 생성) → 설정에서 초대코드 생성 → 다른 계정으로 합류 → 아이 추가해 다자녀 전환·일기 대상 선택 확인 → 문의 등록 → 관리자 계정으로 `/admin` 접속해 답변 → 원 계정에서 답변 확인
3. [ ] 안드로이드 실기기에 최신 APK 설치 후 다자녀 스위처·일기 대상 선택·기존 UX(뒤로가기·시트 여백·사진 스와이프) 전체 재검증
4. [ ] (저장소 압박 시) 사진만 Cloudflare R2로 분리 — 설계는 `docs/r2-photo-plan.md`에 보존, 아직 미실행
5. [ ] (정식 배포 시) Android release 서명 키스토어 생성 + release 빌드 서명 설정
