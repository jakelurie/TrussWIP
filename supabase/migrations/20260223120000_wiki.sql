-- ═══════════════════════════════════════════════════════════
-- Gear Wiki
-- ═══════════════════════════════════════════════════════════

-- Page stats (denormalized counters keyed by taxonomy gear_id)
CREATE TABLE IF NOT EXISTS wiki_page_stats (
  gear_id text PRIMARY KEY,
  note_count int NOT NULL DEFAULT 0,
  question_count int NOT NULL DEFAULT 0,
  answer_count int NOT NULL DEFAULT 0,
  view_count int NOT NULL DEFAULT 0,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notes (tips, known issues, compatibility, show stories)
CREATE TABLE IF NOT EXISTS wiki_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gear_id text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('tip', 'issue', 'compatibility', 'story')),
  body text NOT NULL,
  helpful_count int NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_notes_gear ON wiki_notes(gear_id, is_hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_notes_author ON wiki_notes(author_id);

-- Questions
CREATE TABLE IF NOT EXISTS wiki_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gear_id text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  answer_count int NOT NULL DEFAULT 0,
  view_count int NOT NULL DEFAULT 0,
  accepted_answer_id uuid,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_questions_gear ON wiki_questions(gear_id, is_hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_questions_author ON wiki_questions(author_id);

-- Answers
CREATE TABLE IF NOT EXISTS wiki_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES wiki_questions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  helpful_count int NOT NULL DEFAULT 0,
  is_accepted boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_answers_question ON wiki_answers(question_id, is_hidden, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_wiki_answers_author ON wiki_answers(author_id);

-- Helpful marks (upvotes for notes, questions, and answers)
CREATE TABLE IF NOT EXISTS wiki_helpful_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_id uuid REFERENCES wiki_notes(id) ON DELETE CASCADE,
  question_id uuid REFERENCES wiki_questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES wiki_answers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wiki_helpful_one_target CHECK (
    (note_id IS NOT NULL AND question_id IS NULL AND answer_id IS NULL) OR
    (note_id IS NULL AND question_id IS NOT NULL AND answer_id IS NULL) OR
    (note_id IS NULL AND question_id IS NULL AND answer_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wiki_helpful_note ON wiki_helpful_marks(user_id, note_id) WHERE note_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wiki_helpful_question ON wiki_helpful_marks(user_id, question_id) WHERE question_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wiki_helpful_answer ON wiki_helpful_marks(user_id, answer_id) WHERE answer_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════

ALTER TABLE wiki_page_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_helpful_marks ENABLE ROW LEVEL SECURITY;

-- wiki_page_stats: public read
DO $$ BEGIN
  CREATE POLICY "wiki_page_stats_select" ON wiki_page_stats FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- wiki_notes
DO $$ BEGIN
  CREATE POLICY "wiki_notes_select" ON wiki_notes FOR SELECT USING (is_hidden = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_notes_insert" ON wiki_notes FOR INSERT WITH CHECK (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_notes_update" ON wiki_notes FOR UPDATE USING (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- wiki_questions
DO $$ BEGIN
  CREATE POLICY "wiki_questions_select" ON wiki_questions FOR SELECT USING (is_hidden = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_questions_insert" ON wiki_questions FOR INSERT WITH CHECK (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_questions_update" ON wiki_questions FOR UPDATE USING (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- wiki_answers
DO $$ BEGIN
  CREATE POLICY "wiki_answers_select" ON wiki_answers FOR SELECT USING (is_hidden = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_answers_insert" ON wiki_answers FOR INSERT WITH CHECK (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_answers_update" ON wiki_answers FOR UPDATE USING (auth.uid() = author_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- wiki_helpful_marks
DO $$ BEGIN
  CREATE POLICY "wiki_helpful_select" ON wiki_helpful_marks FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_helpful_insert" ON wiki_helpful_marks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_helpful_delete" ON wiki_helpful_marks FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service role full access
DO $$ BEGIN
  CREATE POLICY "wiki_page_stats_service" ON wiki_page_stats FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_notes_service" ON wiki_notes FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_questions_service" ON wiki_questions FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_answers_service" ON wiki_answers FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "wiki_helpful_marks_service" ON wiki_helpful_marks FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
