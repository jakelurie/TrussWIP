-- Add career highlights to tech profiles
ALTER TABLE tech_profiles ADD COLUMN IF NOT EXISTS career_highlights jsonb DEFAULT '[]'::jsonb;
