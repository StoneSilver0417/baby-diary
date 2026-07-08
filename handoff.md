# baby-diary - Handoff

## 현재 상태

- **버전**: v0.10.7 (줄노트 1px 누적 오차 수정)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과. 안드로이드 디버그 APK 재빌드 및 GitHub Release(`android-latest`) 업로드 완료.
- **배포 상태**: 웹·안드로이드 모두 실 프로덕션에서 회원가입→온보딩→초대→다자녀→일기대상→문의→관리자 답변까지 E2E 검증 완료. 마이그레이션 0004·대시보드 이메일 가입 설정 모두 적용 완료. GitHub 저장소는 Public 전환 완료(APK 로그인 없이 다운로드 가능).
- **실행 방법/URL**: 웹 https://baby-diary-tau.vercel.app / 안드로이드 https://github.com/StoneSilver0417/baby-diary/releases/tag/android-latest (PWA 설치도 가능, `README.md` 참고) / 로컬 `npm run dev`(`.env.local`의 `VITE_USE_MOCK=false`, 실 Supabase 연결).

## 최근 작업

- **줄노트 1px 누적 오차 수정 (v0.10.7)**: v0.10.5 후에도 양 플랫폼에서 어긋남 재재제보 — "글이 길어지면 안 맞음"이 결정적 단서. 원인은 `paper-lines` 그라디언트의 반복 주기가 `1.6rem + 1px`로 텍스트 줄 높이(`1.6rem`)보다 1px 길어 한 줄마다 1px씩 누적되는 것. 1px 선을 주기 안쪽에 그려 주기를 정확히 1.6rem으로 맞춤. 구/신 비교 스크린샷으로 20줄 정렬 검증 완료(순수 CSS 산수 오류라 데스크톱 검증 유효). APK 재빌드·Release 갱신 완료.
- **앱 아이콘을 다크 네이비 배경 일러스트로 교체 (v0.10.6)**: 소스가 투명 배경 + 둥근 카드 형태라 카드 톤(`#3c3a42`)으로 flatten, 웹·안드로이드·Capacitor 소스 전부 재생성. 상세는 CHANGELOG 참고.
- 이전 이력(줄노트 text-size-adjust 수정, 공개 회원가입·배우자 초대·다자녀·관리자 문의, README·저장소 Public 전환 등 v0.10.0~v0.10.5)은 CHANGELOG.md 참고.

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
1. [ ] 실기기(안드로이드·아이폰) 재검증: **긴 글 줄노트 정렬(v0.10.7 누적 오차 수정)** + 다자녀 스위처·일기 대상 선택·새 앱 아이콘·기존 UX(뒤로가기·시트 여백·사진 스와이프). PWA는 서비스워커 캐시 때문에 앱 완전 종료 후 재실행 필요할 수 있음
2. [ ] (결정 필요) 안드로이드 Capacitor/APK를 걷어내고 PWA로 단일화할지 — 장점(배포 부담 제거)·단점(뒤로가기 재구현) 논의됨, 진행 여부만 확정하면 됨
3. [ ] (저장소 압박 시) 사진만 Cloudflare R2로 분리 — 설계는 `docs/r2-photo-plan.md`에 보존, 아직 미실행
4. [ ] (정식 배포 시) Android release 서명 키스토어 생성 + release 빌드 서명 설정
