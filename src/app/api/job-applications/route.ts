import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 20 });

async function getAuthUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabaseAuth.auth.getUser(token);
  return user?.id || null;
}

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUser(req);
  if (!userId) return err("Unauthorized", 401);

  const url = new URL(req.url);
  const jobId = url.searchParams.get("job_id");
  const view = url.searchParams.get("view"); // "mine" for tech's own applications

  if (view === "mine") {
    // Tech sees their own applications
    const { data, error } = await supabaseAdmin
      .from("job_applications")
      .select("*, jobs(*)")
      .eq("tech_id", userId)
      .order("created_at", { ascending: false });

    if (error) return err(error.message, 500);
    return NextResponse.json({ applications: data });
  }

  if (jobId) {
    // Producer sees applications for their job
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("producer_id")
      .eq("id", jobId)
      .single();

    if (!job) return err("Job not found", 404);
    if (job.producer_id !== userId) return err("Forbidden", 403);

    const { data, error } = await supabaseAdmin
      .from("job_applications")
      .select("*, profiles!job_applications_tech_id_fkey(id, display_name, city, avatar_url), tech_profiles!job_applications_tech_id_fkey(skills, gear, bio, rate, avg_rating, review_count, reputation_tier)")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) return err(error.message, 500);
    return NextResponse.json({ applications: data });
  }

  return err("Provide job_id or view=mine");
}

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const userId = await getAuthUser(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "apply": return handleApply(userId, body);
    case "update_status": return handleUpdateStatus(userId, body);
    default: return err("Unknown action");
  }
}

async function handleApply(techId: string, body: any) {
  const { jobId, message } = body;
  if (!jobId) return err("jobId required");

  // Verify job exists and is posted
  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();

  if (!job) return err("Job not found", 404);
  if (job.status !== "posted") return err("This job is no longer accepting applications");

  // Check for duplicate
  const { data: existing } = await supabaseAdmin
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("tech_id", techId)
    .maybeSingle();

  if (existing) return err("You have already applied to this job");

  const { data, error } = await supabaseAdmin
    .from("job_applications")
    .insert({
      job_id: jobId,
      tech_id: techId,
      message: message || null,
      status: "applied",
    })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ application: data }, { status: 201 });
}

async function handleUpdateStatus(producerId: string, body: any) {
  const { applicationId, status } = body;
  if (!applicationId || !status) return err("applicationId and status required");

  const validStatuses = ["applied", "reviewed", "shortlisted", "hired", "rejected"];
  if (!validStatuses.includes(status)) return err("Invalid status");

  // Verify producer owns the job
  const { data: app } = await supabaseAdmin
    .from("job_applications")
    .select("id, job_id, jobs!inner(producer_id)")
    .eq("id", applicationId)
    .single();

  if (!app) return err("Application not found", 404);
  if ((app as any).jobs.producer_id !== producerId) return err("Forbidden", 403);

  const { data, error } = await supabaseAdmin
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId)
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ application: data });
}
