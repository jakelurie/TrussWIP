import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 10 });

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Look up booking + project + tech name from DB — never trust client amounts
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*, projects(name), project_roles(skill)")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: techProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", booking.tech_id)
      .single();

    const totalAmount = booking.total_amount || 0;
    const platformFee = booking.platform_fee || Math.round(totalAmount * 0.1);
    const techName = techProfile?.display_name || "Technician";
    const projectName = booking.projects?.name || "Event";
    const skill = booking.project_roles?.skill || "Tech";
    const hours = booking.total_hours || 0;
    const rate = booking.rate || 0;

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${techName} — ${skill}`,
              description: `${projectName} · ${hours}hr @ $${rate}/hr`,
            },
            unit_amount: totalAmount * 100,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Truss Platform Fee (10%)",
              description: "Marketplace service fee",
            },
            unit_amount: platformFee * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/bookings?payment=success&booking=${bookingId}`,
      cancel_url: `${req.nextUrl.origin}/bookings?payment=cancelled&booking=${bookingId}`,
      metadata: {
        bookingId,
        projectName,
        techName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
