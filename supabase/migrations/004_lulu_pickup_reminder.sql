-- ============================================================
-- Migration 004: Pickup reminder + habit time windows + prayer times
-- ============================================================

-- 1. Pickup columns on notification_prefs
alter table lulu.notification_prefs
  add column if not exists pickup_enabled boolean not null default true,
  add column if not exists pickup_minutes_before integer not null default 30;

-- 2. Time window + prayer link columns on habits
alter table lulu.habits
  add column if not exists start_time time,
  add column if not exists end_time   time,
  add column if not exists prayer_key text
    check (prayer_key in ('fajr','dhuhr','asr','maghrib','isha'));

-- 3. Daily prayer times cache (fetched from Aladhan API, keyed by date)
create table if not exists lulu.prayer_times (
  id         uuid primary key default gen_random_uuid(),
  date       date not null unique,
  fajr       time not null,
  dhuhr      time not null,
  asr        time not null,
  maghrib    time not null,
  isha       time not null,
  created_at timestamptz not null default now()
);
grant select on lulu.prayer_times to anon, authenticated;

-- 4. Assign start/end times + prayer_key to existing seed habits
-- (seed habits were inserted by migration 003 without these columns)

update lulu.habits set start_time = '06:00', end_time = '06:10', sort_order = 10
  where name_id = 'Sikat Gigi';

update lulu.habits set prayer_key = 'fajr', sort_order = 20
  where name_id = 'Sholat Subuh';

update lulu.habits set start_time = '05:00', end_time = '05:30', sort_order = 30
  where name_id = 'Baca Al-Qur''an';

update lulu.habits set start_time = '06:15', end_time = '06:45', sort_order = 40
  where name_id = 'Sarapan';

update lulu.habits set start_time = '06:45', end_time = '07:00', sort_order = 50
  where name_id = 'Beres-beres Tas';

update lulu.habits set start_time = '19:30', end_time = '20:00', sort_order = 100
  where name_id = 'Baca Buku';

update lulu.habits set start_time = '20:30', end_time = '21:00', sort_order = 110
  where name_id = 'Tidur Tepat Waktu';

update lulu.habits set sort_order = 120
  where name_id = 'Rapikan Mainan';

-- 5. Insert the four missing daily prayers + one extra chore
--    (guard with NOT EXISTS so re-running is safe)
insert into lulu.habits (name_id, name_en, emoji, sort_order, prayer_key, active)
select name_id, name_en, emoji, sort_order, prayer_key, true
from (values
  ('Sholat Dzuhur',  'Dhuhr Prayer',   '🕌', 60,  'dhuhr'),
  ('Sholat Ashar',   'Asr Prayer',     '🕌', 70,  'asr'),
  ('Sholat Maghrib', 'Maghrib Prayer', '🕌', 80,  'maghrib'),
  ('Sholat Isya',    'Isha Prayer',    '🕌', 90,  'isha')
) as v(name_id, name_en, emoji, sort_order, prayer_key)
where not exists (
  select 1 from lulu.habits where lulu.habits.name_id = v.name_id
);

insert into lulu.habits (name_id, name_en, emoji, sort_order, active)
select 'Rapikan Kamar', 'Tidy Room', '🛏️', 130, true
where not exists (select 1 from lulu.habits where name_id = 'Rapikan Kamar');
