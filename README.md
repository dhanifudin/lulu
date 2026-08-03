# Lulu 🌸 — Jadwal & Kebiasaan

Personal schedule & habit tracker for **Kelas I-B ICP · SD Laboratorium UM Kota Malang · Tahun Ajaran 2026/2027**.

Built with Vue 3 + Supabase (`lulu` schema) + GitHub Pages + PWA push notifications.

---

## Features

| Feature | Detail |
|---------|--------|
| 📅 Jadwal harian | Timetable Mon–Fri with live-highlighted current period (WIB) |
| 🎽 Pengingat seragam | Merah Putih · Jas Biru · Batik · Olahraga · Baju Adat |
| ⭐ Habit tracker | Stars, 🔥 streaks, weekly grid, confetti when all done |
| 🗓️ Kalender akademik | All 2026/2027 holidays, exam weeks, events |
| 🔔 Push notifications | 🌙 19:00 WIB (siapkan buku) · ☀️ 05:30 WIB (jadwal hari ini) |
| 📱 PWA | Installable, works offline, Add to Home Screen |
| 🔐 Google login | Restricted to `ulfillah49@gmail.com` & `dhanifudin@gmail.com` |

---

## Prerequisites

Before you start, make sure you have:

- **Node.js 20+** and **npm 10+** — verify with `node -v && npm -v`
- A **Supabase account** with an existing project (shared instance is fine)
- A **Google Cloud project** with OAuth 2.0 credentials
- A **GitHub repository** named `lulu` (for GitHub Pages deployment)

---

## Step-by-Step Setup

### Step 1 — Install dependencies

```bash
npm install
```

---

### Step 2 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in these three values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa...
```

> Find `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Supabase project:
> **Settings → API → Project URL / anon public key**

---

### Step 3 — Supabase: expose the `lulu` schema

This app uses a dedicated `lulu` schema so it doesn't conflict with other projects on the same Supabase instance.

1. In your Supabase dashboard, go to **Settings → API**
2. Under **Exposed schemas**, add `lulu` (keep `public` as-is)
3. Click **Save**

---

### Step 4 — Run SQL migrations

Run the three migration files **in order** using the Supabase **SQL Editor** (paste and run each one):

| File | What it does |
|------|-------------|
| `supabase/migrations/001_lulu_schema.sql` | Creates `lulu` schema + all 8 tables |
| `supabase/migrations/002_lulu_rls.sql` | Enables RLS with email allowlist |
| `supabase/migrations/003_lulu_seed.sql` | Seeds schedule, uniforms, calendar events, starter habits |

**Alternatively**, link the CLI and push:

```bash
# Link to your project (get project-ref from Settings → General)
npx supabase link --project-ref your-project-ref

# Push all migrations at once
npx supabase db push
```

> **Verify** the migration worked by running in the SQL Editor:
> ```sql
> select count(*) from lulu.schedule_slots;  -- should return 54
> select count(*) from lulu.calendar_events; -- should return 38
> ```

---

### Step 5 — Enable pg_cron and pg_net extensions

The push notification cron jobs require two Postgres extensions. Enable them in the SQL Editor:

```sql
-- Required for scheduled jobs
create extension if not exists pg_cron;

-- Required for HTTP calls from cron
create extension if not exists pg_net;
```

> If `pg_cron` is not available in your plan, you can use an external cron service (e.g., cron-job.org) to call the Edge Function URL instead.

---

### Step 6 — Set up Google OAuth

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create or select an **OAuth 2.0 Client ID** (Web application)
3. Under **Authorized redirect URIs**, add:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:5173
   https://lulu.ulfillah.com
   ```
4. Copy the **Client ID** and **Client Secret**
5. In Supabase → **Authentication → Providers → Google**:
   - Toggle **Enable Google provider** on
   - Paste Client ID and Client Secret
   - Click **Save**
6. In Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://lulu.ulfillah.com`
   - **Redirect URLs**: add `http://localhost:5173` and `https://lulu.ulfillah.com`

---

### Step 7 — Generate VAPID keys for push notifications

```bash
npx web-push generate-vapid-keys
```

Output looks like:
```
Public Key:  BEl62iUYgUivxIkv69yViEuiBIa-ygemoZkTEOEKOB-iMgC...
Private Key: 4sBWlV7Wfh3L6...
```

- Add the **Public Key** to `.env` as `VITE_VAPID_PUBLIC_KEY`
- Keep both keys for the next step

---

### Step 8 — Deploy the Edge Function

Set the Edge Function secrets (use your actual keys):

```bash
npx supabase secrets set \
  VAPID_PUBLIC_KEY="BEl62iUYgUivxIkv69yViEuiBIa..." \
  VAPID_PRIVATE_KEY="4sBWlV7Wfh3L6..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

> Find `SUPABASE_SERVICE_ROLE_KEY` in **Settings → API → service_role secret key**

Deploy the function:

```bash
npx supabase functions deploy send-reminders
```

---

### Step 9 — Set up cron schedules for reminders

Run this SQL in the Supabase **SQL Editor** (replace the two placeholder values):

```sql
-- Night before: 19:00 WIB = 12:00 UTC, Mon–Fri
select cron.schedule(
  'lulu-night-reminder',
  '0 12 * * 1-5',
  format($$
    select net.http_post(
      url := 'https://%s.supabase.co/functions/v1/send-reminders?type=night',
      headers := jsonb_build_object('Authorization', 'Bearer %s')
    )
  $$, 'your-project-ref', 'your-anon-key')
);

-- Early morning: 05:30 WIB = 22:30 UTC previous night, Sun–Thu
select cron.schedule(
  'lulu-morning-reminder',
  '30 22 * * 0-4',
  format($$
    select net.http_post(
      url := 'https://%s.supabase.co/functions/v1/send-reminders?type=morning',
      headers := jsonb_build_object('Authorization', 'Bearer %s')
    )
  $$, 'your-project-ref', 'your-anon-key')
);
```

> **Why `0-4` for morning?** 05:30 WIB Monday = 22:30 UTC Sunday. The cron runs Sunday through Thursday so it fires at the right WIB morning for each school day.

Verify cron jobs were created:
```sql
select jobname, schedule, command from cron.job where jobname like 'lulu%';
```

---

### Step 10 — Run locally

```bash
npm run dev
```

Open `http://localhost:5173` (root path — no `/lulu/` subpath with the custom domain config) → sign in with one of the allowed Google accounts → the app loads with the real schedule seeded from the PDFs.

---

### Step 11 — Deploy to GitHub Pages with custom domain

1. Push this repo to GitHub:

   ```bash
   git remote add origin https://github.com/your-username/lulu.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. In GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**, add:

   | Secret name | Value |
   |-------------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `VITE_VAPID_PUBLIC_KEY` | Your VAPID public key |

3. In GitHub repo → **Settings → Pages**:
   - Source: **GitHub Actions**
   - Custom domain: `lulu.ulfillah.com`
   - Tick **Enforce HTTPS** (wait a minute for the TLS certificate to provision)

4. At your **`ulfillah.com` DNS provider**, add a CNAME record:

   | Type | Host | Value |
   |------|------|-------|
   | `CNAME` | `lulu` | `your-github-username.github.io` |

   > DNS changes can take a few minutes to an hour to propagate.

5. The `deploy.yml` workflow runs automatically on every push to `main`. The app will be live at:
   ```
   https://lulu.ulfillah.com
   ```
   The `public/CNAME` file in the repo keeps the custom domain bound across every deploy — no need to re-enter it in the dashboard.

---

### Step 12 — Enable push notifications in the app

1. Open the app on your phone
2. Go to **Kebiasaan** tab → scroll to **Pengingat / Reminders**
3. Tap **Izinkan Notifikasi** → allow when the browser asks
4. Toggle **Notifikasi Aktif** on
5. Adjust reminder times if needed and tap **Simpan**

To test immediately (without waiting for the cron), call the Edge Function manually:

```bash
# Test night reminder
curl -X POST \
  "https://your-project-ref.supabase.co/functions/v1/send-reminders?type=night" \
  -H "Authorization: Bearer your-anon-key"

# Test morning reminder
curl -X POST \
  "https://your-project-ref.supabase.co/functions/v1/send-reminders?type=morning" \
  -H "Authorization: Bearer your-anon-key"
```

---

### Step 13 (optional) — graphify for code context

Generates a knowledge graph of the codebase so future AI-assisted work doesn't need to re-scan all files (~70% fewer tokens):

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc   # or restart terminal

# Install graphify
uv tool install graphifyy
graphify install

# Generate the graph (run from project root)
graphify .
```

Outputs:
- `graphify-out/GRAPH_REPORT.md` — committed to the repo, used as AI context
- `graphify-out/graph.html` — interactive browser visualization (gitignored)

Regenerate after major structural changes.

---

## Development commands

```bash
npm run dev      # Start local dev server (http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
```

---

## Project structure

```
lulu/
├── src/
│   ├── assets/main.css          # Tailwind + pink/flower theme
│   ├── components/
│   │   ├── BottomNav.vue        # Tab bar (Beranda · Jadwal · Kebiasaan · Kalender)
│   │   ├── ConfettiBlast.vue    # Celebration animation
│   │   ├── HabitCard.vue        # Habit check-off + stars + streak + week grid
│   │   ├── NotificationSettings.vue  # Push notification opt-in + pref editor
│   │   ├── SubjectCard.vue      # Schedule slot card with live-active highlight
│   │   └── UniformBadge.vue     # Daily uniform display
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client (db.schema: 'lulu')
│   │   └── time.ts              # All WIB/UTC+7 date helpers
│   ├── pages/
│   │   ├── CalendarPage.vue     # Monthly calendar with event markers
│   │   ├── HabitsPage.vue       # Full habit tracker + add habit + notifications
│   │   ├── LoginPage.vue        # Google sign-in + allowlist rejection screen
│   │   ├── SchedulePage.vue     # Weekly schedule grid with day tabs
│   │   └── TodayPage.vue        # Today's timeline + uniform + quick habits
│   ├── router/index.ts          # Hash-history router (GitHub Pages compatible)
│   └── stores/
│       ├── auth.ts              # Google OAuth + email allowlist check
│       ├── calendar.ts          # Calendar events store
│       ├── habits.ts            # Habits + logs + streaks/stars
│       ├── notifications.ts     # Push subscription + prefs
│       └── schedule.ts          # Schedule slots + subjects + uniforms
├── supabase/
│   ├── config.toml              # Supabase CLI config
│   ├── functions/
│   │   └── send-reminders/      # Edge Function: WIB-aware push sender
│   └── migrations/
│       ├── 001_lulu_schema.sql  # Schema + 8 tables
│       ├── 002_lulu_rls.sql     # RLS allowlist policies
│       └── 003_lulu_seed.sql    # Schedule, uniforms, calendar, habits
├── .github/workflows/deploy.yml # GitHub Actions → GitHub Pages CI/CD
├── public/CNAME                 # Custom domain binding (lulu.ulfillah.com)
├── vite.config.ts               # Vite + PWA manifest (base: '/')
└── tailwind.config.js           # Pink/flower design system
```

---

## Database schema (`lulu.*`)

All tables are isolated in the `lulu` Postgres schema — no interference with other projects on the same Supabase instance. RLS is enabled on every table with a shared `lulu.is_allowed()` function that checks `auth.jwt() ->> 'email'` against the two-email allowlist.

| Table | Description |
|-------|-------------|
| `subjects` | Subject catalog (name, emoji, color, category) |
| `schedule_slots` | Weekly timetable (Mon–Fri, 54 rows seeded from PDF) |
| `uniforms` | Daily uniform per weekday (5 rows) |
| `habits` | Habit definitions |
| `habit_logs` | Daily check-off log — streaks/stars computed client-side |
| `calendar_events` | Full 2026/2027 academic calendar (38 events seeded) |
| `push_subscriptions` | Web Push endpoints per device |
| `notification_prefs` | Per-user reminder time preferences |

---

## Notification schedule

| Reminder | WIB time | UTC cron | Content |
|----------|----------|----------|---------|
| 🌙 Night before | 19:00 | `0 12 * * 1-5` | Tomorrow's subjects + uniform |
| ☀️ Early morning | 05:30 | `30 22 * * 0-4` | Today's subjects + first period + uniform |

Reminders are **automatically suppressed** on weekends and school holidays (cross-checked against `calendar_events`).

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Vite + **Vue 3** (`<script setup>`, TypeScript) |
| State | Pinia |
| Routing | Vue Router — hash history (GitHub Pages compatible) |
| Styling | Tailwind CSS + custom pink/flower design system |
| Fonts | Fredoka (display) + Nunito (body) via Google Fonts |
| Backend | **Supabase** — Postgres `lulu` schema + Google Auth + RLS |
| Push | Web Push (VAPID) + Supabase Edge Function + `pg_cron` |
| PWA | `vite-plugin-pwa` + Workbox (offline, installable) |
| Deploy | GitHub Pages via GitHub Actions |
| Code context | graphify (optional, dev tooling) |
