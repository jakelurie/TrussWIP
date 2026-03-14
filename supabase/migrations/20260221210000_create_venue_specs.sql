-- VenueSpec — crowdsourced venue technical specifications
CREATE TABLE IF NOT EXISTS venue_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name text NOT NULL,
  city text NOT NULL,
  state text,
  venue_type text NOT NULL DEFAULT 'hotel',
  power_info text,
  rigging_info text,
  loading_dock text,
  internet_info text,
  audio_notes text,
  video_notes text,
  lighting_notes text,
  staging_notes text,
  general_notes text,
  submitted_by uuid NOT NULL REFERENCES profiles(id),
  verified boolean DEFAULT false,
  upvotes int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_specs_city ON venue_specs(city);
CREATE INDEX IF NOT EXISTS idx_venue_specs_name ON venue_specs(venue_name);
CREATE INDEX IF NOT EXISTS idx_venue_specs_type ON venue_specs(venue_type);

-- Upvotes tracking
CREATE TABLE IF NOT EXISTS venue_spec_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_spec_id uuid NOT NULL REFERENCES venue_specs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_spec_id, user_id)
);

-- RLS
ALTER TABLE venue_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_spec_upvotes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view venue specs" ON venue_specs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert venue specs" ON venue_specs FOR INSERT WITH CHECK (submitted_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own venue specs" ON venue_specs FOR UPDATE USING (submitted_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can view upvotes" ON venue_spec_upvotes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upvote" ON venue_spec_upvotes FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can remove own upvotes" ON venue_spec_upvotes FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
