-- baby-diary 0002: 성장 기록·마일스톤·배당·현재가 (household 격리)
-- 적용 방법: 0001 적용 후 Supabase 대시보드 SQL Editor에서 실행.

-- ============================================================
-- 1. 테이블
-- ============================================================

create table growth_records (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  record_date date not null,
  height_cm numeric check (height_cm > 0),
  weight_kg numeric check (weight_kg > 0),
  memo text,
  unique (child_id, record_date),
  check (height_cm is not null or weight_kg is not null)
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  milestone_date date not null,
  title text not null,
  memo text,
  created_at timestamptz not null default now()
);

-- 배당은 수량×단가가 아닌 "금액" 의미론이므로 trades와 분리 (computeHoldings 오염 방지)
create table dividends (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  dividend_date date not null,
  stock_name text not null,
  amount numeric not null check (amount > 0),
  memo text
);

-- 현재가 수동 입력 저장 (시세 API 없음). household별로 격리 → 종목명이 겹쳐도 가족마다 독립
create table stock_prices (
  household_id uuid not null references households(id) on delete cascade,
  stock_name text not null,
  current_price numeric not null check (current_price >= 0),
  updated_at timestamptz not null default now(),
  primary key (household_id, stock_name)
);

-- ============================================================
-- 2. RLS — 내 household 데이터만 (my_household_id는 0001에서 정의됨)
-- ============================================================

alter table growth_records enable row level security;
alter table milestones enable row level security;
alter table dividends enable row level security;
alter table stock_prices enable row level security;

create policy "growth_records_all" on growth_records for all
  using (household_id = my_household_id()) with check (household_id = my_household_id());
create policy "milestones_all" on milestones for all
  using (household_id = my_household_id()) with check (household_id = my_household_id());
create policy "dividends_all" on dividends for all
  using (household_id = my_household_id()) with check (household_id = my_household_id());
create policy "stock_prices_all" on stock_prices for all
  using (household_id = my_household_id()) with check (household_id = my_household_id());
