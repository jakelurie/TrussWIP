import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Parses natural language search into structured filters for the browse page
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const { query } = await req.json();
  if (!query || typeof query !== "string" || query.length < 3) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Parse this AV crew search query into structured filters. Return ONLY valid JSON, no other text.

Query: "${query}"

Valid role shortNames: A1, A2, RF, MON, DSP, V1, V2, GFX, CAM, PB, LED, PROJ, L1, L2, SPOT, LP, SH, RIG, SM, PWR, CARP, NET, BRK, IT, TD, SC, LT, TP, PM

Valid cities: New York, Los Angeles, Chicago, Las Vegas, Orlando, Dallas, San Francisco, San Diego, Atlanta, Nashville, Washington DC, Boston, Miami, Denver, Seattle, Austin, Phoenix, Portland, Minneapolis, Detroit, Philadelphia, Houston, Charlotte, Salt Lake City, New Orleans

Return JSON with these optional fields:
{
  "roles": ["A1"],           // array of role shortNames mentioned
  "city": "San Diego",       // city name if mentioned
  "maxRate": 75,             // max hourly rate if mentioned
  "minRate": null,           // min hourly rate if mentioned
  "available": true,         // true if they want available-now techs
  "count": 2,                // number of techs needed if mentioned
  "date": "2026-03-15",     // date if mentioned (YYYY-MM-DD)
  "specializations": [],     // any specializations mentioned (FOH Mixing, RF Coordination, LED Wall, etc.)
  "searchText": ""           // any remaining text for name/keyword search
}

Only include fields that are explicitly mentioned. Omit fields that aren't mentioned.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ filters: {} });
  }

  try {
    const filters = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ filters });
  } catch {
    return NextResponse.json({ filters: {} });
  }
}
