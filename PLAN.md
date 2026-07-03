# 아이 육아일기 + 주식계좌 투자일기 앱 계획

## 컨텍스트

부부 2인이 쓰는 비공개 아이 육아일기 앱. 하루 사진 3장 이하 + 그날 있었던 일 기록, 서로의 일기에 댓글·좋아요. 아이 주식계좌 투자일기(수동 기록 + 메모)도 함께 제공.

**확정된 조건** (사용자 답변):
- 진짜 모바일 앱을 원함 (기존 웹앱이 느리고 불편했음)
- 폰: 한 명 아이폰 + 한 명 안드로이드
- 애플 개발자 계정(연 $99)은 부담 → **아이폰에 네이티브 앱 설치 불가** (하드 제약)
- 투자일기: 수동 기록 + 메모 (시세 API 없음)
- 알림: 1차 버전 제외 (새 글 뱃지로 대체)

**전략**: 단일 코드베이스 → 안드로이드는 Capacitor로 감싼 **진짜 APK 앱**, 아이폰은 **홈화면 추가 PWA**. "느림" 문제는 SPA + 로컬 캐시(TanStack Query) + 옵티미스틱 업데이트 + 이미지 압축으로 해결 — 서버 왕복 없이 즉시 반응하는 UI.

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프론트 | React 19 + TypeScript + Vite | 정적 SPA → Capacitor 패키징 가능. Next.js SSR은 APK로 못 감쌈 |
| UI | Tailwind CSS + shadcn/ui | couple-finance와 동일 익숙한 패턴, 모바일 우선 |
| 상태/캐시 | TanStack Query | 오프라인 캐시·옵티미스틱 업데이트로 체감속도 확보 |
| 백엔드 | Supabase (Auth·Postgres·Storage·RLS) | couple-finance에서 검증된 패턴. 서버 코드 불필요 |
| 안드로이드 | Capacitor 7 | APK 생성. samsung-health에서 Android SDK/JDK 21 환경 이미 구축됨 |
| iPhone/웹 | Vercel 정적 호스팅 + vite-plugin-pwa | Safari 홈화면 추가 → 전체화면 앱처럼 동작 |

## 프로젝트 위치

`D:\workspace\baby-diary` **새 폴더에 생성**하고 기존 `육아일기앱` 폴더의 템플릿(AGENTS/handoff/CHANGELOG)을 옮겨 채운 뒤 한글 폴더는 삭제.
이유: 한글 경로는 Android gradle 빌드에서 깨지는 사례가 많음 (Windows 인코딩 이슈).

## DB 스키마 (Supabase)

```
profiles       id(=auth.uid) · display_name
children       id · name · birth_date            -- D+일수/개월 표시용
diary_entries  id · author_id · entry_date · content · created_at
               unique(author_id, entry_date)     -- 1인 1일 1개
diary_photos   id · entry_id · storage_path · sort_order (엔트리당 최대 3장, 앱+DB check로 강제)
comments       id · entry_id · author_id · content · created_at
likes          (entry_id, author_id) PK
trades         id · child_id · trade_date · stock_name · side(매수/매도) · quantity · unit_price · memo
invest_notes   id · author_id · note_date · content   -- 거래 없는 날의 투자 생각 메모
```

- **RLS**: 모든 테이블 `authenticated`만 접근. Supabase 대시보드에서 회원가입 비활성화 → 부부 2계정만 수동 생성 (couple-finance 방식).
- **Storage**: `photos` 버킷 (비공개, authenticated만). 업로드 전 클라이언트에서 리사이즈(최대 1600px)·WebP 압축 → 장당 ~200-300KB → 무료 1GB로 수년 사용 가능.
- **주의**: Supabase 무료 플랜은 조직당 활성 프로젝트 2개 제한인데 couple-finance가 이미 2개(개발/운영) 사용 중. → 새 조직을 만들어 프로젝트 생성 (이 앱은 개발/운영 분리 없이 1개만 사용).

## 화면 구성 (모바일 우선, 하단 탭 3개)

1. **일기 피드** (홈): 상단에 아이 이름 + "D+N일 · N개월" 헤더. 날짜 역순 카드 — 사진(최대 3장 스와이프), 글, 작성자, 좋아요·댓글 수. 마지막 확인 이후 새 글에 "새 글" 뱃지.
2. **일기 작성/수정**: 날짜(기본 오늘), 사진 3장 선택(갤러리 — Capacitor에선 네이티브 픽커, PWA에선 `<input type=file>`), 본문. 같은 날 이미 썼으면 수정 모드로.
3. **일기 상세**: 사진 크게 보기, 좋아요 토글, 댓글 목록·작성.
4. **투자 탭**: 상단 요약(종목별 보유 수량·평단·투입 원금 — trades에서 집계), 아래 거래·메모 통합 타임라인, "+" 버튼으로 거래 기록/메모 작성.
5. **설정**: 아이 정보(이름·생일), 내 표시 이름, 로그아웃.

디자인은 구현 시작 시 `ui-ux-pro-max` 스킬 + `_knowledge/INDEX.md`를 참고해 따뜻한 가족 앨범 느낌으로 결정.

## 구현 단계

1. **스캐폴드**: Vite+React+TS+Tailwind+shadcn 생성, Supabase 프로젝트 생성(새 조직), 스키마·RLS 마이그레이션 작성(`supabase/` 폴더), 부부 2계정 생성.
2. **인증**: 로그인 화면, 세션 유지, 로그인 안 됐으면 리다이렉트.
3. **육아일기**: 피드 → 작성(사진 압축·업로드 포함) → 상세. TanStack Query 캐시로 재방문 즉시 표시.
4. **댓글·좋아요**: 옵티미스틱 업데이트 (누르면 즉시 반영).
5. **투자일기**: 거래 CRUD + 보유현황 집계 + 메모.
6. **PWA**: manifest·아이콘·서비스워커(vite-plugin-pwa), 아이폰 홈화면 추가 안내 화면.
7. **Android APK**: `npx cap add android` → gradle 빌드 → APK 생성. (JDK 21 — samsung-health의 빌드 설정 참고)
8. **배포**: Vercel 정적 배포. handoff.md/AGENTS.md 갱신.

## 검증 방법

- `npm run dev` + Playwright MCP로 모바일 뷰포트에서 전체 플로우 확인: 로그인 → 일기 작성(사진 3장) → 다른 계정으로 로그인 → 댓글·좋아요 → 투자 기록.
- 사진 4장째 선택 차단, 같은 날 중복 작성 시 수정 모드 진입 확인.
- `npm run build` + `npx tsc --noEmit` 통과.
- APK를 실제 안드로이드 폰에 설치해 확인 (사용자 협조 필요), 아이폰은 Vercel URL 홈화면 추가로 확인.

## 범위 제외 (v1)

푸시 알림, 시세 자동 조회, 사진 원본 보관, 다크모드 외 테마, 아이 여러 명 UI(스키마는 지원).
