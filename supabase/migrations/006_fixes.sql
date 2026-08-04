-- 006_fixes.sql
-- Fix Tuesday uniform: "Blue Jacket" → "Blue Suit"
-- (003_lulu_seed.sql used ON CONFLICT DO NOTHING so updating requires an explicit UPDATE)
UPDATE lulu.uniforms
  SET name_en = 'Blue Suit'
  WHERE day_of_week = 2;

-- ── Rewards write policies (allow authenticated + allowed users to add custom rewards) ──
-- SELECT already covered by existing "Public read" policy.
-- DROP IF EXISTS makes this idempotent if policies were created manually before CI.

DROP POLICY IF EXISTS "rewards_insert" ON lulu.rewards;
DROP POLICY IF EXISTS "rewards_update" ON lulu.rewards;
DROP POLICY IF EXISTS "rewards_delete" ON lulu.rewards;

CREATE POLICY "rewards_insert"
  ON lulu.rewards FOR INSERT
  TO authenticated
  WITH CHECK (lulu.is_allowed());

CREATE POLICY "rewards_update"
  ON lulu.rewards FOR UPDATE
  TO authenticated
  USING (lulu.is_allowed());

CREATE POLICY "rewards_delete"
  ON lulu.rewards FOR DELETE
  TO authenticated
  USING (lulu.is_allowed());
