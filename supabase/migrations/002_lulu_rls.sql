-- ============================================================
-- Migration 002: Row Level Security — allowlist two emails
-- All access gated on auth.jwt() ->> 'email' IN (...)
-- schema-local: does NOT affect other projects on this instance
-- ============================================================

-- Helper: check allowlist
create or replace function lulu.is_allowed()
returns boolean
language sql
security definer
stable
as $$
  select auth.jwt() ->> 'email' in ('ulfillah49@gmail.com', 'dhanifudin@gmail.com')
$$;

-- Enable RLS on all tables
alter table lulu.subjects           enable row level security;
alter table lulu.schedule_slots     enable row level security;
alter table lulu.uniforms           enable row level security;
alter table lulu.habits             enable row level security;
alter table lulu.habit_logs         enable row level security;
alter table lulu.calendar_events    enable row level security;
alter table lulu.push_subscriptions enable row level security;
alter table lulu.notification_prefs enable row level security;

-- ---- subjects (read-only for allowed users) ----
create policy "allowed read subjects"
  on lulu.subjects for select
  using (lulu.is_allowed());

-- ---- schedule_slots (read-only) ----
create policy "allowed read schedule"
  on lulu.schedule_slots for select
  using (lulu.is_allowed());

-- ---- uniforms (read-only) ----
create policy "allowed read uniforms"
  on lulu.uniforms for select
  using (lulu.is_allowed());

-- ---- habits (full CRUD for allowed users) ----
create policy "allowed read habits"
  on lulu.habits for select
  using (lulu.is_allowed());

create policy "allowed insert habits"
  on lulu.habits for insert
  with check (lulu.is_allowed());

create policy "allowed update habits"
  on lulu.habits for update
  using (lulu.is_allowed());

create policy "allowed delete habits"
  on lulu.habits for delete
  using (lulu.is_allowed());

-- ---- habit_logs (full CRUD) ----
create policy "allowed read habit_logs"
  on lulu.habit_logs for select
  using (lulu.is_allowed());

create policy "allowed insert habit_logs"
  on lulu.habit_logs for insert
  with check (lulu.is_allowed());

create policy "allowed delete habit_logs"
  on lulu.habit_logs for delete
  using (lulu.is_allowed());

-- ---- calendar_events (read-only) ----
create policy "allowed read calendar"
  on lulu.calendar_events for select
  using (lulu.is_allowed());

-- ---- push_subscriptions (own row only) ----
create policy "allowed manage push_subscriptions"
  on lulu.push_subscriptions for all
  using (lulu.is_allowed() and user_id = auth.uid())
  with check (lulu.is_allowed() and user_id = auth.uid());

-- ---- notification_prefs (own row only) ----
create policy "allowed manage notification_prefs"
  on lulu.notification_prefs for all
  using (lulu.is_allowed() and user_id = auth.uid())
  with check (lulu.is_allowed() and user_id = auth.uid());
