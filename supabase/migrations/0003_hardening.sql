-- baby-diary 0003: 보안·남용 방어 하드닝
-- 적용 방법: 0002 적용 후 Supabase 대시보드 SQL Editor에서 실행.
-- 배경: 무료 플랜은 과금이 아니라 "한도 초과 시 서비스 정지"가 리스크 —
--   로그인 계정이 API를 직접 호출해 대용량 데이터로 한도를 잠식하는 경로와
--   멀티테넌트 격리 우회 경로를 서버(DB) 레벨에서 차단한다.

-- ============================================================
-- 1. Storage — photos 버킷 파일 크기·MIME 제한
-- 클라이언트 압축(1600px WebP, 수백 KB)은 우회 가능하므로 서버에서 강제.
-- ============================================================

update storage.buckets
set file_size_limit = 3145728, -- 3MB
    allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png']
where id = 'photos';

-- ============================================================
-- 2. 텍스트 길이 제한 — DB 잠식 방지 (무료 500MB)
-- 기존 데이터는 전부 짧은 글이라 위반 없음 (위반 시 아래 alter가 실패하므로 그 자체가 검증)
-- ============================================================

alter table diary_entries add constraint diary_entries_content_len check (char_length(content) <= 10000);
alter table comments add constraint comments_content_len check (char_length(content) <= 1000);
alter table invest_notes add constraint invest_notes_content_len check (char_length(content) <= 5000);
alter table trades add constraint trades_memo_len check (memo is null or char_length(memo) <= 500);
alter table trades add constraint trades_stock_name_len check (char_length(stock_name) <= 100);
alter table dividends add constraint dividends_memo_len check (memo is null or char_length(memo) <= 500);
alter table dividends add constraint dividends_stock_name_len check (char_length(stock_name) <= 100);
alter table growth_records add constraint growth_records_memo_len check (memo is null or char_length(memo) <= 500);
alter table milestones add constraint milestones_title_len check (char_length(title) <= 200);
alter table milestones add constraint milestones_memo_len check (memo is null or char_length(memo) <= 500);
alter table profiles add constraint profiles_display_name_len check (char_length(display_name) <= 50);
alter table children add constraint children_name_len check (char_length(name) <= 50);
alter table households add constraint households_name_len check (char_length(name) <= 100);
alter table stock_prices add constraint stock_prices_stock_name_len check (char_length(stock_name) <= 100);

-- ============================================================
-- 3. profiles.household_id 변경 금지 — 멀티테넌트 격리 우회 차단
-- RLS profiles_update_own은 "본인 행"만 검사하고 household_id 값 변경은 막지 않음.
-- 다른 가족의 UUID를 알게 되면 자기 household_id를 바꿔 그 가족에 합류할 수 있으므로
-- 트리거로 원천 차단 (가족 이동이 필요하면 관리자가 SQL로 직접 처리).
-- ============================================================

create function prevent_household_change() returns trigger as $$
begin
  if old.household_id is distinct from new.household_id then
    raise exception 'household_id는 변경할 수 없습니다.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_prevent_household_change
  before update on profiles
  for each row execute function prevent_household_change();

-- ============================================================
-- 4. children 행 수 제한 — household당 최대 5명 (무한 insert 잠식 방지)
-- ============================================================

create function enforce_max_children() returns trigger as $$
begin
  if (select count(*) from children where household_id = new.household_id) >= 5 then
    raise exception 'household당 아이는 최대 5명까지 등록할 수 있습니다.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_max_children
  before insert on children
  for each row execute function enforce_max_children();
