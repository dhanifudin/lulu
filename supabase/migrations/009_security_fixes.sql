-- ============================================================
-- Migration 009: Security & performance advisor fixes
--
-- 1. lulu.prayer_times was created (004) without ever enabling RLS.
--    Combined with 001's `alter default privileges ... grant all on
--    tables to anon, authenticated`, the table was fully readable AND
--    writable by anyone holding the public anon key. Lock it to a
--    read-only policy like every other reference table.
--
-- 2. lulu.is_allowed() had a mutable search_path (function-search-path
--    hijack risk) and was directly callable over PostgREST at
--    /rest/v1/rpc/is_allowed by anon/authenticated. Pin search_path and
--    revoke direct RPC access — it's only meant to be called from inside
--    RLS policies (SECURITY DEFINER functions run with definer's search
--    path resolution regardless of caller grants on the policy check).
--
-- 3. RLS policies on push_subscriptions, notification_prefs, and
--    redemptions called auth.uid() per-row instead of (select auth.uid()),
--    which defeats the initplan optimization and gets slower per row at
--    scale (auth_rls_initplan advisory).
--
-- 4. Foreign keys without a covering index (unindexed_foreign_keys
--    advisory) on habits.created_by, habit_logs.created_by,
--    redemptions.reward_id, schedule_slots.subject_key.
-- ============================================================

-- 1. prayer_times RLS
alter table lulu.prayer_times enable row level security;

create policy "allowed read prayer_times"
  on lulu.prayer_times for select
  using (lulu.is_allowed());

-- 2. is_allowed(): pin search_path, restrict direct RPC access
create or replace function lulu.is_allowed()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select auth.jwt() ->> 'email' in ('ulfillah49@gmail.com', 'dhanifudin@gmail.com')
$$;

revoke execute on function lulu.is_allowed() from anon, authenticated, public;

-- 3. RLS initplan fixes — wrap auth.uid() in a subselect
drop policy "allowed manage push_subscriptions" on lulu.push_subscriptions;
create policy "allowed manage push_subscriptions"
  on lulu.push_subscriptions for all
  using (lulu.is_allowed() and user_id = (select auth.uid()))
  with check (lulu.is_allowed() and user_id = (select auth.uid()));

drop policy "allowed manage notification_prefs" on lulu.notification_prefs;
create policy "allowed manage notification_prefs"
  on lulu.notification_prefs for all
  using (lulu.is_allowed() and user_id = (select auth.uid()))
  with check (lulu.is_allowed() and user_id = (select auth.uid()));

drop policy "allowed manage redemptions" on lulu.redemptions;
create policy "allowed manage redemptions"
  on lulu.redemptions for all
  using (lulu.is_allowed() and user_id = (select auth.uid()))
  with check (lulu.is_allowed() and user_id = (select auth.uid()));

-- 4. Covering indexes for foreign keys
create index if not exists habits_created_by_idx        on lulu.habits (created_by);
create index if not exists habit_logs_created_by_idx    on lulu.habit_logs (created_by);
create index if not exists redemptions_reward_id_idx    on lulu.redemptions (reward_id);
create index if not exists schedule_slots_subject_key_idx on lulu.schedule_slots (subject_key);
