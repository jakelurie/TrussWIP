-- Saved searches for producers — stores filter combinations and alerts
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filters jsonb NOT NULL DEFAULT '{}',
  label text,
  last_notified_at timestamptz,
  last_match_count int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Ensure columns exist if table was created without them
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS last_match_count int DEFAULT 0;

-- Index for cron lookups
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_producer ON saved_searches(producer_id);

-- RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Producers see and manage their own saved searches
DO $$ BEGIN
  CREATE POLICY "Users can view own saved searches"
    ON saved_searches FOR SELECT
    USING (producer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own saved searches"
    ON saved_searches FOR INSERT
    WITH CHECK (producer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own saved searches"
    ON saved_searches FOR UPDATE
    USING (producer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own saved searches"
    ON saved_searches FOR DELETE
    USING (producer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
