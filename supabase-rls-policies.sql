-- ═══════════════════════════════════════════════════════════════
-- TRUSS — Row Level Security Policies
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── STEP 1: Enable RLS on all tables ────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- PROFILES
-- Anyone can read (browse, public profile pages, booking modals)
-- Only owner can insert/update their own row
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════
-- TECH_PROFILES
-- Anyone can read (marketplace browse, public profile)
-- Only the tech (owner) can insert/update their own row
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "tech_profiles_select" ON tech_profiles
  FOR SELECT USING (true);

CREATE POLICY "tech_profiles_insert" ON tech_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tech_profiles_update" ON tech_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROJECTS
-- Only the producer who created the project can read/insert/update
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (auth.uid() = producer_id);

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (auth.uid() = producer_id);

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (auth.uid() = producer_id);

-- ═══════════════════════════════════════════════════════════════
-- PROJECT_ROLES
-- Anyone authenticated can read (needed for booking flow)
-- Only the project owner (producer) can insert/update/delete
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "project_roles_select" ON project_roles
  FOR SELECT USING (true);

CREATE POLICY "project_roles_insert" ON project_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_roles.project_id
        AND projects.producer_id = auth.uid()
    )
  );

CREATE POLICY "project_roles_update" ON project_roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_roles.project_id
        AND projects.producer_id = auth.uid()
    )
  );

CREATE POLICY "project_roles_delete" ON project_roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_roles.project_id
        AND projects.producer_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- BOOKINGS
-- Only the producer or tech involved can read
-- Only the producer can create bookings
-- Both producer and tech can update (status changes)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    auth.uid() = producer_id OR auth.uid() = tech_id
  );

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE USING (
    auth.uid() = producer_id OR auth.uid() = tech_id
  );

-- ═══════════════════════════════════════════════════════════════
-- REVIEWS
-- Anyone can read (public reputation data)
-- Only the producer (reviewer) can insert
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ═══════════════════════════════════════════════════════════════
-- CONVERSATIONS
-- Only participants can read/update
-- Any authenticated user can create (to start a DM)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- CONVERSATION_PARTICIPANTS
-- Users can see participants in conversations they belong to
-- Authenticated users can insert (when creating a conversation)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "conversation_participants_select" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════
-- MESSAGES
-- Only conversation participants can read/insert/update
-- Sender must be the authenticated user
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- FAVORITES
-- Only the producer who owns favorites can read/insert/delete
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "favorites_select" ON favorites
  FOR SELECT USING (auth.uid() = producer_id);

CREATE POLICY "favorites_insert" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "favorites_delete" ON favorites
  FOR DELETE USING (auth.uid() = producer_id);

-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- Users can read/update only their own notifications
-- Any authenticated user can insert (needed for cross-user notifications)
-- NOTE: Ideally inserts should use service role — see supabase-admin.ts
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════
-- AVAILABILITY
-- Anyone can read (producers filter by date on browse)
-- Only the tech who owns the availability can insert/update/delete
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "availability_select" ON availability
  FOR SELECT USING (true);

CREATE POLICY "availability_insert" ON availability
  FOR INSERT WITH CHECK (auth.uid() = tech_user_id);

CREATE POLICY "availability_update" ON availability
  FOR UPDATE USING (auth.uid() = tech_user_id);

CREATE POLICY "availability_delete" ON availability
  FOR DELETE USING (auth.uid() = tech_user_id);

-- ═══════════════════════════════════════════════════════════════
-- REFERRALS
-- Users can read referrals they are involved in (referrer or referred)
-- Any authenticated user can insert (created during signup flow)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "referrals_select" ON referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
  );

CREATE POLICY "referrals_insert" ON referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "referrals_update" ON referrals
  FOR UPDATE USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
  );

-- ═══════════════════════════════════════════════════════════════
-- BADGES (reference data)
-- Anyone can read. No client writes (system only).
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "badges_select" ON badges
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════
-- EARNED_BADGES
-- Anyone can read (public on tech profiles)
-- Any authenticated user can insert (XP engine awards badges)
-- NOTE: Ideally inserts should use service role — see supabase-admin.ts
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "earned_badges_select" ON earned_badges
  FOR SELECT USING (true);

CREATE POLICY "earned_badges_insert" ON earned_badges
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════
-- PORTFOLIO_ITEMS
-- Anyone can read (public on tech profiles)
-- Only the tech who owns the portfolio item can insert/update/delete
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "portfolio_items_select" ON portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "portfolio_items_insert" ON portfolio_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tech_profiles tp
      WHERE tp.id = portfolio_items.tech_profile_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "portfolio_items_update" ON portfolio_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tech_profiles tp
      WHERE tp.id = portfolio_items.tech_profile_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "portfolio_items_delete" ON portfolio_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tech_profiles tp
      WHERE tp.id = portfolio_items.tech_profile_id
        AND tp.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- PROFILE_VIEWS
-- Techs can read views of their own profile
-- Any authenticated user can insert (tracks browse/profile views)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "profile_views_select" ON profile_views
  FOR SELECT USING (auth.uid() = tech_user_id);

CREATE POLICY "profile_views_insert" ON profile_views
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════
-- DONE. If any table above doesn't exist yet, the statement
-- will error — just skip that table.
-- ═══════════════════════════════════════════════════════════════
