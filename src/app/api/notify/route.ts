import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  sendBookingRequestEmail,
  sendBookingAcceptedEmail,
  sendBookingConfirmedEmail,
  sendBookingDeclinedEmail,
  sendGigCompletedEmail,
  sendReviewReceivedEmail,
  sendLevelUpEmail,
  sendGigReminderEmail,
} from "@/lib/email";
import { smsBookingRequest, smsBookingAccepted } from "@/lib/sms";

const PREF_MAP: Record<string, string> = {
  booking_request: "booking_requests_email",
  booking_accepted: "booking_updates_email",
  booking_confirmed: "booking_updates_email",
  booking_declined: "booking_updates_email",
  gig_completed: "booking_updates_email",
  gig_reminder: "booking_updates_email",
  review_received: "reviews_email",
  level_up: "system_email",
  payment: "system_email",
};

async function shouldSendEmail(userId: string | undefined, type: string): Promise<boolean> {
  if (!userId) return true;
  const prefKey = PREF_MAP[type];
  if (!prefKey) return true;

  const { data } = await supabaseAdmin
    .from("notification_preferences")
    .select(prefKey)
    .eq("user_id", userId)
    .single();

  // No preferences row = default to sending
  if (!data) return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)[prefKey] !== false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ...data } = body;

    // Check notification preferences
    const emailAllowed = await shouldSendEmail(data.recipientId, type);
    if (!emailAllowed) {
      return NextResponse.json({ success: true, skipped: "email_preference" });
    }

    switch (type) {
      case "booking_request":
        await sendBookingRequestEmail(
          data.toEmail, data.techName, data.producerName,
          data.projectName, data.rate, data.hours, data.total
        );
        if (data.phone) await smsBookingRequest(data.phone, data.producerName, data.projectName);
        break;

      case "booking_accepted":
        await sendBookingAcceptedEmail(
          data.toEmail, data.producerName, data.techName,
          data.projectName, data.total
        );
        if (data.phone) await smsBookingAccepted(data.phone, data.techName, data.projectName);
        break;

      case "booking_confirmed":
        await sendBookingConfirmedEmail(
          data.toEmail, data.techName, data.producerName,
          data.projectName, data.total
        );
        break;

      case "booking_declined":
        await sendBookingDeclinedEmail(
          data.toEmail, data.producerName, data.techName,
          data.projectName
        );
        break;

      case "gig_completed":
        await sendGigCompletedEmail(
          data.toEmail, data.techName, data.producerName,
          data.projectName, data.total
        );
        break;

      case "review_received":
        await sendReviewReceivedEmail(
          data.toEmail, data.techName, data.producerName,
          data.rating
        );
        break;

      case "level_up":
        await sendLevelUpEmail(
          data.toEmail, data.techName, data.newLevel, data.levelNumber
        );
        break;

      case "gig_reminder":
        await sendGigReminderEmail(
          data.toEmail, data.techName, data.projectName,
          data.venue, data.city, data.startDate, data.role
        );
        break;

      default:
        return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Notification failed" }, { status: 500 });
  }
}
