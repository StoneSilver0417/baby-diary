-- baby-diary 0005: 댓글 수정 허용 (본인 댓글만)
-- 적용 방법: 0001~0004 적용 후 Supabase 대시보드 SQL Editor에서 실행.
-- 배경: 0001에는 comments의 select/insert/delete 정책만 있고 update 정책이 없어
--   본인 댓글이라도 수정이 RLS에 막혔다. 본인 댓글만 수정 가능하도록 정책을 추가한다.
--   using(수정 대상 행 조건) + with check(수정 후 행 조건) 둘 다 author_id = auth.uid()로
--   묶어, 남의 댓글 수정도, 수정하면서 작성자를 바꾸는 것도 막는다.

create policy "comments_update_own" on comments
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid());
