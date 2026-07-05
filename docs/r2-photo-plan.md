# (보류) 사진 저장소 Cloudflare R2 분리 계획

> 2026-07-05 설계, **아직 실행 안 함**. Supabase 무료 플랜의 Storage(저장 1GB, 전송 5GB/월)가
> 실제로 압박될 때(대략 3~5가족 이상이 활발히 사진 업로드) 이 문서대로 진행한다.
> Auth·DB·RLS는 Supabase 유지 — 전체 스택 이전(Neon+Clerk 등)은 검토 후 기각했음(서버 계층 신규 작성 필요, 이득은 R2 하나뿐).

## 왜 R2인가

- R2 무료: 저장 10GB + 전송(egress) 무료 + 쓰기 100만/월·읽기 1,000만/월 — 사진 앱의 유일한 병목(전송량)이 해소됨
- Supabase 무료 Storage: 저장 1GB + 전송 5GB/월
- Workers 무료 10만 요청/일이면 서명 발급용으로 충분

## 아키텍처

```
브라우저 ── Authorization: Bearer <supabase JWT> ──▶ Worker (photo-api)
   │                                                  │ 1. JWT 검증 (JWKS 또는 legacy HS256 secret)
   │                                                  │ 2. household_id 조회: GET {SUPABASE_URL}/rest/v1/profiles
   │                                                  │    ?id=eq.{sub}&select=household_id (사용자 JWT 그대로 전달,
   │                                                  │    RLS가 본인 행만 허용 — service_role 키 불필요)
   │                                                  │    isolate 메모리 Map에 TTL 캐시
   │                                                  │ 3. 요청 경로 첫 폴더 == household_id 확인
   │                                                  │ 4. aws4fetch로 presigned PUT/GET URL 발급
   ◀── presigned URL ────────────────────────────────┘
   └── PUT/GET 바이트 직접 ──▶ R2 버킷 (S3 endpoint)
```

- 사진 바이트는 Worker를 거치지 않는다 — presign만 발급, 업/다운로드는 브라우저 ↔ R2 직통
- 삭제는 Worker가 R2 바인딩(`env.PHOTOS.delete`)으로 직접 수행 (경로 검증 후)
- presigned GET 만료 7일 = 현 Supabase signed URL TTL과 동일 → React Query 캐시(6일 stale) 호환

## 단계

### 1. 사용자 작업: Cloudflare 준비
- 무료 계정 → R2 활성화(카드 등록 필요, 무료 한도 내 과금 없음) → 버킷 `baby-diary-photos`(APAC 힌트)
- R2 API 토큰(Object Read & Write, 버킷 한정) → Access Key ID/Secret
- 버킷 CORS: 앱 origin(로컬 dev + Vercel 도메인)에 PUT/GET 허용
- Supabase 대시보드 → Settings → API에서 JWT 서명 방식 확인(JWKS URL 또는 legacy secret)

### 2. Worker — `workers/photo-api/` (같은 저장소)
- wrangler.toml: R2 바인딩 `PHOTOS`, secrets `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`(+HS256이면 `SUPABASE_JWT_SECRET`), vars `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`ALLOWED_ORIGINS`
- 의존성: `jose`(JWT 검증), `aws4fetch`(presign)
- 엔드포인트(모두 CORS + Bearer JWT 필수):
  - `POST /presign-upload` `{ path }` → household 검증 → presigned PUT (만료 10분)
  - `POST /presign-download` `{ paths[] }` → 검증 → presigned GET 목록 (만료 7일)
  - `POST /delete` `{ paths[] }` → 검증 → R2 바인딩 삭제
- household 캐시: `Map<sub, {householdId, expires}>` TTL 10분
- 배포: `npx wrangler login` → `npx wrangler deploy`

### 3. 클라이언트 어댑터 — `src/lib/photoStorage.ts` (신규)
- `uploadPhoto(path, blob)` / `getPhotoUrls(paths)` / `removePhotos(paths)`
- 분기: `VITE_PHOTO_BACKEND` = `supabase`(기본) | `r2`(`VITE_PHOTO_API_URL`의 Worker) — mock은 기존 `useMock` 우선
- r2 분기는 `supabase.auth.getSession()`의 access_token을 Authorization 헤더로 전달
- `src/features/diary/api.ts`의 4개 호출부(saveEntry 업로드·제거, deleteEntry, getSignedPhotoUrl)만 어댑터로 교체 — 시그니처·React Query 구조 변경 없음

### 4. 기존 사진 일회성 이관 — `scripts/migrate-photos-to-r2.mjs`
- Supabase Storage `photos` 전체 목록 → 다운로드 → R2 같은 경로 업로드(aws4fetch)
- service_role 키는 실행 시 환경변수로만 주입(코드·저장소 기록 금지), 로컬 1회 실행
- 이관 후 개수·용량 대조. Supabase 원본은 롤백 대비 보존(플래그만 되돌리면 즉시 원복)

### 5. env·문서
- `.env.local`: `VITE_PHOTO_BACKEND=r2`, `VITE_PHOTO_API_URL=https://<worker>.workers.dev`
- `.env.example`·AGENTS.md 환경 표·handoff.md·CHANGELOG.md 갱신

## 검증 기준

1. tsc·build 통과
2. 사진 업로드 PUT이 `r2.cloudflarestorage.com`으로 가고 R2 대시보드에 객체 생성
3. 피드·상세·앨범·수정화면 사진 렌더 (presigned GET)
4. 사진 교체·일기 삭제 시 R2 객체 삭제
5. 타 household 경로 presign 요청 시 403
6. `VITE_PHOTO_BACKEND=supabase` 롤백 시 기존 동작 그대로

## 주의사항

- Worker에 service_role 키 절대 금지 — household 판정은 사용자 본인 JWT + RLS로 충분
- presigned PUT은 용량 제한 불가 → 사이즈는 클라이언트 압축(1600px WebP)이 담당(v1 수용)
- Supabase 마이그레이션 SQL(storage 버킷·정책)은 손대지 않음 — 롤백 경로 유지
- R2는 비활동 일시정지 없음(Supabase 무료 프로젝트와 다름)
