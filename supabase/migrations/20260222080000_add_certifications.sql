-- Add certifications column to tech_profiles
ALTER TABLE tech_profiles ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}';
