import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import {
  notifyBookingRequest,
  notifyBookingAccepted,
  notifyBookingConfirmed,
  notifyBookingDeclined,
  notifyGigCompleted,
  notifyReviewReceived,
} from "@/lib/notifications-server";
import { processGigCompletion, processReview } from "@/lib/xp-engine-server";

const PLATFORM_FEE_RATE = 0.1;

// Valid status transitions: [currentStatus] → [allowedNextStatuses]
const STATUS_MACHINE: Record<string, string[]> = {
  pending: ["accepted", "declined", "cancelled"],
  accepted: ["confirmed", "paid", "cancelled"],
  confirmed: ["paid"],
  paid: ["completed"],
};

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

const limiter = rateLimit({ interval: 60_000, limit: 30 });

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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
    case "create_bulk": return handleCreateBulk(userId, body);
    case "accept": return handleTransition(userId, body, "accepted", "tech");
    case "decline": return handleTransition(userId, body, "declined", "tech");
    case "confirm": return handleConfirm(userId, body);
    case "invoice_confirm": return handleInvoiceConfirm(userId, body);
    case "complete": return handleComplete(userId, body);
    case "cancel": return handleCancel(userId, body);
    case "check_in": return handleCheckIn(userId, body);
    case "check_out": return handleCheckOut(userId, body);
    case "review": return handleReview(userId, body);
    default: return err("Unknown action");
  }
}

// ── Create a single booking ────────────────────────────────────────

async function handleCreate(userId: string, body: any) {
  const { projectId, projectRoleId, techId, rate, totalHours, notes, poNumber } = body;
  if (!projectId || !projectRoleId || !techId || !rate || !totalHours) {
    return err("Missing required fields");
  }

  // Verify producer owns the project
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, name, producer_id")
    .eq("id", projectId)
    .single();
  if (!project || project.producer_id !== userId) return err("Not your project", 403);

  // Get producer profile
  const { data: producerProfile } = await supabaseAdmin
    .from("profiles")
    .select("display_name, billing_type")
    .eq("id", userId)
    .single();

  // Calculate financials server-side
  const totalAmount = rate * totalHours;
  const platformFee = Math.round(totalAmount * PLATFORM_FEE_RATE);
  const billingType = producerProfile?.billing_type || "credit_card";

  const { data: booking, error: insertError } = await supabaseAdmin.from("bookings").insert({
    project_id: projectId,
    project_role_id: projectRoleId,
    producer_id: userId,
    tech_id: techId,
    status: "pending",
    rate,
    total_hours: totalHours,
    total_amount: totalAmount,
    platform_fee: platformFee,
    notes: notes || null,
    po_number: poNumber || null,
    payment_method: billingType,
  }).select("id").single();

  if (insertError) return err(insertError.message, 500);

  // Create conversation
  const { data: convo } = await supabaseAdmin.from("conversations").insert({
    booking_id: null,
    last_message: `Booking request sent for $${rate}/hr × ${totalHours}hr`,
    last_message_time: new Date().toISOString(),
  }).select().single();

  if (convo) {
    await supabaseAdmin.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: userId },
      { conversation_id: convo.id, user_id: techId },
    ]);
    await supabaseAdmin.from("messages").insert({
      conversation_id: convo.id,
      sender_id: userId,
      text: `Hi! I just sent you a booking request. ${notes || "Looking forward to working together!"}`,
      read: false,
    });
  }

  // Notify tech
  const producerName = producerProfile?.display_name || "A producer";
  await notifyBookingRequest(techId, producerName, project.name, booking!.id, rate, totalHours, totalAmount);

  return NextResponse.json({ id: booking!.id });
}

// ── Create bulk bookings ───────────────────────────────────────────

async function handleCreateBulk(userId: string, body: any) {
  const { projectId, bookings: bookingList } = body;
  if (!projectId || !bookingList?.length) return err("Missing project or bookings");

  // Verify producer owns the project
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, name, producer_id")
    .eq("id", projectId)
    .single();
  if (!project || project.producer_id !== userId) return err("Not your project", 403);

  const { data: producerProfile } = await supabaseAdmin
    .from("profiles")
    .select("display_name, billing_type")
    .eq("id", userId)
    .single();

  const producerName = producerProfile?.display_name || "A producer";
  const billingType = producerProfile?.billing_type || "credit_card";
  let count = 0;

  for (const item of bookingList) {
    const { projectRoleId, techId, rate, totalHours } = item;
    if (!projectRoleId || !techId || !rate || !totalHours) continue;

    const totalAmount = rate * totalHours;
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_RATE);

    const { data: booking } = await supabaseAdmin.from("bookings").insert({
      project_id: projectId,
      project_role_id: projectRoleId,
      producer_id: userId,
      tech_id: techId,
      status: "pending",
      rate,
      total_hours: totalHours,
      total_amount: totalAmount,
      platform_fee: platformFee,
      payment_method: billingType,
    }).select("id").single();

    if (booking) {
      await notifyBookingRequest(techId, producerName, project.name, booking.id, rate, totalHours, totalAmount);
      count++;
    }
  }

  return NextResponse.json({ created: count });
}

// ── Accept / Decline (tech only) ───────────────────────────────────

async function handleTransition(userId: string, body: any, newStatus: string, requiredRole: "tech" | "producer") {
  const { bookingId } = body;
  if (!bookingId) return err("Missing bookingId");

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*, projects(name)")
    .eq("id", bookingId)
    .single();
  if (!booking) return err("Booking not found", 404);

  // Check role
  if (requiredRole === "tech" && booking.tech_id !== userId) return err("Only the tech can do this", 403);
  if (requiredRole === "producer" && booking.producer_id !== userId) return err("Only the producer can do this", 403);

  // Check state machine
  const allowed = STATUS_MACHINE[booking.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return err(`Cannot transition from ${booking.status} to ${newStatus}`);
  }

  const updates: Record<string, any> = { status: newStatus };
  if (newStatus === "accepted" || newStatus === "declined") updates.responded_at = new Date().toISOString();

  await supabaseAdmin.from("bookings").update(updates).eq("id", bookingId);

  // Notifications
  const techName = await getDisplayName(booking.tech_id);
  const producerName = await getDisplayName(booking.producer_id);
  const projectName = booking.projects?.name || "Event";

  if (newStatus === "accepted") {
    await notifyBookingAccepted(booking.producer_id, techName, projectName, booking.total_amount);
  }
  if (newStatus === "declined") {
    await notifyBookingDeclined(booking.producer_id, techName, projectName);
  }

  return NextResponse.json({ status: newStatus });
}

// ── Confirm (producer, credit card flow → confirmed) ───────────────

async function handleConfirm(userId: string, body: any) {
  const { bookingId } = body;
  if (!bookingId) return err("Missing bookingId");

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*, projects(name)")
    .eq("id", bookingId)
    .single();
  if (!booking) return err("Booking not found", 404);
  if (booking.producer_id !== userId) return err("Only the producer can confirm", 403);
  if (booking.status !== "accepted") return err(`Cannot confirm from ${booking.status}`);

  await supabaseAdmin.from("bookings").update({
    status: "confirmed",
    confirmed_at: new Date().toISOString(),
  }).eq("id", bookingId);

  // Update role filled count
  if (booking.project_role_id) {
    const { data: role } = await supabaseAdmin.from("project_roles")
      .select("filled").eq("id", booking.project_role_id).single();
    if (role) {
      await supabaseAdmin.from("project_roles")
        .update({ filled: (role.filled || 0) + 1 }).eq("id", booking.project_role_id);
    }
  }

  const producerName = await getDisplayName(booking.producer_id);
  await notifyBookingConfirmed(booking.tech_id, producerName, booking.projects?.name || "Event", booking.total_amount);

  return NextResponse.json({ status: "confirmed" });
}

// ── Invoice/Prepaid confirm (producer, → paid directly) ────────────

async function handleInvoiceConfirm(userId: string, body: any) {
  const { bookingId } = body;
  if (!bookingId) return err("Missing bookingId");

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*, projects(name)")
    .eq("id", bookingId)
    .single();
  if (!booking) return err("Booking not found", 404);
  if (booking.producer_id !== userId) return err("Only the producer can confirm", 403);
  if (booking.status !== "accepted") return err(`Cannot confirm from ${booking.status}`);

  // Verify producer actually has invoice/prepaid billing
  const { data: producerProfile } = await supabaseAdmin
    .from("profiles")
    .select("billing_type, invoice_approved, invoice_credit_limit")
    .eq("id", userId)
    .single();

  const bt = producerProfile?.billing_type;
  if (bt !== "invoice" && bt !== "prepaid") {
    return err("Account is not on invoice or prepaid billing");
  }

  // Invoice billing requires admin approval
  if (bt === "invoice" && !producerProfile?.invoice_approved) {
    return err("Invoice billing is pending admin approval. Contact support or switch to credit card billing.");
  }

  // Enforce credit limit for invoice billing
  if (bt === "invoice" && producerProfile?.invoice_credit_limit > 0) {
    const { data: unpaid } = await supabaseAdmin
      .from("bookings")
      .select("total_amount")
      .eq("producer_id", userId)
      .eq("payment_method", "invoice")
      .not("status", "in", "(cancelled,declined,completed)");
    const outstanding = (unpaid || []).reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
    if (outstanding + (booking.total_amount || 0) > producerProfile!.invoice_credit_limit) {
      return err(`This booking would exceed your invoice credit limit ($${producerProfile!.invoice_credit_limit.toLocaleString()}). Contact support to increase your limit.`);
    }
  }

  await supabaseAdmin.from("bookings").update({
    status: "paid",
    confirmed_at: new Date().toISOString(),
    payment_method: bt,
  }).eq("id", bookingId);

  // Update role filled count
  if (booking.project_role_id) {
    const { data: role } = await supabaseAdmin.from("project_roles")
      .select("filled").eq("id", booking.project_role_id).single();
    if (role) {
      await supabaseAdmin.from("project_roles")
        .update({ filled: (role.filled || 0) + 1 }).eq("id", booking.project_role_id);
    }
  }

  const producerName = await getDisplayName(booking.producer_id);
  await notifyBookingConfirmed(booking.tech_id, producerName, booking.projects?.name || "Event", booking.total_amount);

  return NextResponse.json({ status: "paid", billingType: bt });
}

// ── Complete (producer only, triggers XP + payout) ─────────────────

async function handleComplete(userId: string, body: any) {
  const { bookingId } = body;
  if (!bookingId) return err("Missing bookingId");

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*, projects(name)")
    .eq("id", bookingId)
    .single();
  if (!booking) return err("Booking not found", 404);
  if (booking.producer_id !== userId) return err("Only the producer can complete", 403);
  if (booking.status !== "paid") return err(`Cannot complete from ${booking.status}`);

  await supabaseAdmin.from("bookings").update({
    status: "completed",
    completed_at: new Date().toISOString(),
  }).eq("id", bookingId);

  // Award XP
  await processGigCompletion(booking.tech_id);

  // Notify tech
  const producerName = await getDisplayName(booking.producer_id);
  await notifyGigCompleted(booking.tech_id, producerName, booking.projects?.name || "Event", booking.total_amount);

  // Trigger payout (fire-and-forget, internal call)
  const origin = req_origin(body);
  if (origin) {
    fetch(`${origin}/api/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    }).catch(() => {});
  }

  return NextResponse.json({ status: "completed" });
}

// ── Cancel (either party) ──────────────────────────────────────────

async function handleCancel(userId: string, body: any) {
  const { bookingId } = body;
  if (!bookingId) return err("Missing bookingId");

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (!booking) return err("Booking not found", 404);

  // Either party can cancel
  if (booking.producer_id !== userId && booking.tech_id !== userId) {
    return err("Not authorized", 403);
  }

  if (booking.status !== "pending" && booking.status !== "accepted") {
    return err(`Cannot cancel from ${booking.status}`);
  }

  await supabaseAdmin.from("bookings").update({
    status: "cancelled",
  }).eq("id", bookingId);

  return NextResponse.json({ status: "cancelled" });
}

// ── Check In (tech only) ──────────────────────────────────────────

async function handleCheckIn(userId: string, body: any) {
  const { bookingId } = body;
  if (!bookingId) return err("Missing bookingId");

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (!booking) return err("Booking not found", 404);
  if (booking.tech_id !== userId) return err("Only the tech can check in", 403);
  if (booking.status !== "paid") return err("Booking must be paid to check in");
  if (booking.checked_in_at) return err("Already checked in");

  await supabaseAdmin.from("bookings").update({
    checked_in_at: new Date().toISOString(),
  }).eq("id", bookingId);

  return NextResponse.json({ status: "checked_in" });
}

// ── Check Out (tech only) ─────────────────────────────────────────

async function handleCheckOut(userId: string, body: any) {
  const { bookingId } = body;
  if (!bookingId) return err("Missing bookingId");

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (!booking) return err("Booking not found", 404);
  if (booking.tech_id !== userId) return err("Only the tech can check out", 403);
  if (booking.status !== "paid") return err("Booking must be paid to check out");
  if (!booking.checked_in_at) return err("Must check in before checking out");

  const checkedIn = new Date(booking.checked_in_at);
  const now = new Date();
  const hours = Math.round(((now.getTime() - checkedIn.getTime()) / 3600000) * 10) / 10;

  await supabaseAdmin.from("bookings").update({
    checked_out_at: now.toISOString(),
    actual_hours: hours,
  }).eq("id", bookingId);

  return NextResponse.json({ status: "checked_out", actualHours: hours });
}

// ── Review (producer only) ────────────────────────────────────────

async function handleReview(userId: string, body: any) {
  const { bookingId, overall, skill, punctuality, professionalism, communication, text } = body;
  if (!bookingId || !overall) return err("Missing required review fields");

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (!booking) return err("Booking not found", 404);
  if (booking.producer_id !== userId) return err("Only the producer can review", 403);
  if (booking.status !== "completed") return err("Booking must be completed to review");
  if (booking.reviewed) return err("Already reviewed");

  // Create review
  await supabaseAdmin.from("reviews").insert({
    booking_id: bookingId,
    tech_id: booking.tech_id,
    reviewer_id: userId,
    overall_rating: overall,
    skill_rating: skill || overall,
    punctuality_rating: punctuality || overall,
    professionalism_rating: professionalism || overall,
    communication_rating: communication || overall,
    text: text || null,
  });

  // Mark booking as reviewed
  await supabaseAdmin.from("bookings").update({ reviewed: true }).eq("id", bookingId);

  // Process XP and recalculate ratings
  await processReview(booking.tech_id, overall);

  // Notify tech
  const producerName = await getDisplayName(userId);
  await notifyReviewReceived(booking.tech_id, producerName, overall);

  return NextResponse.json({ status: "reviewed" });
}

// ── Helpers ───────────────────────────────────────────────────────

async function getDisplayName(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("profiles").select("display_name").eq("id", userId).single();
  return data?.display_name || "User";
}

function req_origin(_body: any): string | null {
  return process.env.NEXT_PUBLIC_SITE_URL || null;
}
