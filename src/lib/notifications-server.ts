import { supabaseAdmin } from "./supabase-admin";
import {
  sendBookingRequestEmail,
  sendBookingAcceptedEmail,
  sendBookingConfirmedEmail,
  sendBookingDeclinedEmail,
  sendGigCompletedEmail,
  sendReviewReceivedEmail,
  sendLevelUpEmail,
} from "./email";
import { smsBookingRequest, smsBookingAccepted } from "./sms";

// Notification preference check
const PREF_MAP: Record<string, string> = {
  booking_request: "booking_requests_email",
  booking_accepted: "booking_updates_email",
  booking_confirmed: "booking_updates_email",
  booking_declined: "booking_updates_email",
  gig_completed: "booking_updates_email",
  review_received: "reviews_email",
  level_up: "system_email",
};

async function shouldSendEmail(userId: string, type: string): Promise<boolean> {
  const prefKey = PREF_MAP[type];
  if (!prefKey) return true;
  const { data } = await supabaseAdmin
    .from("notification_preferences")
    .select(prefKey)
    .eq("user_id", userId)
    .single();
  if (!data) return true;
  return (data as any)[prefKey] !== false;
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
  });
}

async function getUserContact(userId: string): Promise<{ email: string | null; phone: string | null }> {
  const { data } = await supabaseAdmin.from("profiles").select("email, phone").eq("id", userId).single();
  return { email: data?.email || null, phone: data?.phone || null };
}

async function getUserName(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("profiles").select("display_name").eq("id", userId).single();
  return data?.display_name || "User";
}

export async function notifyBookingRequest(
  techId: string,
  producerName: string,
  projectName: string,
  bookingId: string,
  rate?: number,
  hours?: number,
  total?: number
) {
  await createNotification(
    techId, "booking_request", "New Booking Request",
    `${producerName} wants to book you for ${projectName}`, "/bookings"
  );

  const { email, phone } = await getUserContact(techId);
  const techName = await getUserName(techId);
  if (email && await shouldSendEmail(techId, "booking_request")) {
    await sendBookingRequestEmail(email, techName, producerName, projectName, rate || 0, hours || 0, total || 0).catch(() => {});
    if (phone) await smsBookingRequest(phone, producerName, projectName).catch(() => {});
  }
}

export async function notifyBookingAccepted(
  producerId: string,
  techName: string,
  projectName: string,
  total?: number
) {
  await createNotification(
    producerId, "booking_accepted", "Booking Accepted",
    `${techName} accepted your booking for ${projectName}`, "/bookings"
  );

  const { email, phone } = await getUserContact(producerId);
  const producerName = await getUserName(producerId);
  if (email && await shouldSendEmail(producerId, "booking_accepted")) {
    await sendBookingAcceptedEmail(email, producerName, techName, projectName, total || 0).catch(() => {});
    if (phone) await smsBookingAccepted(phone, techName, projectName).catch(() => {});
  }
}

export async function notifyBookingConfirmed(
  techId: string,
  producerName: string,
  projectName: string,
  total?: number
) {
  await createNotification(
    techId, "booking_confirmed", "Booking Confirmed",
    `${producerName} confirmed your booking for ${projectName}`, "/bookings"
  );

  const { email } = await getUserContact(techId);
  const techName = await getUserName(techId);
  if (email && await shouldSendEmail(techId, "booking_confirmed")) {
    await sendBookingConfirmedEmail(email, techName, producerName, projectName, total || 0).catch(() => {});
  }
}

export async function notifyBookingDeclined(
  producerId: string,
  techName: string,
  projectName: string
) {
  await createNotification(
    producerId, "booking_declined", "Booking Declined",
    `${techName} declined your booking for ${projectName}`, "/bookings"
  );

  const { email } = await getUserContact(producerId);
  const producerName = await getUserName(producerId);
  if (email && await shouldSendEmail(producerId, "booking_declined")) {
    await sendBookingDeclinedEmail(email, producerName, techName, projectName).catch(() => {});
  }
}

export async function notifyGigCompleted(
  techId: string,
  producerName: string,
  projectName: string,
  total?: number
) {
  await createNotification(
    techId, "gig_completed", "Gig Marked Complete",
    `${producerName} marked your gig for ${projectName} as complete`, "/bookings"
  );

  const { email } = await getUserContact(techId);
  const techName = await getUserName(techId);
  if (email && await shouldSendEmail(techId, "gig_completed")) {
    await sendGigCompletedEmail(email, techName, producerName, projectName, total || 0).catch(() => {});
  }
}

export async function notifyReviewReceived(
  techId: string,
  producerName: string,
  rating: number
) {
  await createNotification(
    techId, "review_received", "New Review",
    `${producerName} left you a ${rating}★ review`, `/profile/${techId}`
  );

  const { email } = await getUserContact(techId);
  const techName = await getUserName(techId);
  if (email && await shouldSendEmail(techId, "review_received")) {
    await sendReviewReceivedEmail(email, techName, producerName, rating).catch(() => {});
  }
}

export async function notifyLevelUp(techId: string, newLevel: string, levelNumber?: number) {
  await createNotification(
    techId, "level_up", "Level Up",
    `You reached ${newLevel}. Keep crushing it.`, `/profile/${techId}`
  );

  const { email } = await getUserContact(techId);
  const techName = await getUserName(techId);
  if (email && await shouldSendEmail(techId, "level_up")) {
    await sendLevelUpEmail(email, techName, newLevel, levelNumber || 0).catch(() => {});
  }
}
