# baby-diary — 프로젝트 규칙

> 베이스 규칙: `D:\workspace\AGENTS.md`를 먼저 읽고 따른다. (자동 로드되지 않은 경우 직접 읽을 것)
> 이 파일은 프로젝트의 **변하지 않는 사실**만 기록한다. 현재 진행 상태는 `handoff.md`, 상세 구현 계획·DB 스키마·화면 구성은 `PLAN.md`에 있다.

## 개요
- 한 줄 설명: 부부 2인 전용 비공개 아이 육아일기(하루 사진 3장 + 글, 댓글·좋아요) + 아이 주식계좌 투자일기(수동 기록) 앱.
- 배포 URL: https://baby-diary-tau.vercel.app (Vercel, `waterdrop11s-projects/baby-diary`)

## 기술 스택
- 프레임워크: React 19 + TypeScript + Vite (정적 SPA — Next.js SSR은 Capacitor로 못 감싸므로 금지)
- UI: Tailwind CSS + shadcn/ui, 상태/캐시: TanStack Query (옵티미스틱 업데이트 필수)
- DB/백엔드: Supabase (Auth·Postgres·Storage·RLS) — 서버 코드 없음. 마이그레이션은 `supabase/` 폴더에 SQL로 관리
- 배포: 안드로이드 = Capacitor 8 디버그 APK를 GitHub Release(`android-latest` 태그, 파일만 계속 교체)로 배포 — https://github.com/StoneSilver0417/baby-diary/releases/tag/android-latest (appId `com.wooseokshim.babydiary`, `capacitor.config.ts`) / 아이폰 = PWA(홈화면 추가, `vite-plugin-pwa`) / 웹 = Vercel

## 주요 명령어
```bash
npm run dev      # 개발 서버
npm run build    # 빌드 (PWA manifest·서비스워커 포함)
npx tsc --noEmit # 타입 체크
npm run icons    # src/assets/app-icon.png → public/icons/*·assets/(icon·splash) 재생성 (sharp)
npx cap sync android   # 웹 빌드를 안드로이드 프로젝트로 동기화
cd android && ./gradlew.bat assembleDebug   # 디버그 APK 빌드 (JDK 21 — android/gradle.properties에 org.gradle.java.home 고정됨)
gh release upload android-latest android/app/build/outputs/apk/debug/app-debug.apk --clobber   # 배포용 APK 갱신
```

## 환경
| 환경 | 값 | 용도 |
| ---- | -- | ---- |
| Supabase | 새 조직 `baby-diary`, 프로젝트 1개, Seoul 리전 (URL: `isouteawnehcyfufrhrw.supabase.co`) | couple-finance 조직은 무료 플랜 2개 한도 소진 — 별도 조직으로 새 무료 슬롯 확보. **실제 연결 완료(v0.4.0)**, `.env.local`에 URL/anon key 설정됨(gitignore 대상) |
| 계정 | v0.10.0부터 공개 회원가입(이메일 인증 없음) + 온보딩(가족 생성/초대코드 합류) | 실제 이메일/비밀번호는 보안상 이 저장소에 기록하지 않음 — 대시보드 Authentication에서 UID로 관리 |
| 관리자 | `waterdrop1137@gmail.com`(본인 계정) — `admins` 테이블(RLS 정책 없음) + `is_admin()` RPC로 판별 | `/admin`에서 문의 답변·전체 현황 확인. 새 관리자 추가 시 `insert into admins (user_id) select id from auth.users where email = '...'` |
| Android JDK | `C:\java\jdk-21.0.11+10` (시스템 JAVA_HOME은 깨진 JDK11이므로 절대 사용 금지) | `android/gradle.properties`의 `org.gradle.java.home`에 고정(v0.7.0) — 시스템 환경변수에 의존하지 않음 |
| Android SDK | `C:\Users\PC\AppData\Local\Android\sdk` | `android/local.properties`의 `sdk.dir`(gitignore 대상, 로컬 환경마다 재생성 필요) |
| Gradle | 8.14.3 (`android/gradle/wrapper/gradle-wrapper.properties`) | Capacitor 8 기본 템플릿 버전 그대로 사용, `gradlew assembleDebug` 빌드 성공 확인(v0.7.0) |

## Mock 모드 (Supabase 연결 전 UI 검증용, 필요 시 `VITE_USE_MOCK=true`로 전환 가능)
- `.env.local`의 `VITE_USE_MOCK=true`면 `src/lib/mockDb.ts`의 인메모리 데이터로 동작. `src/lib/supabase.ts`/`useMock` 플래그를 각 feature의 `api.ts`가 분기 처리. 현재는 실제 연결(`false`)이 기본값.
- mock 로그인 계정: `appa@family.test`/`omma@family.test`, 비밀번호 둘 다 `test1234` (`src/lib/mockDb.ts`의 `MOCK_USERS`).
- mock 데이터는 브라우저 전체 새로고침(모듈 재평가) 시 초기화됨 — 의도된 동작이며 버그 아님.
- **실제 Supabase 검증 시에도 동일한 함정 있음**: `page.goto`(전체 리로드)는 mock 상태뿐 아니라 실제 세션에서도 그 시점까지의 브라우저 상태를 리셋하므로, 방금 만든 데이터를 확인하려면 앱 내 링크 클릭(client-side navigation)으로 이동할 것.

## 프로젝트 고유 규칙
- **하드 제약**: 애플 개발자 계정 없음 → iOS 네이티브 빌드 불가. 아이폰은 반드시 PWA로 지원해야 한다.
- 모든 화면은 모바일 우선. "느림" 문제 해결이 핵심 목표 — 로컬 캐시 + 옵티미스틱 업데이트로 서버 왕복 없이 즉시 반응하는 UI를 유지한다.
- 사진: 엔트리당 최대 3장(앱 + DB check 이중 강제), 업로드 전 클라이언트 리사이즈(최대 1600px)·WebP 압축.
- 일기: 1인 1일 1개(`unique(author_id, entry_date)`), 같은 날 재작성 시 수정 모드로 진입. 아이가 2명 이상이면 대상 선택(모두/특정 아이, `child_id` nullable=모두) 노출, 1명이면 선택 UI 자체를 숨겨 기존 UX 유지.
- 다자녀: 성장·투자 기록은 `child_id` 필수(아이별 완전 분리), 일기·투자메모는 가족 공용. 선택된 아이 상태는 `SelectedChildProvider`(Context+localStorage)로 성장/투자 탭 간 유지.
- 투자일기: 수동 기록 + 메모만. 시세 API 연동 금지(v1 범위 제외).
- v1 범위 제외: 푸시 알림(새 글 뱃지로 대체), 시세 자동 조회, 사진 원본 보관.
- 프로젝트 경로에 한글 폴더 사용 금지 (Android gradle 빌드가 Windows 인코딩 이슈로 깨짐 — 이 폴더가 `baby-diary`인 이유).

## 알려진 툴링 함정
- **shadcn CLI(`npx shadcn add ...`)가 `vite.config.ts`의 `@` alias를 못 읽고 프로젝트 루트에 리터럴 `@/components/ui/...` 폴더를 생성**할 수 있음 → 생성 후 `src/components/ui/`로 수동 이동하고 잘못 만들어진 `@` 폴더는 삭제.
- 이 프로젝트의 TypeScript(~6.0.2)는 `tsconfig`의 `baseUrl`을 deprecated로 처리해 `tsc -b` 빌드가 실패함 → `baseUrl` 없이 `paths`만 사용.
- 코드 내 JSDoc 주석에서 파일 경로를 `features/*/api.ts`처럼 와일드카드로 표기하면 `*/`가 블록 주석을 조기 종료시켜 문법 에러가 남 — 주석 안에서는 `*` 와일드카드 표기를 피하고 말로 풀어쓸 것.
