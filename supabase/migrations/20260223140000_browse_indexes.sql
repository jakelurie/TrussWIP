-- ═══════════════════════════════════════════════════════════
-- Browse page performance indexes
-- ═══════════════════════════════════════════════════════════

-- tech_profiles: primary query filters and sort columns
CREATE INDEX IF NOT EXISTS idx_tech_profiles_complete ON tech_profiles(profile_complete) WHERE profile_complete > 0;
CREATE INDEX IF NOT EXISTS idx_tech_profiles_available ON tech_profiles(available) WHERE available = true;
CREATE INDEX IF NOT EXISTS idx_tech_profiles_insured ON tech_profiles(has_insurance) WHERE has_insurance = true;
CREATE INDEX IF NOT EXISTS idx_tech_profiles_rating ON tech_profiles(avg_rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_rate ON tech_profiles(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_experience ON tech_profiles(years_experience DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_xp ON tech_profiles(xp DESC NULLS LAST);

-- GIN indexes for array column overlap queries (skills, specializations, gear)
CREATE INDEX IF NOT EXISTS idx_tech_profiles_skills_gin ON tech_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_specs_gin ON tech_profiles USING GIN(specializations);

-- availability: date range lookups
CREATE INDEX IF NOT EXISTS idx_availability_status_date ON availability(status, date) WHERE status = 'unavailable';

-- bookings: status + tech for date overlap checks
CREATE INDEX IF NOT EXISTS idx_bookings_status_tech ON bookings(status, tech_id) WHERE status IN ('confirmed', 'paid');
