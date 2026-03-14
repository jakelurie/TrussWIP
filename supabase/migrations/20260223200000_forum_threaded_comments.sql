-- ═══════════════════════════════════════════════════════════
-- Forum: Threaded Comments
-- ═══════════════════════════════════════════════════════════

ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES forum_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_comment_id);
