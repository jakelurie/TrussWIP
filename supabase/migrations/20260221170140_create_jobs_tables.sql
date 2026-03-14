-- Job Board tables and RLS policies
-- Run this in Supabase SQL Editor

-- ===== JOBS TABLE =====
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  city text NOT NULL,
  role_id text NOT NULL,
  employment_type text NOT NULL DEFAULT 'contract',
  pay_min numeric,
  pay_max numeric,
  pay_type text NOT NULL DEFAULT 'day_rate',
  requirements text,
  status text NOT NULL DEFAULT 'posted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can view posted jobs
CREATE POLICY "jobs_select_public" ON jobs
  FOR SELECT USING (status = 'posted');

-- Producers can see all their own jobs (any status)
CREATE POLICY "jobs_select_own" ON jobs
  FOR SELECT USING (producer_id = auth.uid());

-- Producers can insert their own jobs
CREATE POLICY "jobs_insert_own" ON jobs
  FOR INSERT WITH CHECK (producer_id = auth.uid());

-- Producers can update their own jobs
CREATE POLICY "jobs_update_own" ON jobs
  FOR UPDATE USING (producer_id = auth.uid());

-- Producers can delete their own jobs
CREATE POLICY "jobs_delete_own" ON jobs
  FOR DELETE USING (producer_id = auth.uid());

-- ===== JOB APPLICATIONS TABLE =====
CREATE TABLE job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tech_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'applied',
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, tech_id)
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Techs can see their own applications
CREATE POLICY "job_applications_select_own" ON job_applications
  FOR SELECT USING (tech_id = auth.uid());

-- Producers can see applications for their jobs
CREATE POLICY "job_applications_select_producer" ON job_applications
  FOR SELECT USING (
    job_id IN (SELECT id FROM jobs WHERE producer_id = auth.uid())
  );

-- Techs can apply (insert their own)
CREATE POLICY "job_applications_insert_own" ON job_applications
  FOR INSERT WITH CHECK (tech_id = auth.uid());

-- Producers can update application status for their jobs
CREATE POLICY "job_applications_update_producer" ON job_applications
  FOR UPDATE USING (
    job_id IN (SELECT id FROM jobs WHERE producer_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_jobs_producer_id ON jobs(producer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_role_id ON jobs(role_id);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_tech_id ON job_applications(tech_id);
