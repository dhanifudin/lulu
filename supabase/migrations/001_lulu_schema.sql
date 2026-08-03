-- ============================================================
-- Migration 001: Create lulu schema and all tables
-- Runs on the shared Supabase instance; isolated from public.*
-- ============================================================

-- 1. Schema
create schema if not exists lulu;

-- Grants for PostgREST / JS client
grant usage on schema lulu to anon, authenticated;
alter default privileges in schema lulu grant all on tables to anon, authenticated;
alter default privileges in schema lulu grant all on sequences to anon, authenticated;
alter default privileges in schema lulu grant all on functions to anon, authenticated;

-- ============================================================
-- 2. subjects (reference — subject catalog)
-- ============================================================
create table lulu.subjects (
  key        text primary key,
  name_id    text not null,  -- Indonesian
  name_en    text not null,  -- English
  emoji      text not null default '📚',
  color      text not null default '#FFC2D1',
  category   text not null check (category in (
               'academic','break','prayer','ceremony','habituation','extracurricular'
             ))
);

-- ============================================================
-- 3. schedule_slots (I-B ICP timetable)
-- ============================================================
create table lulu.schedule_slots (
  id           bigint generated always as identity primary key,
  day_of_week  smallint not null check (day_of_week between 1 and 5), -- 1=Mon, 5=Fri
  start_time   time not null,
  end_time     time not null,
  subject_key  text not null references lulu.subjects(key),
  label        text    -- optional override label (e.g. "Upacara/Literasi")
);
create index on lulu.schedule_slots (day_of_week, start_time);

-- ============================================================
-- 4. uniforms
-- ============================================================
create table lulu.uniforms (
  day_of_week  smallint primary key check (day_of_week between 1 and 5),
  name_id      text not null,
  name_en      text not null,
  emoji        text not null,
  color        text not null default '#FFC2D1'
);

-- ============================================================
-- 5. habits
-- ============================================================
create table lulu.habits (
  id          uuid primary key default gen_random_uuid(),
  name_id     text not null,
  name_en     text not null,
  emoji       text not null default '⭐',
  sort_order  smallint not null default 0,
  active      boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null
);

-- ============================================================
-- 6. habit_logs
-- ============================================================
create table lulu.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references lulu.habits(id) on delete cascade,
  date        date not null,
  completed   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  unique (habit_id, date)
);
create index on lulu.habit_logs (habit_id, date desc);

-- ============================================================
-- 7. calendar_events
-- ============================================================
create table lulu.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  start_date   date not null,
  end_date     date not null,
  title        text not null,
  type         text not null check (type in ('holiday','exam','report','event','activity')),
  description  text
);
create index on lulu.calendar_events (start_date, end_date);

-- ============================================================
-- 8. push_subscriptions
-- ============================================================
create table lulu.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 9. notification_prefs
-- ============================================================
create table lulu.notification_prefs (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users(id) on delete cascade,
  night_before_enabled   boolean not null default true,
  night_before_time      time not null default '19:00',
  morning_enabled        boolean not null default true,
  morning_time           time not null default '05:30'
);
