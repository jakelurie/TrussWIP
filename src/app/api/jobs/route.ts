import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 30 });
const FREE_JOB_LIMIT = 3;

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
  const url = new URL(req.url);
  const role = url.searchParams.get("role");
  const city = url.searchParams.get("city");
  const employmentType = url.searchParams.get("employment_type");
  const producerId = url.searchParams.get("producer_id");
  const status = url.searchParams.get("status") || "posted";

  let query = supabaseAdmin
    .from("jobs")
    .select("*, profiles!jobs_producer_id_fkey(display_name, company_name)")
    .order("created_at", { ascending: false });

  if (producerId) {
    query = query.eq("producer_id", producerId);
  } else {
    query = query.eq("status", status);
  }

  if (role) query = query.eq("role_id", role);
  if (city) query = query.ilike("city", `%${city}%`);
  if (employmentType) query = query.eq("employment_type", employmentType);

  const { data, error } = await query;
  if (error) return err(error.message, 500);

  return NextResponse.json({ jobs: data });
}

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const userId = await getAuthUser(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "create": return handleCreate(userId, body);
    case "update": return handleUpdate(userId, body);
    case "close": return handleClose(userId, body);
    case "delete": return handleDelete(userId, body);
    default: return err("Unknown action");
  }
}

async function handleCreate(userId: string, body: any) {
  const { title, description, city, role_id, employment_type, pay_min, pay_max, pay_type, requirements, expires_at } = body;

  if (!title || !city || !role_id) return err("Title, city, and role are required");

  // Check free post limit
  const { count } = await supabaseAdmin
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("producer_id", userId)
    .neq("status", "draft");

  if ((count || 0) >= FREE_JOB_LIMIT) {
    return NextResponse.json(
      { error: "You've used all 3 free job posts. Paid job posts coming soon.", upgrade_required: true },
      { status: 402 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert({
      producer_id: userId,
      title,
      description: description || null,
      city,
      role_id,
      employment_type: employment_type || "contract",
      pay_min: pay_min || null,
      pay_max: pay_max || null,
      pay_type: pay_type || "day_rate",
      requirements: requirements || null,
      status: "posted",
      expires_at: expires_at || null,
    })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ job: data }, { status: 201 });
}

async function handleUpdate(userId: string, body: any) {
  const { jobId, ...updates } = body;
  if (!jobId) return err("jobId required");

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from("jobs")
    .select("producer_id")
    .eq("id", jobId)
    .single();

  if (!existing) return err("Job not found", 404);
  if (existing.producer_id !== userId) return err("Forbidden", 403);

  const allowed = ["title", "description", "city", "role_id", "employment_type", "pay_min", "pay_max", "pay_type", "requirements", "expires_at"];
  const clean: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in updates) clean[key] = updates[key];
  }

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .update(clean)
    .eq("id", jobId)
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ job: data });
}

async function handleClose(userId: string, body: any) {
  const { jobId, status } = body;
  if (!jobId) return err("jobId required");

  const validStatuses = ["filled", "closed"];
  const newStatus = validStatuses.includes(status) ? status : "closed";

  const { data: existing } = await supabaseAdmin
    .from("jobs")
    .select("producer_id")
    .eq("id", jobId)
    .single();

  if (!existing) return err("Job not found", 404);
  if (existing.producer_id !== userId) return err("Forbidden", 403);

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ job: data });
}

async function handleDelete(userId: string, body: any) {
  const { jobId } = body;
  if (!jobId) return err("jobId required");

  const { data: existing } = await supabaseAdmin
    .from("jobs")
    .select("producer_id")
    .eq("id", jobId)
    .single();

  if (!existing) return err("Job not found", 404);
  if (existing.producer_id !== userId) return err("Forbidden", 403);

  const { error } = await supabaseAdmin
    .from("jobs")
    .delete()
    .eq("id", jobId);

  if (error) return err(error.message, 500);
  return NextResponse.json({ success: true });
}
