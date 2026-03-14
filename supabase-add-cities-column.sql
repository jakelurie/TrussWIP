-- Add multi-city availability to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cities text[];

-- Backfill: copy existing single city into the cities array
UPDATE profiles
SET cities = ARRAY[city]
WHERE city IS NOT NULL
  AND city != ''
  AND (cities IS NULL OR cities = '{}');
