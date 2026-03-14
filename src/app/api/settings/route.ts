import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 20 });

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

export async function PATCH(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const user = await getUser(req);
  if (!user) return err("Unauthorized", 401);

  const body = await req.json();
  const { action, value } = body;

  switch (action) {
    case "update_profile": {
      const allowed = ["display_name", "city", "phone", "company_name"];
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (value[key] !== undefined) updates[key] = value[key];
      }
      if (Object.keys(updates).length === 0) return err("Nothing to update");
      const { error } = await supabaseAdmin
        .from("profiles").update(updates).eq("id", user.id);
      if (error) return err(error.message, 500);
      return NextResponse.json({ success: true });
    }

    case "update_email": {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: value,
      });
      if (error) return err(error.message, 500);
      await supabaseAdmin.from("profiles").update({ email: value }).eq("id", user.id);
      return NextResponse.json({ success: true });
    }

    case "update_password": {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: value,
      });
      if (error) return err(error.message, 500);
      return NextResponse.json({ success: true });
    }

    case "update_notifications": {
      const { error } = await supabaseAdmin
        .from("profiles").update({ notification_preferences: value }).eq("id", user.id);
      if (error) return err(error.message, 500);
      return NextResponse.json({ success: true });
    }

    case "update_privacy": {
      const { error } = await supabaseAdmin
        .from("profiles").update({ privacy_settings: value }).eq("id", user.id);
      if (error) return err(error.message, 500);
      return NextResponse.json({ success: true });
    }

    case "update_tech": {
      // Quick-update tech_profiles fields from settings
      const allowed = ["available", "hourly_rate", "cancellation_policy"];
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (value[key] !== undefined) updates[key] = value[key];
      }
      if (Object.keys(updates).length === 0) return err("Nothing to update");
      const { error } = await supabaseAdmin
        .from("tech_profiles").upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });
      if (error) return err(error.message, 500);
      return NextResponse.json({ success: true });
    }

    case "update_billing": {
      const allowedBilling = ["credit_card", "invoice", "prepaid"];
      if (!value?.billing_type || !allowedBilling.includes(value.billing_type)) {
        return err("Invalid billing type");
      }

      const updates: Record<string, any> = {
        billing_type: value.billing_type,
        company_name: value.company_name ?? null,
        billing_email: value.billing_email ?? null,
        billing_address: value.billing_address ?? null,
      };

      // If switching TO invoice: mark as pending approval
      if (value.billing_type === "invoice") {
        // Check if already approved
        const { data: current } = await supabaseAdmin
          .from("profiles")
          .select("billing_type, invoice_approved")
          .eq("id", user.id)
          .single();

        if (current?.billing_type !== "invoice" || !current?.invoice_approved) {
          updates.invoice_approved = false;
          updates.invoice_requested_at = new Date().toISOString();
          updates.payment_terms = value.payment_terms || "net_30";

          // Notify admins
          const { data: admins } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("is_admin", true);

          const { data: requester } = await supabaseAdmin
            .from("profiles")
            .select("display_name, company_name")
            .eq("id", user.id)
            .single();

          const requesterName = requester?.display_name || "A producer";
          const companyNote = requester?.company_name ? ` (${requester.company_name})` : "";

          for (const admin of admins || []) {
            await supabaseAdmin.from("notifications").insert({
              user_id: admin.id,
              type: "invoice_request",
              title: "Invoice Billing Request",
              message: `${requesterName}${companyNote} requested invoice billing. Review in Admin > Invoices.`,
              link: "/admin/invoices",
            });
          }
        } else {
          // Already approved — just update company info
          updates.payment_terms = value.payment_terms ?? "net_30";
        }
      } else {
        // Switching away from invoice — clear invoice fields
        updates.invoice_approved = null;
        updates.invoice_requested_at = null;
        updates.invoice_credit_limit = 0;
      }

      const { error } = await supabaseAdmin
        .from("profiles").update(updates).eq("id", user.id);
      if (error) return err("Failed to update billing", 500);
      return NextResponse.json({ success: true, pendingApproval: value.billing_type === "invoice" && updates.invoice_approved === false });
    }

    case "export_data": {
      // Pull everything associated with this user
      const [profile, techProfile, bookings, reviews, messages, notifications, favorites] = await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("id", user.id).single(),
        supabaseAdmin.from("tech_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabaseAdmin.from("bookings").select("*").or(`producer_id.eq.${user.id},tech_id.eq.${user.id}`).order("created_at", { ascending: false }),
        supabaseAdmin.from("reviews").select("*").or(`reviewer_id.eq.${user.id},tech_id.eq.${user.id}`).order("created_at", { ascending: false }),
        supabaseAdmin.from("messages").select("id, sender_id, recipient_id, created_at").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(500),
        supabaseAdmin.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
        supabaseAdmin.from("favorites").select("*").eq("producer_id", user.id),
      ]);

      return NextResponse.json({
        exported_at: new Date().toISOString(),
        profile: profile.data,
        tech_profile: techProfile.data,
        bookings: bookings.data || [],
        reviews: reviews.data || [],
        messages_count: messages.data?.length || 0,
        notifications: notifications.data || [],
        favorites: favorites.data || [],
      });
    }

    case "sign_out_all": {
      // Sign out all sessions except current
      await supabaseAdmin.auth.admin.signOut(user.id, "others");
      return NextResponse.json({ success: true });
    }

    case "delete_account": {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          deleted_at: new Date().toISOString(),
          display_name: "Deleted User",
          email: `deleted-${user.id.slice(0, 8)}@trusswork.org`,
          avatar_url: null,
          city: null,
          cities: null,
          company_name: null,
          billing_email: null,
          billing_address: null,
          bio: null,
          phone: null,
        })
        .eq("id", user.id);
      if (error) return err(error.message, 500);

      await supabaseAdmin
        .from("tech_profiles")
        .update({ bio: null, linkedin_url: null, website_url: null })
        .eq("user_id", user.id);

      return NextResponse.json({ success: true });
    }

    default:
      return err("Unknown action");
  }
}
