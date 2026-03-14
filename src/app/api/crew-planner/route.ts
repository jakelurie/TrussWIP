import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const { description } = await req.json();
  if (!description || typeof description !== "string" || description.length < 10) {
    return NextResponse.json({ error: "Description too short" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are an expert AV production manager. Based on this event description, create a detailed crew plan.

Event description: "${description}"

Return ONLY valid JSON with this structure:
{
  "eventSummary": "Brief 1-sentence summary of the event",
  "crew": [
    {
      "role": "A1",
      "title": "Audio Engineer",
      "count": 1,
      "department": "Audio",
      "rationale": "Why this role is needed"
    }
  ],
  "gear": [
    {
      "item": "Item name",
      "category": "Audio|Video|Lighting|Staging|Comms|Power",
      "note": "Brief specification note"
    }
  ],
  "timeline": {
    "loadInHours": 8,
    "rehearsalHours": 2,
    "strikeHours": 4
  },
  "notes": ["Important production note 1", "Note 2"],
  "estimatedCrewDays": 15
}

Valid role codes: A1, A2, V1, V2, GFX, CAM, LED, PROJ, L1, L2, SPOT, SH, PWR, CARP, NET, BRK, IT, TD, LT, TP, PM

Rules:
- Be specific and realistic. Corporate AV professionals will read this.
- Scale crew appropriately for the event size and complexity.
- Include stagehands for load-in/strike if the event warrants it.
- Include a Lead Tech or TD for events with 5+ crew.
- Include additional A2s for RF coordination on 12+ wireless channels.
- Include power/electrical for outdoor events or large indoor with heavy draws.
- Gear recommendations should reference real industry equipment (d&b, L-Acoustics, Shure, DiGiCo, Barco, etc.)
- Notes should be actionable production advice.
- estimatedCrewDays = sum of all crew counts × number of show days.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }

  try {
    const plan = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "Failed to parse plan" }, { status: 500 });
  }
}
