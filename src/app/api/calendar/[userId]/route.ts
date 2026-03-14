import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function formatICalDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function formatICalDateNextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0].replace(/-/g, "");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const supabase = supabaseAdmin;

  // Verify token
  const { data: profile } = await supabase
    .from("profiles")
    .select("calendar_token, display_name")
    .eq("id", userId)
    .single();

  if (!profile || profile.calendar_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Fetch confirmed/paid bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, rate, total_hours, total_amount, projects(name, city, venue, start_date, end_date), project_roles(skill)")
    .eq("tech_id", userId)
    .in("status", ["confirmed", "paid"]);

  const events = (bookings || [])
    .filter((b: any) => b.projects?.start_date)
    .map((b: any) => {
      const startDate = formatICalDate(b.projects.start_date);
      const endDate = b.projects.end_date
        ? formatICalDateNextDay(b.projects.end_date)
        : formatICalDateNextDay(b.projects.start_date);

      const summary = `${b.projects.name}${b.project_roles?.skill ? ` (${b.project_roles.skill})` : ""}`;
      const location = [b.projects.venue, b.projects.city].filter(Boolean).join(", ");
      const description = [
        b.project_roles?.skill ? `Role: ${b.project_roles.skill}` : "",
        b.rate ? `Rate: $${b.rate}/hr` : "",
        b.total_hours ? `Hours: ${b.total_hours}` : "",
        b.total_amount ? `Total: $${b.total_amount}` : "",
      ].filter(Boolean).join("\\n");

      return [
        "BEGIN:VEVENT",
        `UID:${b.id}@trusswork.org`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${escapeICalText(summary)}`,
        location ? `LOCATION:${escapeICalText(location)}` : "",
        description ? `DESCRIPTION:${escapeICalText(description)}` : "",
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ].filter(Boolean).join("\r\n");
    });

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Truss//Gig Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Truss Gigs - ${profile.display_name || "Tech"}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="truss-gigs.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
