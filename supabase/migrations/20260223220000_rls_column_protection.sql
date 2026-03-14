-- ============================================
-- FIX 1: Protect sensitive profile fields
-- Users can only update safe columns (display_name, city, avatar_url, etc.)
-- Sensitive fields (is_verified, user_type, email, etc.) are frozen for non-service-role
-- ============================================
CREATE OR REPLACE FUNCTION prevent_profile_sensitive_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    NEW.is_verified := OLD.is_verified;
    NEW.user_type := OLD.user_type;
    NEW.billing_type := OLD.billing_type;
    NEW.payment_method := OLD.payment_method;
    NEW.po_number := OLD.po_number;
    NEW.referral_code := OLD.referral_code;
    NEW.email := OLD.email;
    NEW.deleted_at := OLD.deleted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_profile_fields ON profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_sensitive_updates();

-- ============================================
-- FIX 2: Protect tech reputation fields
-- level, xp, completed_gigs, avg_rating, review_count are server-computed only
-- ============================================
CREATE OR REPLACE FUNCTION prevent_tech_profile_gaming()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    NEW.level := OLD.level;
    NEW.xp := OLD.xp;
    NEW.completed_gigs := OLD.completed_gigs;
    NEW.avg_rating := OLD.avg_rating;
    NEW.review_count := OLD.review_count;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_tech_reputation ON tech_profiles;
CREATE TRIGGER protect_tech_reputation
  BEFORE UPDATE ON tech_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_tech_profile_gaming();

-- ============================================
-- FIX 3: Auto-calculate profile_complete from actual data
-- Fires on every insert/update, replaces client-side calculation
-- ============================================
CREATE OR REPLACE FUNCTION calculate_profile_complete()
RETURNS TRIGGER AS $$
DECLARE
  pct integer := 0;
  prof RECORD;
BEGIN
  SELECT avatar_url, display_name, cities INTO prof
  FROM profiles WHERE id = NEW.user_id;

  IF prof.avatar_url IS NOT NULL AND prof.avatar_url != '' THEN pct := pct + 15; END IF;
  IF prof.display_name IS NOT NULL AND prof.display_name != '' THEN pct := pct + 10; END IF;
  IF prof.cities IS NOT NULL AND array_length(prof.cities, 1) > 0 THEN pct := pct + 10; END IF;
  IF NEW.primary_skill IS NOT NULL AND NEW.primary_skill != '' THEN pct := pct + 10; END IF;
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN pct := pct + 5; END IF;
  IF NEW.bio IS NOT NULL AND length(NEW.bio) > 20 THEN pct := pct + 15; END IF;
  IF NEW.gear IS NOT NULL AND array_length(NEW.gear, 1) > 0 THEN pct := pct + 10; END IF;
  IF NEW.years_experience IS NOT NULL AND NEW.years_experience > 0 THEN pct := pct + 10; END IF;
  IF NEW.hourly_rate IS NOT NULL AND NEW.hourly_rate > 0 THEN pct := pct + 10; END IF;
  IF NEW.specializations IS NOT NULL AND array_length(NEW.specializations, 1) > 0 THEN pct := pct + 5; END IF;
  IF NEW.certifications IS NOT NULL AND array_length(NEW.certifications, 1) > 0 THEN pct := pct + 5; END IF;

  NEW.profile_complete := LEAST(pct, 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_profile_complete ON tech_profiles;
CREATE TRIGGER recalculate_profile_complete
  BEFORE INSERT OR UPDATE ON tech_profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_complete();

-- ============================================
-- FIX 4: Lock down referrals UPDATE (all updates are server-side)
-- ============================================
DROP POLICY IF EXISTS "referrals_update" ON referrals;

-- ============================================
-- FIX 5: Protect forum/wiki moderation fields
-- Users cannot un-hide their own posts/comments after admin hides them
-- ============================================
CREATE OR REPLACE FUNCTION prevent_forum_unhide()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    NEW.is_hidden := OLD.is_hidden;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_forum_posts_hidden ON forum_posts;
CREATE TRIGGER protect_forum_posts_hidden
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_forum_unhide();

DROP TRIGGER IF EXISTS protect_forum_comments_hidden ON forum_comments;
CREATE TRIGGER protect_forum_comments_hidden
  BEFORE UPDATE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_forum_unhide();

DROP TRIGGER IF EXISTS protect_wiki_answers_hidden ON wiki_answers;
CREATE TRIGGER protect_wiki_answers_hidden
  BEFORE UPDATE ON wiki_answers
  FOR EACH ROW
  EXECUTE FUNCTION prevent_forum_unhide();
