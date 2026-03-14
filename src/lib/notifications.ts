import { supabase } from "./supabase";

async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
  });
}

async function getUserContact(userId: string): Promise<{ email: string | null; phone: string | null }> {
  const { data } = await supabase.from("profiles").select("email, phone").eq("id", userId).single();
  return { email: data?.email || null, phone: data?.phone || null };
}

async function getUserName(userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("display_name").eq("id", userId).single();
  return data?.display_name || "User";
}

async function sendEmail(payload: any) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Email notification failed:", err);
    // Don't throw — email is best-effort, in-app notification is primary
  }
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
  // In-app notification
  await createNotification(
    techId, "booking_request", "New Booking Request",
    `${producerName} wants to book you for ${projectName}`, "/bookings"
  );

  // Email + SMS
  const { email, phone } = await getUserContact(techId);
  const techName = await getUserName(techId);
  if (email) {
    await sendEmail({
      type: "booking_request",
      recipientId: techId,
      toEmail: email,
      techName,
      producerName,
      projectName,
      rate: rate || 0,
      hours: hours || 0,
      total: total || 0,
      phone: phone || undefined,
    });
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
  if (email) {
    await sendEmail({
      type: "booking_accepted",
      recipientId: producerId,
      toEmail: email,
      producerName,
      techName,
      projectName,
      total: total || 0,
      phone: phone || undefined,
    });
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
  if (email) {
    await sendEmail({
      type: "booking_confirmed",
      recipientId: techId,
      toEmail: email,
      techName,
      producerName,
      projectName,
      total: total || 0,
    });
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
  if (email) {
    await sendEmail({
      type: "booking_declined",
      recipientId: producerId,
      toEmail: email,
      producerName,
      techName,
      projectName,
    });
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
  if (email) {
    await sendEmail({
      type: "gig_completed",
      recipientId: techId,
      toEmail: email,
      techName,
      producerName,
      projectName,
      total: total || 0,
    });
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
  if (email) {
    await sendEmail({
      type: "review_received",
      recipientId: techId,
      toEmail: email,
      techName,
      producerName,
      rating,
    });
  }
}

export async function notifyLevelUp(techId: string, newLevel: string, levelNumber?: number) {
  await createNotification(
    techId, "level_up", "Level Up",
    `You reached ${newLevel}. Keep crushing it.`, `/profile/${techId}`
  );

  const { email } = await getUserContact(techId);
  const techName = await getUserName(techId);
  if (email) {
    await sendEmail({
      type: "level_up",
      recipientId: techId,
      toEmail: email,
      techName,
      newLevel,
      levelNumber: levelNumber || 0,
    });
  }
}

export async function notifyGigReminder(
  techId: string,
  projectName: string,
  venue: string,
  city: string,
  startDate: string,
  role: string
) {
  await createNotification(
    techId, "gig_reminder", "Gig Tomorrow",
    `Reminder: ${projectName} is tomorrow at ${venue || city || "your venue"}`, "/bookings"
  );

  const { email } = await getUserContact(techId);
  const techName = await getUserName(techId);
  if (email) {
    await sendEmail({
      type: "gig_reminder",
      recipientId: techId,
      toEmail: email,
      techName,
      projectName,
      venue,
      city,
      startDate,
      role,
    });
  }
}