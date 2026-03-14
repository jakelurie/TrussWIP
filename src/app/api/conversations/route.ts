import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 30 });

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthUser(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await client.auth.getUser(token);
  return user?.id || null;
}

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const userId = await getAuthUser(req);
  if (!userId) return err("Unauthorized", 401);

  const { recipientId } = await req.json();
  if (!recipientId || typeof recipientId !== "string") {
    return err("recipientId required");
  }
  if (recipientId === userId) return err("Cannot message yourself");

  // Verify recipient exists
  const { data: recipient } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", recipientId)
    .single();
  if (!recipient) return err("User not found", 404);

  // Check for existing conversation between these two users
  const { data: myConvos } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (myConvos && myConvos.length > 0) {
    const convoIds = myConvos.map(c => c.conversation_id);
    const { data: shared } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", recipientId)
      .in("conversation_id", convoIds);

    if (shared && shared.length > 0) {
      return NextResponse.json({
        conversationId: shared[0].conversation_id,
        existing: true,
      });
    }
  }

  // Create new conversation
  const { data: convo, error: convoErr } = await supabaseAdmin
    .from("conversations")
    .insert({ last_message_time: new Date().toISOString() })
    .select("id")
    .single();
  if (convoErr || !convo) return err("Failed to create conversation", 500);

  // Add both participants
  const { error: partErr } = await supabaseAdmin
    .from("conversation_participants")
    .insert([
      { conversation_id: convo.id, user_id: userId },
      { conversation_id: convo.id, user_id: recipientId },
    ]);
  if (partErr) return err("Failed to add participants", 500);

  return NextResponse.json({ conversationId: convo.id, existing: false });
}
