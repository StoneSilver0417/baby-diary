# baby-diary - Handoff

## 현재 상태

- **버전**: v0.8.1 (Vercel 프로덕션 배포 + GitHub 자동 배포 연동 완료)
- **빌드 상태**: `npx tsc --noEmit` 통과, `npm run build` 통과, 안드로이드 `gradlew.bat assembleDebug` 통과
- **배포 상태**: **웹 배포 완료** — https://baby-diary-tau.vercel.app (Vercel 프로젝트 `waterdrop11s-projects/baby-diary`). 안드로이드는 디버그 APK 로컬 생성까지(Play Store 미배포).
- **실행 방법/URL**: 웹은 위 URL로 바로 접속(아이폰은 Safari로 열어 공유 버튼 → "홈 화면에 추가"로 PWA 설치). 로컬 개발은 `npm run dev` → `.env.local`에 실제 Supabase URL/anon key 설정됨(`VITE_USE_MOCK=false`). 로그인 계정은 부부가 대시보드에서 만든 실제 이메일(별도 기록 필요 — 이 저장소엔 없음).

## 최근 작업

- **Vercel 프로덕션 배포 + GitHub 자동 배포 연동**: 사용자가 "아이폰은 어떻게 설치?"라고 물어본 데서 시작 — 아이폰은 PWA만 가능하고 PWA는 HTTPS로 배포된 URL이 있어야 홈화면 추가·서비스워커가 동작하므로 배포를 진행.
  - `npx vercel link --yes --project baby-diary`로 프로젝트 생성.
  - 프로덕션 환경변수 3개 등록(`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/`VITE_USE_MOCK=false`).
  - **PowerShell 파이프(`"value" | npx vercel env add ...`)가 값에 BOM(U+FEFF)과 CRLF를 섞어 넣는 버그 발견** — `vercel env pull`로 값을 직접 확인해 잡아냄. 세 변수를 전부 삭제 후 Bash의 `printf '%s' "value" | npx vercel env add ...`로 재등록해 깨끗한 값(BOM·개행 없음)으로 교체 확인.
  - `npx vercel --prod --yes`로 배포 성공 → https://baby-diary-tau.vercel.app 발급. Playwright로 실제 프로덕션 URL에 접속해 로그인 화면 정상 렌더(콘솔 에러 0건), `manifest.webmanifest` 200 응답, 서비스워커 실제 등록 확인.
  - **GitHub 자동 배포 연동**: 처음엔 `vercel link`의 GitHub 자동 연결이 실패했으나, 사용자가 Vercel 대시보드(Project Settings → Git → Connect Git Repository)에서 GitHub 앱 권한을 직접 승인 → `npx vercel git connect`로 "already connected" 확인. 로컬에만 있던 커밋 5개를 `git push`해 실제로 자동 배포가 트리거되는지 검증(23초 만에 새 Production 배포 생성·Ready 확인, `baby-diary-tau.vercel.app` alias도 정상 갱신). 이제 `master`에 push만 하면 자동 배포됨.
- **(v0.7.1) 버그 수정 — 실기기 FAB 잘림**: 사용자가 안드로이드 실기기에서 발견. 하단 탭바가 `pb-safe`로 기기별 제스처 내비 안전영역만큼 커지는데 FAB는 `bottom-24` 고정값이라 겹쳐 잘림 — `pb-nav`/`bottom-fab` 유틸로 안전영역을 계산에 포함해 수정, APK 재빌드 후 재전달.
- **(v0.7.0) Capacitor 8 Android 추가**: 디버그 APK 빌드. 상세는 CHANGELOG 참고.

## 알려진 이슈

- **부부 실제 로그인 정보(이메일/비밀번호)는 이 문서에 없음** — 보안상 기록하지 않음. 대시보드 Authentication → Users에서 UID로 계정 관리 가능.
- 안드로이드 실기기 재검증 필요: FAB 잘림 수정 반영 APK를 아직 실기기에서 재확인하지 못함.
- Release 서명 키스토어는 아직 없음(debug 빌드까지만).
- `src/types/database.ts`는 여전히 수동 작성 타입(gen-types 미적용).
- claude.ai/design 연동, Cloudflare R2 사진 분리는 보류 상태(설계만 `docs/r2-photo-plan.md`에 보존).

## 다음 TODO

1. [ ] 아이폰 Safari에서 https://baby-diary-tau.vercel.app 접속 → 홈 화면에 추가 → PWA 설치·로그인·사용 전체 플로우 실기기 검증
2. [ ] 안드로이드 실기기에 새 APK(`android/app/build/outputs/apk/debug/app-debug.apk`) 재설치 → FAB 잘림 해결 확인 + 전체 플로우 검증
3. [ ] (지인 확장 시) 가입 → 가족 생성/초대코드로 배우자 합류 온보딩 화면. 스키마·RLS는 이미 멀티테넌트라 앱 온보딩 UI만 추가하면 됨. 무료 플랜은 2~3가족까지 여유, 5가족 이상 활발하면 스토리지 1GB·전송 5GB 압박 → Pro($25/월) 또는 이미지 압축 강화.
4. [ ] (저장소 압박 시) 사진만 Cloudflare R2로 분리 — 설계는 `docs/r2-photo-plan.md`에 보존, 아직 미실행.
5. [ ] (정식 배포 시) Android release 서명 키스토어 생성 + release 빌드 서명 설정.
