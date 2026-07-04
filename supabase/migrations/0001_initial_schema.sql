-- baby-diary 초기 스키마 + RLS (household 멀티테넌트)
-- 적용 방법: Supabase 대시보드 SQL Editor에 전체를 붙여넣고 실행.
-- 실행 전: Authentication > Providers에서 이메일 회원가입은 상황에 맞게 설정.
--   부부만 쓸 때는 비활성화 후 계정 수동 생성, 지인 확장 시 온보딩 플로우에서 가입 허용.
-- 핵심: 모든 데이터는 household(가족) 단위로 격리된다. 한 사용자는 하나의 household에 속하며
--   자기 household의 데이터만 조회·기록할 수 있다 (다른 가족 데이터는 존재조차 보이지 않음).

-- ============================================================
-- 1. 테이블
-- ============================================================

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  display_name text not null,
  last_seen_diary_at timestamptz
);

create table children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  birth_date date not null
);

create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  entry_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (author_id, entry_date)
);

-- diary_photos/comments/likes는 diary_entries에 종속 → household는 부모 엔트리로 판정
create table diary_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references diary_entries(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references diary_entries(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table likes (
  entry_id uuid not null references diary_entries(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  primary key (entry_id, author_id)
);

create table trades (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  trade_date date not null,
  stock_name text not null,
  side text not null check (side in ('매수', '매도')),
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  memo text
);

create table invest_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  note_date date not null,
  content text not null
);

-- 사진 3장 제한: CHECK로는 count 서브쿼리를 표현할 수 없어 트리거로 강제
create function enforce_max_diary_photos() returns trigger as $$
begin
  if (select count(*) from diary_photos where entry_id = new.entry_id) >= 3 then
    raise exception '엔트리당 사진은 최대 3장까지 등록할 수 있습니다.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_max_diary_photos
  before insert on diary_photos
  for each row execute function enforce_max_diary_photos();

-- ============================================================
-- 2. household 판정 헬퍼 — 현재 유저가 속한 household id
-- ============================================================

create function my_household_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select household_id from profiles where id = auth.uid()
$$;

-- ============================================================
-- 3. RLS — 내 household 데이터만 접근
-- ============================================================

alter table households enable row level security;
alter table profiles enable row level security;
alter table children enable row level security;
alter table diary_entries enable row level security;
alter table diary_photos enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table trades enable row level security;
alter table invest_notes enable row level security;

-- households: 내 가족만 조회·수정
create policy "households_select" on households for select using (id = my_household_id());
create policy "households_update" on households for update using (id = my_household_id());

-- profiles: 같은 household 구성원끼리 조회, 본인만 수정
create policy "profiles_select" on profiles for select using (household_id = my_household_id());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- children: 내 household 아이 조회·기록·수정 (가족 공용)
create policy "children_select" on children for select using (household_id = my_household_id());
create policy "children_insert" on children for insert with check (household_id = my_household_id());
create policy "children_update" on children for update using (household_id = my_household_id());

-- diary_entries: 내 household 글 조회, 본인 글만 쓰기/수정/삭제
create policy "diary_entries_select" on diary_entries for select using (household_id = my_household_id());
create policy "diary_entries_insert_own" on diary_entries for insert
  with check (household_id = my_household_id() and author_id = auth.uid());
create policy "diary_entries_update_own" on diary_entries for update using (author_id = auth.uid());
create policy "diary_entries_delete_own" on diary_entries for delete using (author_id = auth.uid());

-- diary_photos: 부모 엔트리가 내 household면 조회, 본인 글이면 쓰기/삭제
create policy "diary_photos_select" on diary_photos for select using (
  exists (select 1 from diary_entries e where e.id = entry_id and e.household_id = my_household_id())
);
create policy "diary_photos_insert_own" on diary_photos for insert with check (
  exists (select 1 from diary_entries e where e.id = entry_id and e.author_id = auth.uid())
);
create policy "diary_photos_delete_own" on diary_photos for delete using (
  exists (select 1 from diary_entries e where e.id = entry_id and e.author_id = auth.uid())
);

-- comments: 부모 엔트리가 내 household면 조회, 본인 댓글만 쓰기/삭제
create policy "comments_select" on comments for select using (
  exists (select 1 from diary_entries e where e.id = entry_id and e.household_id = my_household_id())
);
create policy "comments_insert_own" on comments for insert with check (
  author_id = auth.uid()
  and exists (select 1 from diary_entries e where e.id = entry_id and e.household_id = my_household_id())
);
create policy "comments_delete_own" on comments for delete using (author_id = auth.uid());

-- likes: 부모 엔트리가 내 household면 조회, 본인 좋아요만 추가/삭제
create policy "likes_select" on likes for select using (
  exists (select 1 from diary_entries e where e.id = entry_id and e.household_id = my_household_id())
);
create policy "likes_insert_own" on likes for insert with check (
  author_id = auth.uid()
  and exists (select 1 from diary_entries e where e.id = entry_id and e.household_id = my_household_id())
);
create policy "likes_delete_own" on likes for delete using (author_id = auth.uid());

-- trades: 내 household 거래 (가족 공용)
create policy "trades_all" on trades for all using (household_id = my_household_id())
  with check (household_id = my_household_id());

-- invest_notes: 내 household 조회, 본인 메모만 쓰기/삭제
create policy "invest_notes_select" on invest_notes for select using (household_id = my_household_id());
create policy "invest_notes_insert_own" on invest_notes for insert
  with check (household_id = my_household_id() and author_id = auth.uid());
create policy "invest_notes_delete_own" on invest_notes for delete using (author_id = auth.uid());

-- ============================================================
-- 4. Storage — photos 버킷 (비공개, household 폴더로 격리)
-- 경로 규칙: {household_id}/{entry_id}/{uuid}.webp
-- ============================================================

insert into storage.buckets (id, name, public) values ('photos', 'photos', false);

create policy "photos_select" on storage.objects for select using (
  bucket_id = 'photos' and (storage.foldername(name))[1] = my_household_id()::text
);
create policy "photos_insert" on storage.objects for insert with check (
  bucket_id = 'photos' and (storage.foldername(name))[1] = my_household_id()::text
);
create policy "photos_update" on storage.objects for update using (
  bucket_id = 'photos' and (storage.foldername(name))[1] = my_household_id()::text
);
create policy "photos_delete" on storage.objects for delete using (
  bucket_id = 'photos' and (storage.foldername(name))[1] = my_household_id()::text
);

-- ============================================================
-- 5. 초기 데이터 (가족·계정 생성 후 UUID를 채워 넣고 실행)
-- ============================================================

-- insert into households (id, name) values ('<household-uuid>', '우리집');
--
-- insert into profiles (id, household_id, display_name) values
--   ('<user-a-uuid>', '<household-uuid>', '아빠'),
--   ('<user-b-uuid>', '<household-uuid>', '엄마');
--
-- insert into children (household_id, name, birth_date) values
--   ('<household-uuid>', '아이 이름', '2025-01-01');
