import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendGigReminderEmail } from "@/lib/email";
import { smsGigReminder } from "@/lib/sms";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin;

  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Find projects starting tomorrow
  const { data: tomorrowProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("start_date", tomorrowStr);

  if (!tomorrowProjects || tomorrowProjects.length === 0) {
    return NextResponse.json({ success: true, date: tomorrowStr, found: 0, sent: 0, errors: 0 });
  }

  const projectIds = tomorrowProjects.map(p => p.id);

  // Find confirmed/paid bookings for those projects
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, tech_id, projects(name, city, venue, start_date), project_roles(skill)")
    .in("status", ["confirmed", "paid"])
    .in("project_id", projectIds);

  if (error) {
    console.error("Cron reminders query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let errors = 0;

  for (const booking of bookings || []) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name, phone")
        .eq("id", booking.tech_id)
        .single();

      if (!profile?.email) continue;

      const project = booking.projects as any;
      const role = booking.project_roles as any;

      await sendGigReminderEmail(
        profile.email,
        profile.display_name || "Tech",
        project?.name || "Event",
        project?.venue || "",
        project?.city || "",
        project?.start_date || tomorrowStr,
        role?.skill || "Tech"
      );

      // SMS
      if (profile.phone) {
        await smsGigReminder(profile.phone, project?.name || "Event", project?.venue || "", project?.city || "");
      }

      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: booking.tech_id,
        type: "gig_reminder",
        title: "Gig Tomorrow",
        message: `Reminder: ${project?.name || "Event"} is tomorrow at ${project?.venue || project?.city || "your venue"}`,
        link: "/bookings",
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send reminder for booking ${(booking as any).id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ success: true, date: tomorrowStr, found: (bookings || []).length, sent, errors });
}
