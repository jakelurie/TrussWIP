// SEO Landing Page Data
// Drives all /hire and /av-jobs pages via generateStaticParams().
// Add a role or city here → pages auto-generate on next build.

// ─── Types ───────────────────────────────────────────────────

export interface SeoRole {
  slug: string;
  shortName: string;
  title: string;
  department: string;
  hiringTitle: string;
  jobTitle: string;
  description: string;
  responsibilities: string[];
  commonGear: string[];
  relatedRoles: string[];
}

export interface SeoCity {
  slug: string;
  name: string;
  state: string;
  metroLabel: string;
  rateMultiplier: number;
}

// ─── Roles (21) ──────────────────────────────────────────────

export const SEO_ROLES: SeoRole[] = [
  // ── Audio ──
  {
    slug: "a1-audio-engineer",
    shortName: "A1",
    title: "A1 Audio Engineer",
    department: "Audio",
    hiringTitle: "Hire an A1 Audio Engineer",
    jobTitle: "A1 Audio Engineer Jobs",
    description:
      "An A1 Audio Engineer is the lead audio technician on a live event. They design the sound system, mix front-of-house audio, manage wireless microphones, and ensure every presenter, panelist, and performer is heard clearly. On corporate shows, the A1 is typically the highest-ranking audio professional on site.",
    responsibilities: [
      "Design and operate the front-of-house audio system",
      "Mix live audio for presenters, panels, and performances",
      "Manage wireless microphone systems and RF coordination",
      "Interface with the client and production team on audio needs",
      "Troubleshoot signal flow issues in real time during the show",
    ],
    commonGear: ["Yamaha CL/QL Series", "DiGiCo SD Series", "Shure Axient Digital", "Dante"],
    relatedRoles: ["a2-audio-technician", "show-network-engineer"],
  },
  {
    slug: "a2-audio-technician",
    shortName: "A2",
    title: "A2 Audio Technician",
    department: "Audio",
    hiringTitle: "Hire an A2 Audio Technician",
    jobTitle: "A2 Audio Technician Jobs",
    description:
      "An A2 Audio Technician supports the lead audio engineer (A1) during live events. They handle microphone placement, cable runs, patching, RF coordination, and stage audio — making sure every mic is hot and every signal path is clean. A2s are essential on any show with more than a few microphones.",
    responsibilities: [
      "Set up and strike all audio equipment and cabling",
      "Place and manage wired and wireless microphones",
      "Patch audio signals and maintain signal flow documentation",
      "Monitor and coordinate RF frequencies for wireless systems",
      "Manage intercom and IEM (in-ear monitor) systems",
    ],
    commonGear: ["Shure ULXD/Axient Digital", "Sennheiser EW-DX", "Clear-Com FreeSpeak", "Dante"],
    relatedRoles: ["a1-audio-engineer", "stagehand"],
  },

  // ── Video ──
  {
    slug: "v1-video-engineer",
    shortName: "V1",
    title: "V1 Video Engineer",
    department: "Video",
    hiringTitle: "Hire a V1 Video Engineer",
    jobTitle: "V1 Video Engineer Jobs",
    description:
      "A V1 Video Engineer is the lead video technician on a live event. They manage all video sources, operate the video switcher, and ensure seamless display across screens, LED walls, and streaming feeds. The V1 oversees signal routing, resolves technical issues, and calls camera shots on multi-camera productions.",
    responsibilities: [
      "Operate the video switcher and manage all video sources",
      "Design and manage signal routing for displays and recording",
      "Oversee LED wall, projection, and streaming outputs",
      "Coordinate with camera operators on shot selection",
      "Troubleshoot video signal and display issues during the show",
    ],
    commonGear: ["Barco E2/S3", "Analog Way Aquilon", "Blackmagic ATEM", "Ross Carbonite"],
    relatedRoles: ["v2-video-technician", "camera-operator", "led-technician"],
  },
  {
    slug: "v2-video-technician",
    shortName: "V2",
    title: "V2 Video Technician",
    department: "Video",
    hiringTitle: "Hire a V2 Video Technician",
    jobTitle: "V2 Video Technician Jobs",
    description:
      "A V2 Video Technician supports the lead video engineer (V1) during live events. They handle cable runs, display setup, signal testing, and equipment staging. V2s are hands-on with the physical infrastructure that makes the video system work.",
    responsibilities: [
      "Run and terminate video cables (SDI, HDMI, fiber)",
      "Set up and calibrate displays, monitors, and projectors",
      "Test signal paths and verify all video sources before show",
      "Assist with LED wall builds and screen rigging",
      "Manage video recording and backup systems",
    ],
    commonGear: ["SDI/HDMI distribution", "Decimator converters", "TV One scalers", "Fiber systems"],
    relatedRoles: ["v1-video-engineer", "led-technician"],
  },
  {
    slug: "graphics-playback-operator",
    shortName: "GFX",
    title: "Graphics/Playback Operator",
    department: "Video",
    hiringTitle: "Hire a Graphics/Playback Operator",
    jobTitle: "Graphics/Playback Operator Jobs",
    description:
      "A Graphics/Playback Operator runs the presentation and content playback systems during live events. They advance slides, trigger video rolls, operate lower-third graphics, and ensure every visual cue hits on time. This role requires split-second timing and calm under pressure.",
    responsibilities: [
      "Operate ProPresenter, Keynote, or PowerPoint for live presentations",
      "Trigger video playback and motion graphics on cue",
      "Build and operate lower-third graphics and IMAG overlays",
      "Manage content ingest and file format compatibility",
      "Coordinate with the technical director on show cues",
    ],
    commonGear: ["ProPresenter", "Resolume Arena", "QLab", "Disguise (d3)"],
    relatedRoles: ["v1-video-engineer", "projectionist"],
  },
  {
    slug: "camera-operator",
    shortName: "CAM",
    title: "Camera Operator",
    department: "Video",
    hiringTitle: "Hire a Camera Operator",
    jobTitle: "Camera Operator Jobs",
    description:
      "A Camera Operator runs cameras for IMAG (image magnification), live streaming, and recording at events. They frame shots of speakers, performers, and audience reactions, following direction from the video engineer or technical director. Camera operators work handheld, on tripods, on jibs, or operating PTZ cameras remotely.",
    responsibilities: [
      "Operate cameras for IMAG, streaming, and recording",
      "Frame and compose shots of presenters and performers",
      "Follow direction from the video engineer or director",
      "Set up and maintain camera positions and rigging",
      "Manage camera settings, white balance, and exposure",
    ],
    commonGear: ["Sony PTZ (FR7/BRC)", "Panasonic AW-UE", "Sony FX6/FX9", "Blackmagic URSA"],
    relatedRoles: ["v1-video-engineer", "v2-video-technician"],
  },
  {
    slug: "led-technician",
    shortName: "LED",
    title: "LED Technician",
    department: "Video",
    hiringTitle: "Hire an LED Technician",
    jobTitle: "LED Technician Jobs",
    description:
      "An LED Technician builds, calibrates, and maintains LED video walls and displays for live events. They handle the physical assembly of LED panels, configure processing hardware, and ensure the wall displays content at the correct resolution, brightness, and color accuracy.",
    responsibilities: [
      "Assemble and disassemble LED wall panels and frames",
      "Configure LED processors (Novastar, Brompton) for the display",
      "Calibrate brightness, color temperature, and refresh rate",
      "Troubleshoot dead pixels, panel failures, and signal issues",
      "Coordinate with rigging for flown or curved LED builds",
    ],
    commonGear: ["ROE Visual", "Absen", "Novastar", "Brompton Tessera"],
    relatedRoles: ["v1-video-engineer", "v2-video-technician"],
  },
  {
    slug: "projectionist",
    shortName: "PROJ",
    title: "Projectionist",
    department: "Video",
    hiringTitle: "Hire a Projectionist",
    jobTitle: "Projectionist Jobs",
    description:
      "A Projectionist sets up, aligns, and operates projection systems for live events. They handle everything from single-projector keynote screens to multi-projector edge-blended panoramas and projection mapping installations. Projectionists work with high-end laser projectors and need expertise in throw distances, lens calculations, and image geometry.",
    responsibilities: [
      "Set up and align projectors for screens and surfaces",
      "Calculate throw distances and select appropriate lenses",
      "Configure edge blending for multi-projector setups",
      "Operate projection mapping software when required",
      "Monitor projector performance and swap units if needed",
    ],
    commonGear: ["Christie laser projectors", "Barco UDX/UDM", "Panasonic PT-RZ", "Epson Pro L Series"],
    relatedRoles: ["v1-video-engineer", "graphics-playback-operator"],
  },

  // ── Lighting ──
  {
    slug: "l1-lighting-designer",
    shortName: "L1",
    title: "Lighting Designer/Director",
    department: "Lighting",
    hiringTitle: "Hire a Lighting Designer",
    jobTitle: "Lighting Designer Jobs",
    description:
      "An L1 Lighting Designer/Director designs, programs, and operates the lighting for live events. They create the visual atmosphere through color, movement, and intensity — programming cues on a lighting console and running them live during the show. On corporate events, the L1 handles stage washes, presenter key lights, and audience lighting.",
    responsibilities: [
      "Design the lighting plot and select fixtures for the event",
      "Program lighting cues, scenes, and timecoded sequences",
      "Operate the lighting console during the live show",
      "Manage the lighting team (L2s, spot operators)",
      "Coordinate with video and scenic teams on visual integration",
    ],
    commonGear: ["grandMA3", "ETC Eos", "Hog 4", "ChamSys MagicQ"],
    relatedRoles: ["l2-lighting-technician", "spot-operator"],
  },
  {
    slug: "l2-lighting-technician",
    shortName: "L2",
    title: "Lighting Technician",
    department: "Lighting",
    hiringTitle: "Hire a Lighting Technician",
    jobTitle: "Lighting Technician Jobs",
    description:
      "An L2 Lighting Technician supports the lighting designer (L1) during live events. They handle fixture placement, focusing, cabling, DMX patching, and physical setup of the lighting rig. L2s are essential for getting every fixture in position and working before the show.",
    responsibilities: [
      "Hang, focus, and gel lighting fixtures per the plot",
      "Run power and DMX cables to all fixture positions",
      "Patch fixtures into the lighting console",
      "Operate follow spots or auxiliary lighting positions",
      "Assist with haze/atmosphere machines and effects",
    ],
    commonGear: ["Moving heads", "LED wash/spot fixtures", "Conventional fixtures", "DMX testing tools"],
    relatedRoles: ["l1-lighting-designer", "spot-operator", "stagehand"],
  },
  {
    slug: "spot-operator",
    shortName: "SPOT",
    title: "Spot Operator",
    department: "Lighting",
    hiringTitle: "Hire a Spot Operator",
    jobTitle: "Spot Operator Jobs",
    description:
      "A Spot Operator runs followspot fixtures during live events and performances. They track presenters, performers, and award recipients with a focused beam of light, following cues from the lighting designer or stage manager. Spot operators need steady hands, quick reflexes, and the ability to follow spoken cues precisely.",
    responsibilities: [
      "Operate a followspot to track performers on stage",
      "Follow verbal cues from the lighting designer or stage manager",
      "Adjust intensity, iris, and color as directed",
      "Maintain smooth, steady movement throughout the show",
      "Communicate via intercom with the production team",
    ],
    commonGear: ["Robert Juliat followspots", "Lycian followspots", "Super Trooper", "RoboSpot"],
    relatedRoles: ["l1-lighting-designer", "l2-lighting-technician"],
  },

  // ── Staging & Rigging ──
  {
    slug: "stagehand",
    shortName: "SH",
    title: "Stagehand",
    department: "Staging & Rigging",
    hiringTitle: "Hire a Stagehand",
    jobTitle: "Stagehand Jobs",
    description:
      "A Stagehand provides essential labor for load-in, setup, strike, and event support. They build stages, hang truss, set furniture and drape, load trucks, and handle the physical infrastructure that makes events possible. Stagehands are the backbone of every live event crew.",
    responsibilities: [
      "Load in and strike equipment, staging, and set pieces",
      "Build stages, risers, and scenic elements",
      "Set furniture, drape, and soft goods",
      "Assist technical departments with equipment positioning",
      "Operate forklifts and manage warehouse logistics",
    ],
    commonGear: ["Chain motors", "Truss systems", "Staging decks", "Hand tools"],
    relatedRoles: ["l2-lighting-technician", "power-electrical-technician", "scenic-carpenter"],
  },
  {
    slug: "power-electrical-technician",
    shortName: "PWR",
    title: "Power/Electrical Technician",
    department: "Staging & Rigging",
    hiringTitle: "Hire a Power/Electrical Technician",
    jobTitle: "Power/Electrical Technician Jobs",
    description:
      "A Power/Electrical Technician handles all power distribution for live events. They manage generator tie-ins, distro box setup, circuit mapping, and load balancing to ensure every piece of equipment gets clean, reliable power. This role is critical on large events where power demands exceed standard venue outlets.",
    responsibilities: [
      "Design and install temporary power distribution systems",
      "Perform generator tie-ins and manage utility power connections",
      "Set up and label distro boxes, transformers, and circuit panels",
      "Calculate and balance electrical loads across circuits",
      "Ensure NEC compliance and electrical safety standards",
    ],
    commonGear: ["Cam-Lock systems", "Power distro boxes", "Multimeters", "Load calculators"],
    relatedRoles: ["stagehand", "scenic-carpenter"],
  },
  {
    slug: "scenic-carpenter",
    shortName: "CARP",
    title: "Scenic Carpenter",
    department: "Staging & Rigging",
    hiringTitle: "Hire a Scenic Carpenter",
    jobTitle: "Scenic Carpenter Jobs",
    description:
      "A Scenic Carpenter builds custom staging, scenic elements, and set pieces for live events. They fabricate, paint, and install everything from branded walls and podiums to full theatrical sets. Scenic carpenters bridge the gap between design renderings and physical reality.",
    responsibilities: [
      "Build custom scenic elements from design specifications",
      "Fabricate staging, podiums, and branded structures",
      "Paint and finish scenic pieces to match design intent",
      "Install and strike scenic elements on site",
      "Read and interpret CAD drawings and design plans",
    ],
    commonGear: ["Power tools", "CNC machines", "Scenic paint", "Rigging hardware"],
    relatedRoles: ["stagehand", "power-electrical-technician"],
  },

  // ── IT & Networking ──
  {
    slug: "show-network-engineer",
    shortName: "NET",
    title: "Show Network Engineer",
    department: "IT & Networking",
    hiringTitle: "Hire a Show Network Engineer",
    jobTitle: "Show Network Engineer Jobs",
    description:
      "A Show Network Engineer designs and manages the event network infrastructure. They build the backbone that carries audio-over-IP (Dante), video-over-IP (NDI), streaming feeds, and show control data. As AV systems become increasingly networked, this role is critical for any show running IP-based workflows.",
    responsibilities: [
      "Design and deploy the show network topology",
      "Configure VLANs, QoS, and multicast for AV-over-IP protocols",
      "Manage Dante, NDI, and other networked audio/video systems",
      "Set up streaming infrastructure and encoding",
      "Troubleshoot network issues during the live show",
    ],
    commonGear: ["Cisco/Aruba switches", "Dante Domain Manager", "NDI tools", "Network analyzers"],
    relatedRoles: ["v1-video-engineer", "a1-audio-engineer"],
  },
  {
    slug: "breakout-operator",
    shortName: "BRK",
    title: "Breakout Operator",
    department: "IT & Networking",
    hiringTitle: "Hire a Breakout Operator",
    jobTitle: "Breakout Operator Jobs",
    description:
      "A Breakout Operator runs smaller breakout rooms at conferences and multi-room events. They typically handle audio, video, and playback solo in a single room — making them a versatile jack-of-all-trades. Breakout operators are essential for any multi-session conference.",
    responsibilities: [
      "Set up and operate all AV equipment in a breakout room",
      "Support presenters with laptop connections and content playback",
      "Manage room audio including ceiling speakers and Q&A mics",
      "Handle recording and hybrid/virtual meeting connections",
      "Execute quick room turnovers between sessions",
    ],
    commonGear: ["Small-format mixers", "Confidence monitors", "Zoom/Teams/Webex", "Wireless mics"],
    relatedRoles: ["a2-audio-technician", "it-help-desk"],
  },
  {
    slug: "it-help-desk",
    shortName: "IT",
    title: "IT/Help Desk Technician",
    department: "IT & Networking",
    hiringTitle: "Hire an IT/Help Desk Technician",
    jobTitle: "IT/Help Desk Technician Jobs",
    description:
      "An IT/Help Desk technician provides on-site tech support for attendees, presenters, and event staff. They troubleshoot laptop connections, manage Wi-Fi networks, support virtual event platforms, and serve as the first line of defense for any technology issue that arises during the event.",
    responsibilities: [
      "Provide tech support for presenters and attendees",
      "Manage event Wi-Fi networks and connectivity",
      "Support virtual event platforms (Zoom, Teams, Webex)",
      "Troubleshoot laptop and device connectivity issues",
      "Assist with event app and registration technology",
    ],
    commonGear: ["Networking equipment", "Laptops", "Zoom/Teams/Webex", "Wi-Fi access points"],
    relatedRoles: ["show-network-engineer", "breakout-operator"],
  },

  // ── Production & Management ──
  {
    slug: "technical-director",
    shortName: "TD",
    title: "Technical Director",
    department: "Production & Management",
    hiringTitle: "Hire a Technical Director",
    jobTitle: "Technical Director Jobs",
    description:
      "A Technical Director (TD) oversees all technical departments on a live event. They are responsible for the technical execution of the show, including calling cues, coordinating between audio, video, lighting, and staging teams, and making real-time decisions when issues arise. The TD is the highest-ranking technical position on most corporate events.",
    responsibilities: [
      "Oversee all technical departments and crew",
      "Call show cues and coordinate technical execution",
      "Advance the show with the client and production team",
      "Manage the technical timeline from load-in through strike",
      "Make real-time decisions to resolve technical issues",
    ],
    commonGear: ["Intercom systems", "Show calling scripts", "Cue sheets", "Multi-department comms"],
    relatedRoles: ["lead-technician", "production-manager"],
  },
  {
    slug: "lead-technician",
    shortName: "LT",
    title: "Lead Technician",
    department: "Production & Management",
    hiringTitle: "Hire a Lead Technician",
    jobTitle: "Lead Technician Jobs",
    description:
      "A Lead Technician is a senior tech who oversees all departments on smaller events without the full scope of a Technical Director. Common in hotel and convention AV, they serve as the primary client-facing technical contact and coordinate between departments. Lead techs are expected to be proficient across audio, video, and lighting.",
    responsibilities: [
      "Serve as the on-site technical lead and client contact",
      "Coordinate between audio, video, lighting, and staging teams",
      "Manage vendor deliveries and equipment check-in",
      "Oversee room setups for multi-room events",
      "Troubleshoot cross-department technical issues",
    ],
    commonGear: ["Multi-department AV systems", "Intercom", "Client communication tools", "Cue sheets"],
    relatedRoles: ["technical-director", "breakout-operator"],
  },
  {
    slug: "teleprompter-operator",
    shortName: "TP",
    title: "Teleprompter Operator",
    department: "Production & Management",
    hiringTitle: "Hire a Teleprompter Operator",
    jobTitle: "Teleprompter Operator Jobs",
    description:
      "A Teleprompter Operator runs the teleprompter for keynotes, speeches, and live presentations. They scroll the script in real time, matching the speaker's pace and cadence — speeding up, slowing down, and handling last-minute script changes on the fly. This role requires intense focus and the ability to read a speaker's rhythm.",
    responsibilities: [
      "Operate teleprompter software for live presentations",
      "Pace script scrolling to match each speaker's cadence",
      "Format and load scripts, including last-minute changes",
      "Set up presidential/glass prompters and confidence monitors",
      "Coordinate with speakers during rehearsals",
    ],
    commonGear: ["Autoscript", "Prompter People", "Presidential glass prompters", "Confidence monitors"],
    relatedRoles: ["technical-director", "graphics-playback-operator"],
  },
  {
    slug: "production-manager",
    shortName: "PM",
    title: "Production Manager",
    department: "Production & Management",
    hiringTitle: "Hire a Production Manager",
    jobTitle: "Production Manager Jobs",
    description:
      "A Production Manager handles the logistics, budget, vendors, and timeline for a live event. They coordinate equipment rentals, crew scheduling, shipping, and site surveys — making sure every piece of the production puzzle is in place before the crew arrives. PMs bridge the gap between the client's vision and the technical team's execution.",
    responsibilities: [
      "Manage production budgets and vendor relationships",
      "Coordinate equipment rental, shipping, and logistics",
      "Schedule crew and manage labor calls",
      "Conduct site surveys and advance venues",
      "Create and maintain the production timeline",
    ],
    commonGear: ["Production management software", "CAD/drafting tools", "Budgeting spreadsheets", "Scheduling platforms"],
    relatedRoles: ["technical-director", "lead-technician"],
  },
];

// ─── Cities (15) ─────────────────────────────────────────────

export const SEO_CITIES: SeoCity[] = [
  // California
  { slug: "san-francisco", name: "San Francisco", state: "CA", metroLabel: "San Francisco, CA", rateMultiplier: 1.18 },
  { slug: "los-angeles", name: "Los Angeles", state: "CA", metroLabel: "Los Angeles, CA", rateMultiplier: 1.12 },
  { slug: "san-diego", name: "San Diego", state: "CA", metroLabel: "San Diego, CA", rateMultiplier: 1.08 },
  { slug: "san-jose", name: "San Jose", state: "CA", metroLabel: "San Jose, CA", rateMultiplier: 1.15 },
  { slug: "sacramento", name: "Sacramento", state: "CA", metroLabel: "Sacramento, CA", rateMultiplier: 0.98 },
  // Major AV markets
  { slug: "las-vegas", name: "Las Vegas", state: "NV", metroLabel: "Las Vegas, NV", rateMultiplier: 1.05 },
  { slug: "new-york", name: "New York", state: "NY", metroLabel: "New York, NY", rateMultiplier: 1.22 },
  { slug: "chicago", name: "Chicago", state: "IL", metroLabel: "Chicago, IL", rateMultiplier: 1.04 },
  { slug: "dallas", name: "Dallas", state: "TX", metroLabel: "Dallas, TX", rateMultiplier: 0.95 },
  { slug: "orlando", name: "Orlando", state: "FL", metroLabel: "Orlando, FL", rateMultiplier: 0.95 },
  { slug: "nashville", name: "Nashville", state: "TN", metroLabel: "Nashville, TN", rateMultiplier: 0.92 },
  { slug: "atlanta", name: "Atlanta", state: "GA", metroLabel: "Atlanta, GA", rateMultiplier: 0.93 },
  { slug: "seattle", name: "Seattle", state: "WA", metroLabel: "Seattle, WA", rateMultiplier: 1.10 },
  { slug: "denver", name: "Denver", state: "CO", metroLabel: "Denver, CO", rateMultiplier: 1.00 },
  { slug: "miami", name: "Miami", state: "FL", metroLabel: "Miami, FL", rateMultiplier: 1.02 },
];

// ─── Base Day Rates (10-hour day, national average) ──────────

export const BASE_DAY_RATES: Record<string, [number, number]> = {
  A1:   [550, 850],
  A2:   [350, 550],
  V1:   [550, 900],
  V2:   [350, 550],
  GFX:  [400, 650],
  CAM:  [400, 700],
  LED:  [450, 700],
  PROJ: [400, 650],
  L1:   [500, 850],
  L2:   [325, 500],
  SPOT: [275, 400],
  SH:   [250, 400],
  PWR:  [450, 750],
  CARP: [400, 650],
  NET:  [600, 1000],
  BRK:  [350, 500],
  IT:   [350, 550],
  TD:   [700, 1200],
  LT:   [550, 900],
  TP:   [400, 600],
  PM:   [650, 1100],
};

// ─── Helpers ─────────────────────────────────────────────────

/** Get the city-adjusted day rate range for a role, rounded to nearest $25. */
export function getCityRate(shortName: string, rateMultiplier: number): [number, number] {
  const [lo, hi] = BASE_DAY_RATES[shortName] ?? [0, 0];
  return [
    Math.round((lo * rateMultiplier) / 25) * 25,
    Math.round((hi * rateMultiplier) / 25) * 25,
  ];
}

/** Derive an approximate hourly rate from a 10-hour day rate. */
export function toHourly(dayRate: number): number {
  return Math.round(dayRate / 10);
}

/** Look up a role by slug. */
export function getRoleBySlug(slug: string): SeoRole | undefined {
  return SEO_ROLES.find((r) => r.slug === slug);
}

/** Look up a city by slug. */
export function getCityBySlug(slug: string): SeoCity | undefined {
  return SEO_CITIES.find((c) => c.slug === slug);
}
