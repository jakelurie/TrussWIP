"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Connector Data ──────────────────────────────────────────

interface Connector {
  id: string;
  name: string;
  aliases: string[];
  category: "audio" | "video" | "data" | "power" | "hybrid";
  signal: string;
  pins: string;
  impedance?: string;
  maxDistance?: string;
  common_uses: string[];
  pinout?: string[];
  notes?: string;
  gender?: string;
}

const CONNECTORS: Connector[] = [
  // ─── AUDIO ───
  {
    id: "xlr3",
    name: "XLR-3",
    aliases: ["XLR", "Cannon", "3-pin XLR"],
    category: "audio",
    signal: "Analog balanced audio",
    pins: "3 pins",
    impedance: "50–200 Ω (mic level), 600 Ω (line level)",
    maxDistance: "300 ft (100 m) typical",
    common_uses: ["Microphones", "Line-level audio", "Intercom", "DMX (lighting)"],
    pinout: ["Pin 1: Ground / Shield", "Pin 2: Hot (+)", "Pin 3: Cold (−)"],
    notes: "The universal standard for professional audio. Always wire pin 2 hot per AES standard. Locking connector.",
    gender: "Male (output) / Female (input)",
  },
  {
    id: "xlr5",
    name: "XLR-5",
    aliases: ["5-pin XLR", "DMX connector"],
    category: "audio",
    signal: "DMX512 / Dual-channel audio",
    pins: "5 pins",
    common_uses: ["DMX512 lighting control", "Dual-channel intercom", "Stereo microphones"],
    pinout: ["Pin 1: Ground", "Pin 2: Data 1−", "Pin 3: Data 1+", "Pin 4: Data 2− (optional)", "Pin 5: Data 2+ (optional)"],
    notes: "Required by DMX512 spec but 3-pin XLR is commonly used instead. 5-pin is the correct connector for DMX.",
    gender: "Male (output) / Female (input)",
  },
  {
    id: "trs-quarter",
    name: '1/4" TRS',
    aliases: ["Quarter-inch", "Phone plug", "6.35mm TRS"],
    category: "audio",
    signal: "Balanced audio or stereo unbalanced",
    pins: "3 conductors (Tip, Ring, Sleeve)",
    impedance: "Varies",
    maxDistance: "25 ft (8 m) unbalanced, 100 ft (30 m) balanced",
    common_uses: ["Headphones", "Balanced line connections", "Insert sends/returns", "Guitar/instrument"],
    pinout: ["Tip: Hot (+) or Left", "Ring: Cold (−) or Right", "Sleeve: Ground"],
    notes: "TRS = Tip/Ring/Sleeve (balanced or stereo). TS = Tip/Sleeve (unbalanced mono). Not a locking connector — avoid in high-movement environments.",
  },
  {
    id: "ts-quarter",
    name: '1/4" TS',
    aliases: ["Quarter-inch mono", "Guitar cable", "Instrument cable"],
    category: "audio",
    signal: "Unbalanced mono audio",
    pins: "2 conductors (Tip, Sleeve)",
    maxDistance: "25 ft (8 m)",
    common_uses: ["Electric guitar/bass", "Keyboards", "Unbalanced line connections", "Speaker connections (legacy)"],
    pinout: ["Tip: Signal (+)", "Sleeve: Ground"],
    notes: "Never use for speaker connections on modern systems — use speakON instead. Susceptible to noise on long runs.",
  },
  {
    id: "speakon-nl4",
    name: "speakON NL4",
    aliases: ["NL4", "Neutrik speakON", "NL4FC"],
    category: "audio",
    signal: "Speaker-level audio",
    pins: "4 pins",
    common_uses: ["Passive speakers", "Bi-amped speakers", "Amplifier outputs"],
    pinout: ["1+: Speaker + (hot)", "1−: Speaker − (return)", "2+: High frequency + (bi-amp)", "2−: High frequency − (bi-amp)"],
    notes: "Locking connector designed for high-current speaker signals. Twist-lock prevents accidental disconnection. Always use for speaker connections.",
    gender: "Panel-mount (speaker) / Cable-mount",
  },
  {
    id: "speakon-nl8",
    name: "speakON NL8",
    aliases: ["NL8", "8-pole speakON"],
    category: "audio",
    signal: "Multi-channel speaker-level audio",
    pins: "8 pins (4 channels)",
    common_uses: ["Quad-amped speakers", "Multi-way speaker systems", "Line arrays"],
    pinout: ["1+/1−: Channel 1", "2+/2−: Channel 2", "3+/3−: Channel 3", "4+/4−: Channel 4"],
    notes: "Used for multi-channel speaker connections. Common in line array systems where one cable carries all frequency bands.",
  },
  {
    id: "trs-eighth",
    name: '3.5mm TRS',
    aliases: ["Mini jack", "Aux", "1/8 inch", "Headphone jack"],
    category: "audio",
    signal: "Stereo unbalanced audio",
    pins: "3 conductors",
    maxDistance: "6 ft (2 m)",
    common_uses: ["Consumer headphones", "Laptop audio", "Aux input/output", "Lavalier microphones"],
    pinout: ["Tip: Left / Hot", "Ring: Right / Cold", "Sleeve: Ground"],
    notes: "Consumer standard. In pro AV, primarily seen on lavalier mics (varies by manufacturer — check pinout before adapting).",
  },
  {
    id: "rca",
    name: "RCA",
    aliases: ["Phono", "Cinch", "RCA jack"],
    category: "audio",
    signal: "Unbalanced audio or composite video",
    pins: "2 conductors",
    maxDistance: "25 ft (8 m)",
    common_uses: ["Consumer audio", "DJ mixers", "CD players", "S/PDIF digital audio (orange)"],
    pinout: ["Center pin: Signal", "Outer ring: Ground"],
    notes: "Consumer connector. Red = right audio, white = left audio. Orange RCA carries S/PDIF digital audio at 75Ω coax.",
  },
  // ─── VIDEO ───
  {
    id: "hdmi",
    name: "HDMI",
    aliases: ["HDMI Type A", "HDMI 2.0", "HDMI 2.1"],
    category: "video",
    signal: "Digital audio/video",
    pins: "19 pins",
    maxDistance: "50 ft (15 m) passive, 300+ ft with active/fiber",
    common_uses: ["Displays", "Projectors", "Cameras", "Playback devices", "Confidence monitors"],
    notes: "Most common digital AV connector. HDMI 2.0 supports 4K@60Hz. HDMI 2.1 supports 8K@60Hz/4K@120Hz. Use active cables or fiber HDMI for runs over 50 ft. HDCP can cause handshake issues.",
  },
  {
    id: "sdi",
    name: "SDI (BNC)",
    aliases: ["HD-SDI", "3G-SDI", "12G-SDI", "BNC"],
    category: "video",
    signal: "Serial digital video",
    pins: "1 conductor (coaxial)",
    impedance: "75 Ω",
    maxDistance: "300 ft (100 m) for 3G-SDI, 200 ft for 12G",
    common_uses: ["Broadcast cameras", "Video routers", "IMAG", "LED processors", "Video walls"],
    pinout: ["Center: Signal", "Shield: Ground"],
    notes: "Professional broadcast standard. BNC locking connector on 75Ω coax (typically Belden 1694A or equivalent). No HDCP — the pro AV advantage. 3G = 1080p60, 12G = 4K@60.",
    gender: "BNC male on cable / BNC female on device",
  },
  {
    id: "displayport",
    name: "DisplayPort",
    aliases: ["DP", "DP 1.4", "DP 2.0"],
    category: "video",
    signal: "Digital audio/video",
    pins: "20 pins",
    maxDistance: "10 ft (3 m) passive, longer with active",
    common_uses: ["Computer displays", "LED wall processors", "Presentation switchers"],
    notes: "Higher bandwidth than HDMI. DP 1.4 supports 8K@30Hz or 4K@120Hz. Often used in corporate AV for computer connections. Latching clip prevents accidental disconnection.",
  },
  {
    id: "dvi",
    name: "DVI",
    aliases: ["DVI-D", "DVI-I", "DVI-A"],
    category: "video",
    signal: "Digital and/or analog video",
    pins: "Up to 29 pins",
    maxDistance: "15 ft (5 m) single link",
    common_uses: ["Legacy displays", "Projectors", "KVM switches"],
    notes: "Being replaced by HDMI and DisplayPort. DVI-D = digital only. DVI-I = digital + analog. DVI-A = analog only. Single-link max 1920x1200, dual-link max 2560x1600.",
  },
  {
    id: "vga",
    name: "VGA (DE-15)",
    aliases: ["D-Sub 15", "HD15", "RGB", "Analog video"],
    category: "video",
    signal: "Analog RGB video",
    pins: "15 pins",
    maxDistance: "25 ft (8 m) without booster",
    common_uses: ["Legacy projectors", "Older laptops", "KVM switches"],
    notes: "Analog standard being phased out. Still encountered on older corporate equipment and venues. Use a quality cable with individual coax for each color for best results.",
  },
  // ─── DATA ───
  {
    id: "ethercon",
    name: "etherCON",
    aliases: ["Neutrik etherCON", "Locking RJ45"],
    category: "data",
    signal: "Ethernet / Dante / AES67 / NDI / Art-Net",
    pins: "8 pins (RJ45 inside)",
    maxDistance: "328 ft (100 m) per run",
    common_uses: ["Dante audio networking", "AES67", "Art-Net / sACN lighting", "NDI video", "Network control"],
    notes: "Ruggedized locking RJ45 housing. Standard in touring and live events. Use Cat6 or Cat6A for Dante. Always use shielded cable (STP) for AV networking.",
  },
  {
    id: "rj45",
    name: "RJ45",
    aliases: ["Ethernet", "Cat5e", "Cat6", "Network cable"],
    category: "data",
    signal: "Ethernet / Data networking",
    pins: "8 pins",
    maxDistance: "328 ft (100 m) per run",
    common_uses: ["Network switches", "PoE devices", "Control systems (Crestron/Extron)", "IP cameras"],
    pinout: ["T568B: Wh/Or, Or, Wh/Gr, Bl, Wh/Bl, Gr, Wh/Br, Br"],
    notes: "T568B is the US standard for straight-through cables. Cat5e supports gigabit. Cat6 supports 10GbE up to 55m. Cat6A supports 10GbE to 100m.",
  },
  {
    id: "fiber-opticalcon",
    name: "opticalCON",
    aliases: ["Neutrik opticalCON", "LC fiber in shell"],
    category: "data",
    signal: "Fiber optic (singlemode or multimode)",
    pins: "LC duplex inside ruggedized shell",
    maxDistance: "1000+ ft (300+ m) multimode, miles for singlemode",
    common_uses: ["Long-distance Dante", "SDI over fiber", "HDMI over fiber", "Network backbone"],
    notes: "Ruggedized fiber connector for touring. Singlemode for very long runs (>300m). Multimode for typical event distances. Always use dust caps when not connected.",
  },
  {
    id: "usb-c",
    name: "USB-C",
    aliases: ["USB Type-C", "Thunderbolt 3/4"],
    category: "data",
    signal: "USB / Thunderbolt / DisplayPort Alt Mode / Power",
    pins: "24 pins",
    maxDistance: "6–13 ft (2–4 m) passive",
    common_uses: ["Laptop connections", "Webcams", "USB audio interfaces", "Thunderbolt devices", "Charging"],
    notes: "Reversible connector. Capabilities vary widely by cable and device — not all USB-C cables support video, Thunderbolt, or high wattage charging. Always verify cable rating.",
  },
  {
    id: "usb-a",
    name: "USB-A",
    aliases: ["USB Type-A", "Standard USB"],
    category: "data",
    signal: "USB data / power",
    pins: "4 pins (USB 2.0) or 9 pins (USB 3.0)",
    maxDistance: "16 ft (5 m)",
    common_uses: ["USB drives", "Wireless mic receivers", "Control surfaces", "Charging"],
    notes: "USB 3.0 ports and cables are typically blue inside. For runs over 16 ft, use an active USB extender or USB-over-Ethernet adapter.",
  },
  {
    id: "usb-b",
    name: "USB-B",
    aliases: ["USB Type-B", "Printer USB"],
    category: "data",
    signal: "USB data",
    pins: "4 pins",
    maxDistance: "16 ft (5 m)",
    common_uses: ["Audio interfaces", "MIDI controllers", "Printers", "Mixers with USB recording"],
    notes: "Square connector typically on the device side. Common on digital mixing consoles for multitrack recording.",
  },
  // ─── POWER ───
  {
    id: "powercon-20a",
    name: "powerCON 20A (Blue/Gray)",
    aliases: ["Neutrik powerCON", "NAC3FCA", "NAC3FCB"],
    category: "power",
    signal: "AC mains power (20A)",
    pins: "3 pins",
    common_uses: ["Powered speakers", "Amplifiers", "LED fixtures", "Rack power distribution"],
    notes: "Blue = input (power in). Gray = output (power through/out). Locking connector rated for 20A / 250V AC. Do NOT connect or disconnect under load.",
    gender: "Blue (NAC3FCA) = line in / Gray (NAC3FCB) = line out",
  },
  {
    id: "powercon-true1",
    name: "powerCON TRUE1",
    aliases: ["TRUE1", "NAC3FX-W", "Neutrik TRUE1"],
    category: "power",
    signal: "AC mains power (16A/20A)",
    pins: "3 pins",
    common_uses: ["Newer powered speakers", "LED fixtures", "Power distribution"],
    notes: "Successor to powerCON 20A. Can be connected and disconnected under load (hot-pluggable). IP65 rated when mated. Not backwards compatible with original powerCON.",
    gender: "TOP (line in) / TOP (line out) — keyed differently",
  },
  {
    id: "edison",
    name: "Edison (NEMA 5-15)",
    aliases: ["Standard outlet", "Household plug", "NEMA 5-15P/R"],
    category: "power",
    signal: "AC mains power (15A / 120V)",
    pins: "3 prongs",
    common_uses: ["General equipment power", "Laptops", "Consumer gear", "Extension cords"],
    notes: "Standard US household plug. 15A at 120V = 1800W max. Hot (narrow blade), neutral (wide blade), ground (round pin). Always use grounded connections for AV equipment.",
  },
  {
    id: "l6-20",
    name: "L6-20 (Twist-Lock)",
    aliases: ["NEMA L6-20", "20A 240V twist-lock"],
    category: "power",
    signal: "AC mains power (20A / 208–240V)",
    pins: "3 prongs (twist-lock)",
    common_uses: ["Large amplifiers", "LED walls", "Power distros", "Dimmer racks"],
    notes: "Twist-lock prevents accidental disconnection. 208V (3-phase) or 240V (single-phase split). Common on company switch / venue power. 20A at 208V = 4160W max.",
  },
  {
    id: "l6-30",
    name: "L6-30 (Twist-Lock)",
    aliases: ["NEMA L6-30", "30A 240V twist-lock"],
    category: "power",
    signal: "AC mains power (30A / 208–240V)",
    pins: "3 prongs (twist-lock)",
    common_uses: ["Dimmer racks", "Motor controllers", "Large LED walls", "Main power feeds"],
    notes: "30A at 208V = 6240W max. Often used for dimmer packs and main power distribution. Verify voltage (208V vs 240V) before connecting equipment.",
  },
  {
    id: "camlock",
    name: "Cam-Lock (Single Pole)",
    aliases: ["Cam connector", "Single-pole", "Camlock"],
    category: "power",
    signal: "High-current AC power (200A–400A)",
    pins: "1 per connector (5 used for 3-phase + neutral + ground)",
    common_uses: ["Main power feeds", "Generator connections", "Touring power distribution"],
    notes: "Color coded: Black/Red/Blue = phases, White = neutral, Green = ground. ONLY to be handled by qualified electricians. Typical for 200A or 400A service. Always verify phase rotation.",
    gender: "Male (source) / Female (load)",
  },
  // ─── HYBRID ───
  {
    id: "socapex",
    name: "SOCAPEX (19-pin)",
    aliases: ["Soca", "SOCP", "19-pin multi"],
    category: "hybrid",
    signal: "6 circuits of power (multi-cable)",
    pins: "19 pins",
    common_uses: ["Lighting dimmer runs", "LED fixture power", "Multi-circuit power distribution"],
    notes: "Carries 6 circuits of 20A power in a single connector. Standard in theatrical and concert lighting. Breakout cables fan out to 6x Edison or powerCON.",
  },
  {
    id: "w4-opticalcon",
    name: "opticalCON MTP",
    aliases: ["opticalCON QUAD", "MTP fiber"],
    category: "hybrid",
    signal: "Multi-strand fiber optic",
    pins: "4, 12, or 24 fibers",
    common_uses: ["Large-scale video transport", "LED wall fiber", "Broadcast truck connections"],
    notes: "Multiple fiber strands in one ruggedized connector. Used for high-channel-count fiber runs in broadcast and large-format events.",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  audio: "Audio",
  video: "Video",
  data: "Data & Network",
  power: "Power",
  hybrid: "Multi-Circuit / Hybrid",
};

const CATEGORY_COLORS: Record<string, string> = {
  audio: "var(--color-signal-orange)",
  video: "var(--color-cue-blue)",
  data: "var(--color-go-green)",
  power: "var(--color-standby-amber)",
  hybrid: "#9B59B6",
};

// ─── Main Component ──────────────────────────────────────────

export default function CableBible() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = CONNECTORS.filter((c) => {
    if (categoryFilter && c.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.aliases.some((a) => a.toLowerCase().includes(q)) ||
        c.signal.toLowerCase().includes(q) ||
        c.common_uses.some((u) => u.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const grouped = filtered.reduce<Record<string, Connector[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <Link
          href="/resources"
          className="inline-block text-[11px] font-mono text-aluminum/60 hover:text-signal-orange transition-colors mb-4"
        >
          &larr; Resources
        </Link>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
          <span className="text-signal-orange">CABLE BIBLE</span>
          <br />
          <span className="text-xl md:text-2xl text-house-lights/80">
            AV Connector Reference
          </span>
        </h1>
        <p className="text-sm text-aluminum/65 mt-3 max-w-xl mx-auto">
          Every connector you&apos;ll encounter in live events and corporate AV.
          Pinouts, specs, max distances, and field notes.
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connectors, signals, uses..."
            className="w-full px-4 py-2.5 bg-deep-stage/40 border border-ink/[0.06] rounded-lg text-sm text-house-lights outline-none focus:border-signal-orange/20 transition-colors pl-9"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-aluminum/40 text-sm">
            &#x2315;
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
              !categoryFilter
                ? "bg-ink/[0.06] text-house-lights border border-white/10"
                : "text-aluminum/50 hover:text-aluminum"
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                setCategoryFilter(categoryFilter === key ? "" : key)
              }
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                categoryFilter === key
                  ? "border"
                  : "text-aluminum/50 hover:text-aluminum"
              }`}
              style={
                categoryFilter === key
                  ? {
                      color: CATEGORY_COLORS[key],
                      borderColor: `${CATEGORY_COLORS[key]}40`,
                      background: `${CATEGORY_COLORS[key]}10`,
                    }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-[10px] font-mono text-aluminum/40 mb-4">
        {filtered.length} connector{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Connector list */}
      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        return (
          <div key={cat} className="mb-8">
            <h2
              className="font-heading text-sm font-semibold tracking-widest uppercase mb-3"
              style={{ color: CATEGORY_COLORS[cat] }}
            >
              {label}
            </h2>
            <div className="space-y-2">
              {items.map((c) => {
                const isOpen = expanded === c.id;
                return (
                  <div
                    key={c.id}
                    className="rounded-xl bg-deep-stage/40 border border-ink/[0.05] overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpanded(isOpen ? null : c.id)
                      }
                      className="w-full flex items-start gap-4 p-4 text-left group hover:bg-ink/[0.01] transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[c.category] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading text-sm font-bold tracking-wide group-hover:text-signal-orange transition-colors">
                            {c.name}
                          </h3>
                          <span className="text-[10px] text-aluminum/40 font-mono">
                            {c.aliases[0] !== c.name ? c.aliases[0] : c.aliases[1] || ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-aluminum/60 mt-0.5">
                          {c.signal} &middot; {c.pins}
                          {c.maxDistance && ` · Max ${c.maxDistance}`}
                        </p>
                      </div>
                      <span
                        className={`text-aluminum/50 text-lg transition-transform mt-0.5 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      >
                        &rsaquo;
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pl-10">
                        {/* Specs grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          <div>
                            <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase">
                              Signal
                            </div>
                            <div className="text-xs text-house-lights/80 mt-0.5">
                              {c.signal}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase">
                              Pins
                            </div>
                            <div className="text-xs text-house-lights/80 mt-0.5">
                              {c.pins}
                            </div>
                          </div>
                          {c.impedance && (
                            <div>
                              <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase">
                                Impedance
                              </div>
                              <div className="text-xs text-house-lights/80 mt-0.5">
                                {c.impedance}
                              </div>
                            </div>
                          )}
                          {c.maxDistance && (
                            <div>
                              <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase">
                                Max Distance
                              </div>
                              <div className="text-xs text-house-lights/80 mt-0.5">
                                {c.maxDistance}
                              </div>
                            </div>
                          )}
                          {c.gender && (
                            <div>
                              <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase">
                                Gender
                              </div>
                              <div className="text-xs text-house-lights/80 mt-0.5">
                                {c.gender}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Common uses */}
                        <div className="mb-3">
                          <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1.5">
                            Common Uses
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {c.common_uses.map((u) => (
                              <span
                                key={u}
                                className="px-2 py-0.5 bg-ink/[0.03] text-aluminum/60 text-[10px] font-mono rounded border border-ink/[0.04]"
                              >
                                {u}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Pinout */}
                        {c.pinout && (
                          <div className="mb-3">
                            <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1.5">
                              Pinout
                            </div>
                            <div className="bg-blackout/60 rounded-lg p-3 space-y-1">
                              {c.pinout.map((pin) => (
                                <div
                                  key={pin}
                                  className="text-[11px] font-mono text-house-lights/60"
                                >
                                  {pin}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {c.notes && (
                          <div className="bg-signal-orange/[0.03] border border-signal-orange/10 rounded-lg p-3">
                            <div className="text-[9px] font-mono text-signal-orange/50 tracking-wider uppercase mb-1">
                              Field Notes
                            </div>
                            <p className="text-[11px] text-aluminum/60 leading-relaxed">
                              {c.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
          <div className="font-heading text-lg text-aluminum/60 mb-2">
            No connectors match
          </div>
          <p className="text-xs text-aluminum/40">
            Try a different search term or clear your filter.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-10 px-4 py-3 rounded-lg bg-standby-amber/5 border border-standby-amber/15 text-[11px] text-standby-amber/70 font-mono leading-relaxed">
        This reference is for general educational purposes. Always verify
        pinouts and ratings against manufacturer specifications before making
        connections. Improper wiring can damage equipment or create safety
        hazards.
      </div>

      {/* CTA */}
      <section className="text-center py-12 mt-8 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Know Your Cables.{" "}
          <span className="text-signal-orange">Get Booked.</span>
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          Showcase your technical knowledge and gear proficiency on your Truss
          profile. Producers are looking for techs who know their connectors.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
        >
          Create Your Profile — Free
        </Link>
      </section>
    </main>
  );
}
