-- 0008: add missing indexes for foreign-key and status columns
-- Fixes full-table-scan on every parent dashboard load, star count, and request lookup.
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children (parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_child_id_is_active ON goals (child_id, is_active);
CREATE INDEX IF NOT EXISTS idx_star_events_goal_id ON star_events (goal_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_goal_id ON reward_redemptions (goal_id);
CREATE INDEX IF NOT EXISTS idx_star_requests_goal_id ON star_requests (goal_id);
CREATE INDEX IF NOT EXISTS idx_star_requests_child_id_status ON star_requests (child_id, status);
CREATE INDEX IF NOT EXISTS idx_co_parents_co_parent_id ON co_parents (co_parent_id);
CREATE INDEX IF NOT EXISTS idx_co_parent_invites_owner_id ON co_parent_invites (owner_id);
