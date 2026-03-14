"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ─── Event Types ─────────────────────────────────────────────
type EventType =
  | "corporate_general"
  | "concert"
  | "trade_show"
  | "broadcast"
  | "gala"
  | "conference"
  | "hybrid"
  | "festival";

const EVENT_TYPES: { id: EventType; label: string; description: string }[] = [
  {
    id: "corporate_general",
    label: "Corporate General Session",
    description: "Keynotes, presentations, panel discussions in a ballroom or convention hall",
  },
  {
    id: "concert",
    label: "Concert / Live Music",
    description: "Live music performance with PA, lighting, and staging",
  },
  {
    id: "trade_show",
    label: "Trade Show / Expo",
    description: "Exhibition floor with booths, demos, and breakout sessions",
  },
  {
    id: "broadcast",
    label: "Broadcast / Livestream",
    description: "Multi-camera production for live broadcast or streaming",
  },
  {
    id: "gala",
    label: "Gala / Awards",
    description: "Formal dinner event with stage, AV, and entertainment",
  },
  {
    id: "conference",
    label: "Multi-Day Conference",
    description: "Multiple tracks, breakout rooms, and a main stage over 2+ days",
  },
  {
    id: "hybrid",
    label: "Hybrid Event",
    description: "In-person event with virtual/remote audience component",
  },
  {
    id: "festival",
    label: "Festival / Outdoor",
    description: "Multi-stage outdoor event with independent audio/video systems",
  },
];

// ─── Complexity ──────────────────────────────────────────────
type Complexity = "basic" | "standard" | "premium";

const COMPLEXITY_OPTIONS: { id: Complexity; label: string; description: string }[] = [
  { id: "basic", label: "Basic", description: "Straightforward setup, minimal custom work" },
  { id: "standard", label: "Standard", description: "Industry-standard production value" },
  { id: "premium", label: "Premium", description: "High-end, complex production with custom builds" },
];

// ─── Crew Role Output ────────────────────────────────────────
interface CrewRole {
  role: string;
  shortName: string;
  count: number;
  department: string;
  note?: string;
}

interface GearRec {
  item: string;
  category: string;
  note?: string;
}

interface ShowResult {
  crew: CrewRole[];
  gear: GearRec[];
  loadInHours: number;
  strikeHours: number;
  totalCrewDays: number;
  notes: string[];
}

// ─── Calculator Logic ────────────────────────────────────────
function calculateShow(
  eventType: EventType,
  audience: number,
  complexity: Complexity,
  days: number,
  breakouts: number,
  screens: number,
  cameras: number,
  wireless: number,
  hasLiveMusic: boolean,
  hasStreaming: boolean,
  isOutdoor: boolean,
): ShowResult {
  const crew: CrewRole[] = [];
  const gear: GearRec[] = [];
  const notes: string[] = [];
  const cx = complexity === "basic" ? 0 : complexity === "standard" ? 1 : 2;

  // ── AUDIO ──
  // A1 — always at least 1
  crew.push({ role: "Audio Engineer", shortName: "A1", count: 1, department: "Audio" });

  // A2 — scales with audience and wireless count
  let a2Count = 0;
  if (audience > 100 || wireless > 4) a2Count = 1;
  if (audience > 500 || wireless > 12) a2Count = 2;
  if (audience > 2000) a2Count = 3;
  if (a2Count > 0) {
    crew.push({ role: "Audio Technician", shortName: "A2", count: a2Count, department: "Audio" });
  }

  // Additional A2 for RF — large wireless counts
  if (wireless > 16 || (wireless > 8 && cx >= 2)) {
    crew.push({
      role: "Audio Technician (RF)",
      shortName: "A2",
      count: 1,
      department: "Audio",
      note: `${wireless} wireless channels — dedicated RF coordination recommended`,
    });
  }

  // Additional A1 for monitors — concerts and large music events
  if (hasLiveMusic && (audience > 300 || cx >= 1)) {
    crew.push({ role: "Audio Engineer (Monitors)", shortName: "A1", count: 1, department: "Audio", note: "Dedicated monitor mix for performers" });
  }

  // ── VIDEO ──
  // V1 — if any screens or cameras
  if (screens > 0 || cameras > 0) {
    crew.push({ role: "Video Engineer", shortName: "V1", count: 1, department: "Video" });
  }

  // V2 — large screen counts or complex video
  if (screens > 2 || (cameras > 2 && cx >= 1)) {
    crew.push({ role: "Video Technician", shortName: "V2", count: Math.min(Math.ceil((screens - 2) / 3) + (cameras > 4 ? 1 : 0), 4), department: "Video" });
  }

  // Camera Operators
  if (cameras > 0) {
    crew.push({ role: "Camera Operator", shortName: "CAM", count: cameras, department: "Video" });
  }

  // LED Tech — large screen setups
  if (screens > 0 && cx >= 2) {
    crew.push({ role: "LED Technician", shortName: "LED", count: Math.ceil(screens / 3), department: "Video", note: "LED wall build and calibration" });
  }

  // Graphics/Playback Operator — premium events with content
  if (screens > 0 && cx >= 1 && eventType !== "concert") {
    crew.push({ role: "Graphics/Playback Operator", shortName: "GFX", count: 1, department: "Video", note: "Graphics/content playback and switching" });
  }

  // ── LIGHTING ──
  let ldCount = 0;
  if (eventType === "concert" || eventType === "gala" || eventType === "festival") {
    ldCount = 1;
  } else if (audience > 200 || cx >= 1) {
    ldCount = 1;
  }
  if (ldCount > 0) {
    crew.push({ role: "Lighting Designer/Director", shortName: "L1", count: ldCount, department: "Lighting" });
  }

  // L2 / Lighting Tech
  let l2Count = 0;
  if (eventType === "concert" || eventType === "festival") {
    l2Count = audience > 1000 ? 2 : 1;
  } else if (audience > 500 || cx >= 2) {
    l2Count = 1;
  }
  if (l2Count > 0) {
    crew.push({ role: "Lighting Technician", shortName: "L2", count: l2Count, department: "Lighting" });
  }

  // Spot Ops — galas, concerts, large corporate
  if ((eventType === "gala" || eventType === "concert") && audience > 300) {
    const spotCount = audience > 1500 ? 4 : audience > 500 ? 2 : 1;
    crew.push({ role: "Spot Operator", shortName: "SPOT", count: spotCount, department: "Lighting" });
  }

  // ── STAGING ──
  if (eventType === "concert" || eventType === "festival" || (audience > 500 && cx >= 1)) {
    crew.push({ role: "Technical Director", shortName: "TD", count: 1, department: "Production", note: "Show calling and department coordination" });
  }

  if ((eventType === "concert" || eventType === "festival") && audience > 1000) {
    const riggers = cx >= 2 ? 4 : 2;
    crew.push({ role: "Stagehand (Rigging)", shortName: "SH", count: riggers, department: "Staging", note: "For truss, motors, and overhead points" });
  }

  // Stagehands — general labor
  let stagehandCount = 0;
  if (audience <= 200) stagehandCount = cx >= 1 ? 2 : 0;
  else if (audience <= 500) stagehandCount = 2 + cx;
  else if (audience <= 1500) stagehandCount = 4 + cx * 2;
  else stagehandCount = 6 + cx * 3;
  if (stagehandCount > 0) {
    crew.push({ role: "Stagehand", shortName: "SH", count: stagehandCount, department: "Staging", note: "Load-in, strike, and show labor" });
  }

  // ── BROADCAST / STREAMING ──
  if (hasStreaming || eventType === "broadcast" || eventType === "hybrid") {
    crew.push({ role: "Streaming Technician", shortName: "STR", count: 1, department: "Video", note: "Encoder, streaming platform, and remote feed management" });
    if (cameras === 0) {
      // Need at least 1 camera for streaming
      crew.push({ role: "Camera Operator", shortName: "CAM", count: 1, department: "Video", note: "Minimum 1 camera for stream/broadcast" });
    }
    if (eventType === "broadcast") {
      crew.push({ role: "Technical Director", shortName: "TD", count: 1, department: "Video", note: "Directs camera switching and broadcast output" });
      if (cx >= 1) {
        crew.push({ role: "Graphics Operator", shortName: "GFX", count: 1, department: "Video", note: "Lower thirds, bumpers, and broadcast graphics" });
      }
    }
  }

  // ── BREAKOUTS ──
  if (breakouts > 0) {
    // Each breakout room needs basic AV coverage
    const breakoutA2 = Math.ceil(breakouts / 3); // 1 A2 per 3 rooms
    const breakoutV2 = breakouts > 3 ? Math.ceil(breakouts / 4) : (breakouts > 0 ? 1 : 0);
    crew.push({ role: "Breakout Audio Tech", shortName: "A2", count: breakoutA2, department: "Audio", note: `Covering ${breakouts} breakout room${breakouts > 1 ? "s" : ""}` });
    if (screens > 0) {
      crew.push({ role: "Breakout Video Tech", shortName: "V2", count: breakoutV2, department: "Video", note: `Covering ${breakouts} breakout room${breakouts > 1 ? "s" : ""}` });
    }
    notes.push(`${breakouts} breakout room${breakouts > 1 ? "s" : ""} — consider walkies and a tech lead for room coordination.`);
  }

  // ── POWER ──
  if (isOutdoor || eventType === "festival" || (audience > 1500 && cx >= 2)) {
    crew.push({ role: "Power/Electrical Tech", shortName: "PWR", count: isOutdoor ? 2 : 1, department: "Staging", note: isOutdoor ? "Generator tie-in and distro" : "Power distribution and monitoring" });
  }

  // ── LEAD TECH ──
  if (days > 1 || breakouts > 3 || (audience > 1000 && cx >= 1)) {
    crew.push({ role: "Lead Technician", shortName: "LEAD", count: 1, department: "Staging", note: "On-site crew coordinator and point of contact" });
  }

  // ── TELEPROMPTER ──
  if ((eventType === "corporate_general" || eventType === "broadcast") && cx >= 1) {
    crew.push({ role: "Teleprompter Operator", shortName: "TP", count: 1, department: "Video" });
  }

  // ─── GEAR RECOMMENDATIONS ─────────────────────────────────
  // Audio
  if (audience <= 100) {
    gear.push({ item: "Compact line array or powered speakers", category: "Audio", note: "e.g. QSC KLA, JBL VTX A8" });
  } else if (audience <= 500) {
    gear.push({ item: "Medium line array", category: "Audio", note: "e.g. d&b E-Series, JBL VTX A12, L-Acoustics A10" });
  } else if (audience <= 2000) {
    gear.push({ item: "Large line array", category: "Audio", note: "e.g. d&b V/J-Series, L-Acoustics K2, Meyer PANTHER" });
  } else {
    gear.push({ item: "Full-scale PA system", category: "Audio", note: "e.g. L-Acoustics K1/K2, d&b GSL/KSL, Meyer LYON" });
  }

  if (wireless > 0) {
    const wirelessTier = wireless > 16 ? "Shure Axient Digital or Sennheiser EM 6000" : wireless > 8 ? "Shure ULXD or Sennheiser EW-DX" : "Shure ULXD or Sennheiser EW-D";
    gear.push({ item: `${wireless}x wireless channels`, category: "Audio", note: wirelessTier });
  }

  const consoleSize = audience > 1000 ? "Large-format digital console" : audience > 300 ? "Mid-format digital console" : "Compact digital console";
  const consoleSugg = audience > 1000 ? "e.g. DiGiCo SD10, Yamaha CL5, A&H dLive" : audience > 300 ? "e.g. Yamaha CL3/CL5, DiGiCo SD12" : "e.g. Yamaha QL1/TF, Allen & Heath SQ";
  gear.push({ item: consoleSize, category: "Audio", note: consoleSugg });

  // Video
  if (screens > 0) {
    if (cx >= 2) {
      gear.push({ item: `${screens}x LED wall${screens > 1 ? "s" : ""}`, category: "Video", note: "ROE, Absen, or similar — specify pixel pitch for viewing distance" });
    } else {
      gear.push({ item: `${screens}x projection screen${screens > 1 ? "s" : ""}`, category: "Video", note: audience > 500 ? "15K+ lumen projectors recommended" : "8K–12K lumen projectors" });
    }
    gear.push({ item: "Video switcher/processor", category: "Video", note: cx >= 2 ? "e.g. Barco E2, Analog Way Aquilon" : "e.g. Barco S3, Analog Way Midra" });
  }

  if (cameras > 0) {
    gear.push({ item: `${cameras}x camera${cameras > 1 ? "s" : ""} + tripods`, category: "Video", note: cameras > 3 ? "Consider jib or steadicam for variety" : "PTZ cameras can supplement for breakouts" });
  }

  // Lighting
  if (ldCount > 0 || l2Count > 0) {
    if (eventType === "concert" || eventType === "festival") {
      gear.push({ item: "Moving head wash + spot fixtures", category: "Lighting", note: "e.g. Robe BMFL, Martin ERA, Claypaky" });
      gear.push({ item: "Lighting console", category: "Lighting", note: "e.g. grandMA3, ChamSys MQ, ETC Eos" });
    } else {
      gear.push({ item: "Stage wash + uplighting", category: "Lighting", note: cx >= 2 ? "Intelligent fixtures + color wash" : "LED pars and ellipsoidals" });
      if (cx >= 1) {
        gear.push({ item: "Lighting console", category: "Lighting", note: "e.g. ETC Ion/Eos, ChamSys" });
      }
    }
  }

  // Comms
  if (crew.reduce((t, c) => t + c.count, 0) > 5) {
    gear.push({ item: "Intercom/comms system", category: "Comms", note: "Clearcom, RTS, or radio walkies for crew coordination" });
  }

  // Streaming
  if (hasStreaming || eventType === "broadcast" || eventType === "hybrid") {
    gear.push({ item: "Streaming encoder", category: "Streaming", note: "e.g. vMix, OBS, Livestream Studio, AWS Elemental" });
    if (eventType === "hybrid") {
      gear.push({ item: "Virtual event platform", category: "Streaming", note: "e.g. Zoom Webinar, Hopin, or custom RTMP endpoint" });
    }
  }

  // Power
  if (isOutdoor) {
    gear.push({ item: "Generator + power distro", category: "Power", note: "Size based on total draw — use the Power Calculator tool" });
  }

  // ─── TIMING ────────────────────────────────────────────────
  let loadInHours = 4; // baseline
  if (audience > 500) loadInHours = 6;
  if (audience > 1500) loadInHours = 8;
  if (eventType === "concert" || eventType === "festival") loadInHours += 2;
  if (cx >= 2) loadInHours += 2;
  if (isOutdoor) loadInHours += 2;
  if (breakouts > 3) loadInHours += 2;

  const strikeHours = Math.ceil(loadInHours * 0.6);

  // ─── NOTES ─────────────────────────────────────────────────
  if (audience > 1000) {
    notes.push("For 1,000+ audience, book a pre-production meeting with your lead tech at least 2 weeks out.");
  }
  if (isOutdoor) {
    notes.push("Outdoor events need weather contingency plans — covers for FOH, backup generator protocol, and rain delays.");
  }
  if (days > 1) {
    notes.push(`Multi-day show (${days} days) — consider overnight security for gear and staggered crew calls.`);
  }
  if (hasLiveMusic && wireless > 8) {
    notes.push("With live music and 8+ wireless channels, schedule a dedicated RF coordination window during load-in.");
  }
  if (eventType === "hybrid" || hasStreaming) {
    notes.push("Run a full technical rehearsal for the stream at least 2 hours before doors.");
  }

  // Merge duplicate shortNames (e.g., multiple A2 entries for main + breakouts)
  // Keep them separate for clarity — they show different notes

  const totalCrewDays = crew.reduce((t, c) => t + c.count, 0) * days;

  return { crew, gear, loadInHours, strikeHours, totalCrewDays, notes };
}

// ─── Component ───────────────────────────────────────────────
export default function ShowCalculator() {
  const [eventType, setEventType] = useState<EventType>("corporate_general");
  const [audience, setAudience] = useState(300);
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [days, setDays] = useState(1);
  const [breakouts, setBreakouts] = useState(0);
  const [screens, setScreens] = useState(2);
  const [cameras, setCameras] = useState(0);
  const [wireless, setWireless] = useState(8);
  const [hasLiveMusic, setHasLiveMusic] = useState(false);
  const [hasStreaming, setHasStreaming] = useState(false);
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Set sensible defaults when event type changes
  function handleEventTypeChange(type: EventType) {
    setEventType(type);
    setShowResults(false);
    switch (type) {
      case "corporate_general":
        setAudience(300); setScreens(2); setCameras(0); setWireless(8);
        setHasLiveMusic(false); setHasStreaming(false); setIsOutdoor(false);
        break;
      case "concert":
        setAudience(800); setScreens(2); setCameras(0); setWireless(12);
        setHasLiveMusic(true); setHasStreaming(false); setIsOutdoor(false);
        break;
      case "trade_show":
        setAudience(500); setScreens(1); setCameras(0); setWireless(4);
        setHasLiveMusic(false); setHasStreaming(false); setIsOutdoor(false); setBreakouts(4);
        break;
      case "broadcast":
        setAudience(200); setScreens(2); setCameras(3); setWireless(8);
        setHasLiveMusic(false); setHasStreaming(true); setIsOutdoor(false);
        break;
      case "gala":
        setAudience(400); setScreens(2); setCameras(0); setWireless(6);
        setHasLiveMusic(true); setHasStreaming(false); setIsOutdoor(false);
        break;
      case "conference":
        setAudience(500); setScreens(2); setCameras(0); setWireless(12);
        setHasLiveMusic(false); setHasStreaming(false); setIsOutdoor(false);
        setBreakouts(6); setDays(3);
        break;
      case "hybrid":
        setAudience(300); setScreens(2); setCameras(2); setWireless(8);
        setHasLiveMusic(false); setHasStreaming(true); setIsOutdoor(false);
        break;
      case "festival":
        setAudience(2000); setScreens(4); setCameras(2); setWireless(24);
        setHasLiveMusic(true); setHasStreaming(false); setIsOutdoor(true); setDays(2);
        break;
    }
  }

  const result = useMemo(() => {
    if (!showResults) return null;
    return calculateShow(eventType, audience, complexity, days, breakouts, screens, cameras, wireless, hasLiveMusic, hasStreaming, isOutdoor);
  }, [showResults, eventType, audience, complexity, days, breakouts, screens, cameras, wireless, hasLiveMusic, hasStreaming, isOutdoor]);

  // Group crew by department
  const crewByDept = useMemo(() => {
    if (!result) return {};
    const grouped: Record<string, CrewRole[]> = {};
    for (const c of result.crew) {
      if (!grouped[c.department]) grouped[c.department] = [];
      grouped[c.department].push(c);
    }
    return grouped;
  }, [result]);

  // Group gear by category
  const gearByCat = useMemo(() => {
    if (!result) return {};
    const grouped: Record<string, GearRec[]> = {};
    for (const g of result.gear) {
      if (!grouped[g.category]) grouped[g.category] = [];
      grouped[g.category].push(g);
    }
    return grouped;
  }, [result]);

  const inputCls =
    "w-full bg-blackout border border-ink/[0.06] rounded-lg px-3 py-2.5 text-sm text-house-lights focus:border-signal-orange/40 focus:outline-none transition-colors";
  const labelCls = "block text-xs font-mono text-aluminum/60 tracking-wider uppercase mb-1.5";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-2">
        <Link
          href="/resources"
          className="text-[11px] font-mono text-aluminum/40 hover:text-signal-orange transition-colors tracking-wider uppercase"
        >
          &larr; Resources
        </Link>
      </div>
      <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
        SHOW <span className="text-signal-orange">CALCULATOR</span>
      </h1>
      <p className="text-sm text-aluminum/60 mb-8 max-w-2xl">
        Input your event details and get crew and gear recommendations. Adjust
        the parameters to match your show, then hit Calculate.
      </p>

      {/* ── INPUT FORM ── */}
      <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-6 mb-8">
        {/* Event Type */}
        <div className="mb-6">
          <label className={labelCls}>Event Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.id}
                onClick={() => handleEventTypeChange(et.id)}
                className={`px-3 py-2.5 rounded-lg border text-xs font-mono text-left transition-all ${
                  eventType === et.id
                    ? "border-signal-orange/40 bg-signal-orange/[0.08] text-signal-orange"
                    : "border-ink/[0.06] text-aluminum/60 hover:border-ink/[0.12]"
                }`}
              >
                {et.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-aluminum/40 mt-2">
            {EVENT_TYPES.find((e) => e.id === eventType)?.description}
          </p>
        </div>

        {/* Complexity */}
        <div className="mb-6">
          <label className={labelCls}>Production Level</label>
          <div className="grid grid-cols-3 gap-2">
            {COMPLEXITY_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => { setComplexity(c.id); setShowResults(false); }}
                className={`px-3 py-2.5 rounded-lg border text-xs font-mono text-center transition-all ${
                  complexity === c.id
                    ? "border-signal-orange/40 bg-signal-orange/[0.08] text-signal-orange"
                    : "border-ink/[0.06] text-aluminum/60 hover:border-ink/[0.12]"
                }`}
              >
                <div className="font-bold">{c.label}</div>
                <div className="text-[10px] opacity-60 mt-0.5">{c.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Number inputs row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <label className={labelCls}>Audience Size</label>
            <input
              type="number"
              min={10}
              max={50000}
              value={audience}
              onChange={(e) => { setAudience(Number(e.target.value) || 10); setShowResults(false); }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Show Days</label>
            <input
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(e) => { setDays(Number(e.target.value) || 1); setShowResults(false); }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Breakout Rooms</label>
            <input
              type="number"
              min={0}
              max={30}
              value={breakouts}
              onChange={(e) => { setBreakouts(Number(e.target.value) || 0); setShowResults(false); }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Screens / Displays</label>
            <input
              type="number"
              min={0}
              max={20}
              value={screens}
              onChange={(e) => { setScreens(Number(e.target.value) || 0); setShowResults(false); }}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <label className={labelCls}>Cameras</label>
            <input
              type="number"
              min={0}
              max={12}
              value={cameras}
              onChange={(e) => { setCameras(Number(e.target.value) || 0); setShowResults(false); }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Wireless Channels</label>
            <input
              type="number"
              min={0}
              max={64}
              value={wireless}
              onChange={(e) => { setWireless(Number(e.target.value) || 0); setShowResults(false); }}
              className={inputCls}
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: "Live Music", value: hasLiveMusic, set: setHasLiveMusic },
            { label: "Streaming / Virtual", value: hasStreaming, set: setHasStreaming },
            { label: "Outdoor", value: isOutdoor, set: setIsOutdoor },
          ].map((toggle) => (
            <button
              key={toggle.label}
              onClick={() => { toggle.set(!toggle.value); setShowResults(false); }}
              className={`px-4 py-2 rounded-lg border text-xs font-mono transition-all ${
                toggle.value
                  ? "border-signal-orange/40 bg-signal-orange/[0.08] text-signal-orange"
                  : "border-ink/[0.06] text-aluminum/60 hover:border-ink/[0.12]"
              }`}
            >
              {toggle.value ? "+" : ""} {toggle.label}
            </button>
          ))}
        </div>

        {/* Calculate Button */}
        <button
          onClick={() => setShowResults(true)}
          className="w-full sm:w-auto px-10 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
        >
          Calculate Crew & Gear
        </button>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Crew", value: result.crew.reduce((t, c) => t + c.count, 0) },
              { label: "Crew-Days", value: result.totalCrewDays },
              { label: "Load-In", value: `${result.loadInHours}h` },
              { label: "Strike", value: `${result.strikeHours}h` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-4 text-center"
              >
                <div className="font-heading text-2xl font-bold text-signal-orange">
                  {stat.value}
                </div>
                <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Crew Recommendations */}
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-6">
            <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
              Crew Recommendations
            </h2>
            <div className="space-y-5">
              {Object.entries(crewByDept).map(([dept, roles]) => (
                <div key={dept}>
                  <h3 className="text-xs font-mono text-signal-orange/70 tracking-widest uppercase mb-2">
                    {dept}
                  </h3>
                  <div className="space-y-1.5">
                    {roles.map((c, i) => (
                      <div
                        key={`${c.shortName}-${i}`}
                        className="flex items-start justify-between gap-3 py-2 border-b border-ink/[0.03] last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-signal-orange font-bold">
                              {c.count}x
                            </span>
                            <span className="text-sm text-house-lights">
                              {c.role}
                            </span>
                            <span className="text-[10px] font-mono text-aluminum/40">
                              ({c.shortName})
                            </span>
                          </div>
                          {c.note && (
                            <p className="text-[11px] text-aluminum/50 mt-0.5 ml-7">
                              {c.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gear Recommendations */}
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-6">
            <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
              Gear Recommendations
            </h2>
            <div className="space-y-5">
              {Object.entries(gearByCat).map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="text-xs font-mono text-signal-orange/70 tracking-widest uppercase mb-2">
                    {cat}
                  </h3>
                  <div className="space-y-1.5">
                    {items.map((g, i) => (
                      <div
                        key={i}
                        className="py-2 border-b border-ink/[0.03] last:border-0"
                      >
                        <div className="text-sm text-house-lights">{g.item}</div>
                        {g.note && (
                          <p className="text-[11px] text-aluminum/50 mt-0.5">
                            {g.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {result.notes.length > 0 && (
            <div className="bg-deep-stage/40 border border-signal-orange/10 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-3">
                Production Notes
              </h2>
              <ul className="space-y-2">
                {result.notes.map((note, i) => (
                  <li key={i} className="flex gap-2 text-sm text-aluminum/70">
                    <span className="text-signal-orange mt-0.5 shrink-0">&bull;</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="text-center py-8 border-t border-ink/[0.03]">
            <h2 className="font-heading text-xl font-bold tracking-tight mb-2">
              Need This Crew on <span className="text-signal-orange">Truss</span>?
            </h2>
            <p className="text-xs text-aluminum/50 mb-4 max-w-md mx-auto">
              Find and book qualified AV technicians for your next event.
              Every role above is searchable on the Truss marketplace.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/browse"
                className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-xs tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
              >
                Browse Techs
              </Link>
              <Link
                href="/signup?type=producer"
                className="px-6 py-3 border border-signal-orange/30 text-signal-orange font-heading font-bold text-xs tracking-[3px] uppercase rounded-xl hover:bg-signal-orange/[0.06] transition-all"
              >
                Post a Project
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-12 pt-6 border-t border-ink/[0.03]">
        <p className="text-[10px] text-aluminum/30 leading-relaxed max-w-2xl">
          Estimates are guidelines based on common industry configurations. Actual crew and gear
          requirements vary by venue, content complexity, union jurisdiction, and production company
          standards. Always consult with your lead technician or production manager for final crew plans.
          Truss does not guarantee the accuracy of these recommendations.
        </p>
      </div>
    </main>
  );
}
