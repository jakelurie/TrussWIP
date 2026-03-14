-- ═══════════════════════════════════════════════════════════
-- Wiki Articles & Revision History
-- ═══════════════════════════════════════════════════════════

-- Current article content (one row per gear_id)
CREATE TABLE IF NOT EXISTS wiki_articles (
  gear_id text PRIMARY KEY,
  content text NOT NULL DEFAULT '',
  last_editor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  edit_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Full revision history
CREATE TABLE IF NOT EXISTS wiki_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gear_id text NOT NULL,
  editor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_revisions_gear ON wiki_revisions(gear_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_revisions_editor ON wiki_revisions(editor_id);

-- Add edit_count to wiki_page_stats
ALTER TABLE wiki_page_stats ADD COLUMN IF NOT EXISTS edit_count int NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════

ALTER TABLE wiki_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_revisions ENABLE ROW LEVEL SECURITY;

-- wiki_articles: public read
DO $$ BEGIN
  CREATE POLICY "wiki_articles_select" ON wiki_articles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_articles_insert" ON wiki_articles FOR INSERT WITH CHECK (auth.uid() = last_editor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_articles_update" ON wiki_articles FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- wiki_revisions: public read
DO $$ BEGIN
  CREATE POLICY "wiki_revisions_select" ON wiki_revisions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_revisions_insert" ON wiki_revisions FOR INSERT WITH CHECK (auth.uid() = editor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service role full access
DO $$ BEGIN
  CREATE POLICY "wiki_articles_service" ON wiki_articles FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_revisions_service" ON wiki_revisions FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
