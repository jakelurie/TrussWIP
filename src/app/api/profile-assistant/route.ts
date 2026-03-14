import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { action } = body;

  // Fetch the tech's profile data
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name, primary_skill, skills, city, cities")
    .eq("id", user.id)
    .single();

  const { data: techProfile } = await supabaseAdmin
    .from("tech_profiles")
    .select("bio, years_experience, specializations, gear, completed_gigs, avg_rating, career_highlights")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const context = buildContext(profile, techProfile);

  const client = new Anthropic({ apiKey });

  if (action === "generate_bio") {
    const { tone } = body; // "professional", "conversational", "technical"
    const prompt = buildBioPrompt(context, tone || "professional");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ bio: text.trim() });
  }

  if (action === "improve_bio") {
    const { currentBio } = body;
    if (!currentBio) return NextResponse.json({ error: "No bio provided" }, { status: 400 });

    const prompt = buildImproveBioPrompt(context, currentBio);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ bio: text.trim() });
  }

  if (action === "suggest_highlights") {
    const prompt = buildHighlightsPrompt(context);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ suggestions: text.trim() });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

function buildContext(profile: any, techProfile: any): string {
  const parts: string[] = [];
  if (profile.display_name) parts.push(`Name: ${profile.display_name}`);
  if (profile.primary_skill) parts.push(`Primary Role: ${profile.primary_skill}`);
  if (profile.skills?.length) parts.push(`Additional Roles: ${profile.skills.join(", ")}`);
  const cities = profile.cities?.length ? profile.cities : profile.city ? [profile.city] : [];
  if (cities.length) parts.push(`Location: ${cities.join(", ")}`);
  if (techProfile?.years_experience) parts.push(`Experience: ${techProfile.years_experience} years`);
  if (techProfile?.specializations?.length) parts.push(`Specializations: ${techProfile.specializations.join(", ")}`);
  if (techProfile?.gear) parts.push(`Gear: ${techProfile.gear}`);
  if (techProfile?.completed_gigs) parts.push(`Completed Gigs: ${techProfile.completed_gigs}`);
  if (techProfile?.avg_rating) parts.push(`Rating: ${techProfile.avg_rating}/5`);
  if (techProfile?.career_highlights?.length) {
    const highlights = techProfile.career_highlights.map((h: any) => `${h.title} (${h.year})`).join(", ");
    parts.push(`Notable Credits: ${highlights}`);
  }
  return parts.join("\n");
}

function buildBioPrompt(context: string, tone: string): string {
  const toneGuide = tone === "conversational"
    ? "Write in a friendly, approachable first-person voice. Keep it warm but still professional."
    : tone === "technical"
    ? "Emphasize technical expertise, specific equipment proficiency, and system design capabilities. Authoritative tone."
    : "Write in a confident, professional first-person voice. Factual and direct.";

  return `You are writing a bio for a freelance AV technician's profile on Truss, a marketplace for corporate AV techs and event producers.

${toneGuide}

Rules:
- Write in first person
- 2-4 sentences, 50-150 words
- Focus on what makes this tech valuable to hire
- Mention specific skills, experience, and specializations naturally
- Do NOT use emoji, hashtags, or exclamation marks
- Do NOT start with "I am" or "My name is"
- Do NOT use buzzwords like "passionate", "dedicated", or "innovative"
- Sound like an experienced AV professional, not a LinkedIn post
- If years of experience are provided, mention them

Tech's profile data:
${context}

Write the bio now. Return only the bio text, nothing else.`;
}

function buildImproveBioPrompt(context: string, currentBio: string): string {
  return `You are improving an AV technician's bio for their profile on Truss, a marketplace for corporate AV techs and event producers.

Current bio:
"${currentBio}"

Tech's profile data:
${context}

Rules:
- Keep the same general message and tone but make it stronger
- Fix grammar and awkward phrasing
- Make it more concise if it's too long (target 50-150 words)
- Add specifics from their profile data that are missing
- Do NOT use emoji, hashtags, or exclamation marks
- Do NOT use buzzwords like "passionate", "dedicated", or "innovative"
- Keep it in first person
- Sound like an experienced AV professional

Return only the improved bio text, nothing else.`;
}

function buildHighlightsPrompt(context: string): string {
  return `Based on this AV technician's profile, suggest 3 career highlights they might want to add to their profile. These should be the kinds of achievements that impress event producers.

Tech's profile data:
${context}

For each suggestion, provide a brief title (e.g., "500+ Corporate Events") and a one-line description. Format each as:
**Title** — Description

Focus on quantifiable achievements, notable venue types, or skill milestones that would be realistic for someone with this experience level. Do not fabricate specific event names or companies.

Return only the 3 suggestions, nothing else.`;
}
