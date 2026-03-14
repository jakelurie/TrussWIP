-- ═══════════════════════════════════════════════════════════
-- Community Forum
-- ═══════════════════════════════════════════════════════════

-- Categories (pre-seeded, not user-created)
CREATE TABLE IF NOT EXISTS forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  department_id text,
  icon text NOT NULL DEFAULT 'GEN',
  sort_order int NOT NULL DEFAULT 0,
  post_count int NOT NULL DEFAULT 0,
  last_post_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES forum_categories(id),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  body text NOT NULL,
  helpful_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  view_count int NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  last_comment_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id, is_hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);

-- Comments (flat, no nesting)
CREATE TABLE IF NOT EXISTS forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  helpful_count int NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id, is_hidden, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_author ON forum_comments(author_id);

-- Helpful marks (toggle-based upvotes)
CREATE TABLE IF NOT EXISTS forum_helpful_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES forum_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT helpful_one_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_helpful_post ON forum_helpful_marks(user_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_helpful_comment ON forum_helpful_marks(user_id, comment_id) WHERE comment_id IS NOT NULL;

-- Reports
CREATE TABLE IF NOT EXISTS forum_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES forum_comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_one_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- ═══════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_helpful_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;

-- Categories: public read
DO $$ BEGIN
  CREATE POLICY "forum_categories_select" ON forum_categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Posts: public read (not hidden), auth insert/update own
DO $$ BEGIN
  CREATE POLICY "forum_posts_select" ON forum_posts FOR SELECT USING (is_hidden = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_posts_insert" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_posts_update" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Comments: public read (not hidden), auth insert/update own
DO $$ BEGIN
  CREATE POLICY "forum_comments_select" ON forum_comments FOR SELECT USING (is_hidden = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_comments_insert" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_comments_update" ON forum_comments FOR UPDATE USING (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful marks: public read, auth insert/delete own
DO $$ BEGIN
  CREATE POLICY "forum_helpful_select" ON forum_helpful_marks FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_helpful_insert" ON forum_helpful_marks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_helpful_delete" ON forum_helpful_marks FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reports: auth insert own, select own
DO $$ BEGIN
  CREATE POLICY "forum_reports_select" ON forum_reports FOR SELECT USING (auth.uid() = reporter_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_reports_insert" ON forum_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service role full access (for API routes)
DO $$ BEGIN
  CREATE POLICY "forum_posts_service" ON forum_posts FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_comments_service" ON forum_comments FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "forum_categories_service" ON forum_categories FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════
-- Seed Categories
-- ═══════════════════════════════════════════════════════════

INSERT INTO forum_categories (slug, name, description, department_id, icon, sort_order) VALUES
  ('general', 'General', 'General discussion about the AV industry and freelance life', NULL, 'GEN', 0),
  ('audio', 'Audio', 'FOH, monitors, wireless, Dante, system design, and all things audio', 'audio', 'AUD', 1),
  ('video', 'Video', 'Switching, LED, projection, cameras, streaming, and media servers', 'video', 'VID', 2),
  ('lighting', 'Lighting', 'Consoles, fixtures, programming, design, and DMX', 'lighting', 'LTG', 3),
  ('staging-rigging', 'Staging & Rigging', 'Load-in, rigging, power distribution, and scenic', 'staging', 'STG', 4),
  ('it-networking', 'IT & Networking', 'Show networks, Dante, NDI, AVB, and on-site IT', 'it_network', 'NET', 5),
  ('production-management', 'Production & Management', 'TDs, PMs, show calling, logistics, and crew coordination', 'production', 'PRD', 6),
  ('gear-talk', 'Gear Talk', 'Gear reviews, comparisons, purchase advice, and new product discussion', NULL, 'GER', 7),
  ('rate-discussion', 'Rate Discussion', 'Day rates, negotiation, market trends, and compensation', NULL, 'RTE', 8)
ON CONFLICT (slug) DO NOTHING;
