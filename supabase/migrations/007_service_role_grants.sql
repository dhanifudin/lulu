-- 007_service_role_grants.sql
-- ============================================================
-- Fix: grant service_role access to the lulu schema.
--
-- Migration 001 granted the lulu schema to anon + authenticated only
-- (001_lulu_schema.sql:10-13) and OMITTED service_role. Because Edge
-- Functions authenticate with the service_role key, every query they ran
-- against lulu (push_subscriptions, notification_prefs, schedule_slots,
-- subjects, uniforms, calendar_events) failed with:
--     ERROR: permission denied for schema lulu
-- The failure was silent — send-reminders does `const { data } = await ...`
-- without checking `error`, so a permission error just yielded data=null,
-- i.e. subsFound=0 and no pushes. This broke the test button AND all
-- scheduled (night/morning/pickup) reminders.
--
-- service_role already has BYPASSRLS, so no RLS changes are needed — it
-- only lacked the schema/table grants. This backfills them (idempotent).
-- ============================================================

grant usage on schema lulu to service_role;

grant all on all tables    in schema lulu to service_role;
grant all on all sequences in schema lulu to service_role;
grant all on all functions in schema lulu to service_role;

-- Objects created in lulu in the future
alter default privileges in schema lulu grant all on tables    to service_role;
alter default privileges in schema lulu grant all on sequences to service_role;
alter default privileges in schema lulu grant all on functions to service_role;
