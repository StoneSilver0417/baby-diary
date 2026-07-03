-- baby-diary 초기 스키마 + RLS
-- 적용 방법: Supabase 대시보드 SQL Editor에 전체를 붙여넣고 실행.
-- 실행 전: Authentication > Providers에서 이메일 회원가입(Allow new users to sign up)을 비활성화하고
-- 부부 2계정을 대시보드에서 수동 생성해 둘 것.

-- ============================================================
-- 1. 테이블
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  last_seen_diary_at timestamptz
);

create table children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null
);

create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  entry_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (author_id, entry_date)
);

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
-- 2. RLS — 부부 2인 전용 (household 개념 없이 authenticated 전체 공유)
-- ============================================================

alter table profiles enable row level security;
alter table children enable row level security;
alter table diary_entries enable row level security;
alter table diary_photos enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table trades enable row level security;
alter table invest_notes enable row level security;

-- profiles: 누구나 조회, 본인만 수정
create policy "profiles_select" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- children: 누구나 조회·수정 (부부 공용 정보)
create policy "children_select" on children for select using (auth.role() = 'authenticated');
create policy "children_update" on children for update using (auth.role() = 'authenticated');

-- diary_entries: 누구나 조회, 본인 글만 쓰기/수정/삭제
create policy "diary_entries_select" on diary_entries for select using (auth.role() = 'authenticated');
create policy "diary_entries_insert_own" on diary_entries for insert with check (author_id = auth.uid());
create policy "diary_entries_update_own" on diary_entries for update using (author_id = auth.uid());
create policy "diary_entries_delete_own" on diary_entries for delete using (author_id = auth.uid());

-- diary_photos: 누구나 조회, 본인 글에 딸린 사진만 쓰기/삭제
create policy "diary_photos_select" on diary_photos for select using (auth.role() = 'authenticated');
create policy "diary_photos_insert_own" on diary_photos for insert with check (
  exists (select 1 from diary_entries e where e.id = entry_id and e.author_id = auth.uid())
);
create policy "diary_photos_delete_own" on diary_photos for delete using (
  exists (select 1 from diary_entries e where e.id = entry_id and e.author_id = auth.uid())
);

-- comments: 누구나 조회, 본인 댓글만 쓰기/삭제
create policy "comments_select" on comments for select using (auth.role() = 'authenticated');
create policy "comments_insert_own" on comments for insert with check (author_id = auth.uid());
create policy "comments_delete_own" on comments for delete using (author_id = auth.uid());

-- likes: 누구나 조회, 본인 좋아요만 추가/삭제
create policy "likes_select" on likes for select using (auth.role() = 'authenticated');
create policy "likes_insert_own" on likes for insert with check (author_id = auth.uid());
create policy "likes_delete_own" on likes for delete using (author_id = auth.uid());

-- trades: 부부 공용 (누가 기록해도 서로 조회·수정 가능)
create policy "trades_all" on trades for all using (auth.role() = 'authenticated');

-- invest_notes: 누구나 조회, 본인 메모만 쓰기/삭제
create policy "invest_notes_select" on invest_notes for select using (auth.role() = 'authenticated');
create policy "invest_notes_insert_own" on invest_notes for insert with check (author_id = auth.uid());
create policy "invest_notes_delete_own" on invest_notes for delete using (author_id = auth.uid());

-- ============================================================
-- 3. Storage — photos 버킷 (비공개)
-- ============================================================

insert into storage.buckets (id, name, public) values ('photos', 'photos', false);

create policy "photos_select" on storage.objects for select using (
  bucket_id = 'photos' and auth.role() = 'authenticated'
);
create policy "photos_insert" on storage.objects for insert with check (
  bucket_id = 'photos' and auth.role() = 'authenticated'
);
create policy "photos_update" on storage.objects for update using (
  bucket_id = 'photos' and auth.role() = 'authenticated'
);
-- 삭제는 본인이 업로드한 경로(첫 폴더 = uid)만 허용
create policy "photos_delete_own" on storage.objects for delete using (
  bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- 4. 초기 데이터 (부부 2계정 생성 후 UUID를 채워 넣고 실행)
-- ============================================================

-- insert into profiles (id, display_name) values
--   ('<user-a-uuid>', '아빠'),
--   ('<user-b-uuid>', '엄마');
--
-- insert into children (name, birth_date) values
--   ('아이 이름', '2025-01-01');
