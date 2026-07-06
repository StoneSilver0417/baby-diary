-- baby-diary 0004: 공개 회원가입 + 배우자 초대 + 다자녀 + 문의/관리자
-- 적용 방법: 0001~0003 적용 후 Supabase 대시보드 SQL Editor에서 전체 실행.
-- 실행 전 대시보드 설정: Authentication > Sign In / Providers > Email에서
--   "Allow new users to sign up" ON, "Confirm email" OFF.
-- 실행 후 확인: select * from admins;  (관리자 계정 1행 있어야 함)

-- ============================================================
-- 1. 온보딩 RPC — 가족 생성
-- RLS insert 정책 대신 RPC로만 여는 이유: profiles/households insert 정책을
-- 직접 열면 household_id 값의 정당성(위조 여부)을 RLS 조건으로 표현할 수 없어
-- 남의 household UUID만 알아도 합류가 가능해진다. RPC 내부에서 생성/검증하면
-- 위조 불가 + 3-테이블 insert가 단일 트랜잭션으로 원자적으로 처리된다.
-- ============================================================

create function create_household_with_child(
  p_household_name text,
  p_display_name text,
  p_child_name text,
  p_child_birth date
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception '이미 가족에 속해 있습니다.';
  end if;

  insert into households (name) values (p_household_name) returning id into v_household_id;
  insert into profiles (id, household_id, display_name) values (auth.uid(), v_household_id, p_display_name);
  insert into children (household_id, name, birth_date) values (v_household_id, p_child_name, p_child_birth);

  return v_household_id;
end;
$$;

revoke execute on function create_household_with_child(text, text, text, date) from public, anon;
grant execute on function create_household_with_child(text, text, text, date) to authenticated;

-- ============================================================
-- 2. 배우자 초대 — invites 테이블 + create_invite/join_household RPC
-- insert/update 정책을 의도적으로 두지 않음(RPC 전용 — 클라이언트가 직접
-- 초대코드를 발급하거나 임의로 used_at을 조작할 수 없도록).
-- ============================================================

create table invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_by uuid references profiles(id) on delete set null,
  used_at timestamptz
);

alter table invites enable row level security;

create policy "invites_select" on invites for select using (household_id = my_household_id());

create function create_invite() returns invites
language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid := my_household_id();
  v_invite invites;
begin
  if v_household_id is null then
    raise exception '가족에 속한 사용자만 초대할 수 있습니다.';
  end if;
  if (select count(*) from invites
      where household_id = v_household_id and used_at is null and expires_at > now()) >= 5 then
    raise exception '유효한 초대코드는 최대 5개까지 만들 수 있습니다.';
  end if;

  insert into invites (household_id, code, created_by, expires_at)
  values (
    v_household_id,
    (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (random() * 31)::int + 1, 1), '')
       from generate_series(1, 8)),
    auth.uid(),
    now() + interval '72 hours'
  )
  returning * into v_invite;

  return v_invite;
end;
$$;

revoke execute on function create_invite() from public, anon;
grant execute on function create_invite() to authenticated;

create function join_household(p_code text, p_display_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_invite invites;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception '이미 가족에 속해 있습니다.';
  end if;

  select * into v_invite from invites
    where code = upper(trim(p_code)) and used_at is null and expires_at > now()
    for update;
  if not found then
    raise exception '유효하지 않거나 만료된 초대코드입니다.';
  end if;
  if (select count(*) from profiles where household_id = v_invite.household_id) >= 4 then
    raise exception '한 가족은 최대 4명까지 함께할 수 있습니다.';
  end if;

  insert into profiles (id, household_id, display_name)
    values (auth.uid(), v_invite.household_id, p_display_name);
  update invites set used_by = auth.uid(), used_at = now() where id = v_invite.id;

  return v_invite.household_id;
end;
$$;

revoke execute on function join_household(text, text) from public, anon;
grant execute on function join_household(text, text) to authenticated;

-- ============================================================
-- 3. 다자녀 — diary_entries에 대상 아이 컬럼 추가 (null = 모두/가족 공용)
-- ============================================================

alter table diary_entries add column child_id uuid references children(id) on delete set null;

drop policy "diary_entries_insert_own" on diary_entries;
create policy "diary_entries_insert_own" on diary_entries for insert with check (
  household_id = my_household_id()
  and author_id = auth.uid()
  and (child_id is null or exists (
    select 1 from children c where c.id = child_id and c.household_id = my_household_id()
  ))
);

drop policy "diary_entries_update_own" on diary_entries;
create policy "diary_entries_update_own" on diary_entries for update
  using (author_id = auth.uid())
  with check (
    author_id = auth.uid()
    and (child_id is null or exists (
      select 1 from children c where c.id = child_id and c.household_id = my_household_id()
    ))
  );

-- ============================================================
-- 4. 관리자 — admins 테이블(정책 없음: 클라이언트 직접 접근 전면 차단) + is_admin()
-- profiles.role 방식은 본인 행 update가 허용된 RLS 특성상 셀프 승격 위험이 있어 배제.
-- ============================================================

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table admins enable row level security;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;

insert into admins (user_id)
select id from auth.users where email = 'waterdrop1137@gmail.com'
on conflict do nothing;

-- 관리자가 문의 작성자·가족을 볼 수 있도록 select 정책 확장
drop policy "profiles_select" on profiles;
create policy "profiles_select" on profiles for select
  using (household_id = my_household_id() or is_admin());

drop policy "households_select" on households;
create policy "households_select" on households for select
  using (id = my_household_id() or is_admin());

-- ============================================================
-- 5. 문의 — inquiries 테이블
-- ============================================================

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  reply text check (reply is null or char_length(reply) <= 2000),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

alter table inquiries enable row level security;

create policy "inquiries_select" on inquiries for select
  using (author_id = auth.uid() or is_admin());
create policy "inquiries_insert_own" on inquiries for insert
  with check (author_id = auth.uid() and reply is null and replied_at is null);
create policy "inquiries_update_admin" on inquiries for update
  using (is_admin()) with check (is_admin());

create function enforce_max_open_inquiries() returns trigger as $$
begin
  if (select count(*) from inquiries where author_id = new.author_id and replied_at is null) >= 5 then
    raise exception '답변 대기 중인 문의는 최대 5개까지 등록할 수 있습니다.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_max_open_inquiries
  before insert on inquiries
  for each row execute function enforce_max_open_inquiries();

-- ============================================================
-- 6. 관리자 현황 요약 RPC
-- ============================================================

create function admin_stats() returns json
language sql stable security definer set search_path = public as $$
  select case when is_admin() then json_build_object(
    'households', (select count(*) from households),
    'profiles', (select count(*) from profiles),
    'children', (select count(*) from children),
    'entries', (select count(*) from diary_entries),
    'open_inquiries', (select count(*) from inquiries where replied_at is null)
  ) end
$$;

revoke execute on function admin_stats() from public, anon;
grant execute on function admin_stats() to authenticated;
