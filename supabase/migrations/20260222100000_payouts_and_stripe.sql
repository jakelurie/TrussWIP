-- Add Stripe Connect columns to tech_profiles (if not already present)
ALTER TABLE tech_profiles ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE tech_profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  stripe_transfer_id text,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  platform_fee numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups by tech
CREATE INDEX IF NOT EXISTS idx_payouts_tech_id ON payouts(tech_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- RLS
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Techs can view own payouts" ON payouts FOR SELECT USING (auth.uid() = tech_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access on payouts" ON payouts FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add nudge tracking column to tech_profiles
ALTER TABLE tech_profiles ADD COLUMN IF NOT EXISTS payout_nudge_sent_at timestamptz;
