-- ============================================================
-- Migration 005: Rewards shop + redemptions
-- ============================================================

-- ── 1. rewards catalog (admin-seeded) ──────────────────────
create table lulu.rewards (
  id          uuid primary key default gen_random_uuid(),
  name_id     text not null,
  name_en     text not null,
  emoji       text not null default '🎁',
  star_cost   integer not null check (star_cost > 0),
  active      boolean not null default true,
  sort_order  smallint not null default 0
);

-- ── 2. redemptions (user-owned) ────────────────────────────
create table lulu.redemptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default (auth.uid()) references auth.users(id) on delete cascade,
  reward_id   uuid not null references lulu.rewards(id),
  stars_spent integer not null,
  redeemed_at timestamptz not null default now()
);
create index on lulu.redemptions (user_id, redeemed_at desc);

-- ── 3. RLS ──────────────────────────────────────────────────
alter table lulu.rewards     enable row level security;
alter table lulu.redemptions enable row level security;

create policy "allowed read rewards"
  on lulu.rewards for select
  using (lulu.is_allowed());

create policy "allowed manage redemptions"
  on lulu.redemptions for all
  using  (lulu.is_allowed() and user_id = auth.uid())
  with check (lulu.is_allowed() and user_id = auth.uid());

-- ── 4. Seed rewards ────────────────────────────────────────
insert into lulu.rewards (name_id, name_en, emoji, star_cost, sort_order) values
  ('Nonton YouTube 15 menit',  'YouTube (15 min)',      '🎮',  5, 1),
  ('Es krim',                  'Ice cream treat',       '🍦', 10, 2),
  ('Pilih film malam ini',     'Pick tonight''s movie', '🎬', 15, 3),
  ('Buku baru',                'New book',              '📚', 20, 4),
  ('Jalan-jalan akhir pekan',  'Weekend outing',        '🎡', 30, 5),
  ('Mainan baru',              'New toy',               '🧸', 50, 6);
