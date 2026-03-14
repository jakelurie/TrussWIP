// AV Industry Taxonomy
// The definitive classification of skills, roles, specializations, and gear
// for the corporate/live events AV labor market.

export interface Department {
  id: string;
  name: string;
  icon: string;
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
  shortName: string; // "A1", "V1" etc — what the industry actually calls it
  description: string;
  specializations: string[];
}

export interface GearCategory {
  id: string;
  name: string;
  icon: string;
  items: GearItem[];
}

export interface GearItem {
  id: string;
  name: string;
  manufacturer: string;
  tags: string[]; // searchable capabilities
}

// ═══════════════════════════════════════════
// DEPARTMENTS & ROLES
// ═══════════════════════════════════════════

export const DEPARTMENTS: Department[] = [
  {
    id: "audio",
    name: "Audio",
    icon: "AUD",
    roles: [
      {
        id: "a1",
        name: "Audio Engineer (A1)",
        shortName: "A1",
        description: "Lead audio engineer. Responsible for system design, mixing FOH, and overall audio production.",
        specializations: [
          "FOH Mixing",
          "Monitor Engineering",
          "Broadcast/Line Mix",
          "System Design",
          "RF Coordination",
          "Dante/AES67 Networking",
          "DSP Programming",
          "Virtual/Hybrid Events",
          "Music Mixing",
          "Corporate Spoken Word",
          "Large Format (1000+)",
          "Outdoor/Festival",
        ],
      },
      {
        id: "a2",
        name: "Audio Technician (A2)",
        shortName: "A2",
        description: "Supports the A1. Handles mic placement, patching, cable runs, stage audio, and RF management.",
        specializations: [
          "Stage/Monitor Mixing",
          "Mic Placement & RF",
          "Patch & Signal Flow",
          "Intercom Systems",
          "Audio Playback",
          "Recording/Multitrack",
          "IEM Systems",
          "Frequency Coordination",
          "Shure Wireless Workbench",
        ],
      },
    ],
  },
  {
    id: "video",
    name: "Video",
    icon: "VID",
    roles: [
      {
        id: "v1",
        name: "Video Engineer (V1)",
        shortName: "V1",
        description: "Lead video engineer. Manages all video sources, switching, and signal distribution.",
        specializations: [
          "Switching/Directing",
          "LED Wall Engineering",
          "Projection Mapping",
          "Streaming/Encoding",
          "Broadcast Engineering",
          "NDI/SDI Routing",
          "Virtual Production",
          "4K/8K Workflows",
        ],
      },
      {
        id: "v2",
        name: "Video Technician (V2)",
        shortName: "V2",
        description: "Supports the V1. Handles cable runs, display setup, and signal testing.",
        specializations: [
          "Display Setup & Calibration",
          "Cable/Signal Management",
          "Playback Operation",
          "Recording",
          "Screen & Truss Rigging",
        ],
      },
      {
        id: "graphics_op",
        name: "Graphics/Playback Operator",
        shortName: "GFX",
        description: "Operates graphics, presentation, and content playback systems during live events.",
        specializations: [
          "ProPresenter",
          "Resolume",
          "Disguise (d3)",
          "PowerPoint/Keynote",
          "Lower Thirds/CG",
          "IMAG Graphics",
          "QLab",
          "Watchout",
          "Video Playback",
          "Timecode Sync",
        ],
      },
      {
        id: "camera_op",
        name: "Camera Operator",
        shortName: "CAM",
        description: "Operates cameras for IMAG, broadcast, and recording.",
        specializations: [
          "Handheld",
          "Jib/Crane",
          "Steadicam/Gimbal",
          "PTZ Remote",
          "Robotic Camera",
          "Broadcast/ENG",
          "Documentary",
        ],
      },
      {
        id: "led_tech",
        name: "LED Technician",
        shortName: "LED",
        description: "Builds, calibrates, and maintains LED video walls and displays.",
        specializations: [
          "Absen",
          "ROE Visual",
          "Unilumin",
          "Samsung Direct View",
          "Novastar Processing",
          "Brompton Processing",
          "Curved/Creative Builds",
          "Outdoor LED",
        ],
      },
      {
        id: "projection",
        name: "Projectionist",
        shortName: "PROJ",
        description: "Sets up, aligns, and operates projection systems.",
        specializations: [
          "Edge Blending",
          "Projection Mapping",
          "Laser Projection",
          "Warp & Blend",
          "Christie",
          "Barco",
          "Panasonic",
          "Epson",
        ],
      },
    ],
  },
  {
    id: "lighting",
    name: "Lighting",
    icon: "LTG",
    roles: [
      {
        id: "l1",
        name: "Lighting Designer/Director (L1)",
        shortName: "L1",
        description: "Designs, programs, and operates the lighting for events. Runs the console and manages the LD team.",
        specializations: [
          "grandMA2/MA3",
          "ETC Eos",
          "Hog 4",
          "Chamsys MagicQ",
          "Lighting Programming",
          "Timecode Programming",
          "Pixel Mapping",
          "Corporate/Conference",
          "Concert/Touring",
          "Theatre",
          "Visualization (WYSIWYG, Capture)",
        ],
      },
      {
        id: "l2",
        name: "Lighting Technician (L2)",
        shortName: "L2",
        description: "Supports the L1. Handles fixture placement, focus, cabling, and DMX patching.",
        specializations: [
          "Conventional Fixtures",
          "Moving Heads",
          "LED Wash/Spot",
          "Follow Spot",
          "Truss & Rigging Prep",
          "DMX Troubleshooting",
          "Haze/Atmosphere",
        ],
      },
      {
        id: "spot_op",
        name: "Spot Operator",
        shortName: "SPOT",
        description: "Operates followspot fixtures during live performances.",
        specializations: [
          "Super Trooper",
          "Robert Juliat",
          "Lycian",
          "RoboSpot/Remote",
        ],
      },
    ],
  },
  {
    id: "staging",
    name: "Staging & Rigging",
    icon: "STG",
    roles: [
      {
        id: "stagehand",
        name: "Stagehand",
        shortName: "SH",
        description: "General labor for load-in, setup, strike, and event support. Includes rigging and stage build.",
        specializations: [
          "Load-In/Strike",
          "Furniture & Drape",
          "Stage Build",
          "Rigging",
          "Chain Motors",
          "Ground Support",
          "Forklift Certified",
          "Truck Loading",
          "Warehouse",
        ],
      },
      {
        id: "power_tech",
        name: "Power/Electrical Technician",
        shortName: "PWR",
        description: "Dedicated to power distribution, generator tie-ins, distro box setup, circuit mapping, and load balancing for large events.",
        specializations: [
          "Power Distribution",
          "Generator Tie-Ins",
          "Load Balancing",
          "Circuit Mapping",
          "Cam-Lock Systems",
          "Temporary Power",
          "NEC Compliance",
        ],
      },
      {
        id: "carpenter",
        name: "Scenic Carpenter",
        shortName: "CARP",
        description: "Builds custom staging, scenic elements, and set pieces.",
        specializations: [
          "Custom Fabrication",
          "Scenic Painting",
          "Scenic Install",
          "CNC/CAD Design",
        ],
      },
    ],
  },
  {
    id: "it_network",
    name: "IT & Networking",
    icon: "NET",
    roles: [
      {
        id: "show_network",
        name: "Show Network Engineer",
        shortName: "NET",
        description: "Designs and manages the event network infrastructure for AV-over-IP, streaming, and show control.",
        specializations: [
          "Dante/AES67",
          "NDI",
          "AVB",
          "VLAN Configuration",
          "Streaming Infrastructure",
          "Network Security",
          "Cisco/Aruba/Netgear",
        ],
      },
      {
        id: "breakout_op",
        name: "Breakout Operator",
        shortName: "BRK",
        description: "Runs smaller breakout rooms at conferences. Typically handles audio, video, and playback solo in a single room.",
        specializations: [
          "Single-Room AV",
          "Presenter Support",
          "Q&A Microphones",
          "Recording/Capture",
          "Hybrid/Virtual Rooms",
          "Quick Turnovers",
        ],
      },
      {
        id: "it_support",
        name: "IT/Help Desk",
        shortName: "IT",
        description: "On-site tech support for attendees, presenters, and event staff.",
        specializations: [
          "Presenter Support",
          "WiFi Management",
          "Event App Support",
          "Virtual Platform Support",
          "Zoom/Teams/Webex",
        ],
      },
    ],
  },
  {
    id: "production",
    name: "Production & Management",
    icon: "PRD",
    roles: [
      {
        id: "td",
        name: "Technical Director",
        shortName: "TD",
        description: "Oversees all technical departments. Responsible for the technical execution of the event, including show calling and cue coordination.",
        specializations: [
          "Corporate Events",
          "Broadcast/Live TV",
          "Concert/Touring",
          "Hybrid/Virtual",
          "Show Calling",
          "Stage Management",
          "Large Format (2000+)",
          "Multi-Room",
        ],
      },
      {
        id: "lead_tech",
        name: "Lead Technician",
        shortName: "LT",
        description: "Senior tech on site who oversees all departments without being a full TD. Common in hotel and corporate AV.",
        specializations: [
          "Hotel/Convention AV",
          "Corporate Events",
          "Multi-Room Management",
          "Client-Facing",
          "Vendor Coordination",
        ],
      },
      {
        id: "teleprompter_op",
        name: "Teleprompter Operator",
        shortName: "TP",
        description: "Runs teleprompter for keynotes, speeches, and live presentations. Paces scroll to the speaker's cadence in real time.",
        specializations: [
          "Autoscript",
          "Prompter People",
          "Presidential/Glass Prompter",
          "Confidence Monitors",
          "Script Formatting",
          "Live Script Changes",
        ],
      },
      {
        id: "pm",
        name: "Production Manager",
        shortName: "PM",
        description: "Manages the production timeline, budget, vendors, and logistics.",
        specializations: [
          "Budgeting",
          "Vendor Management",
          "CAD/Drafting",
          "Logistics & Shipping",
          "Advance & Site Surveys",
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════
// GEAR DATABASE
// ═══════════════════════════════════════════

export const GEAR_CATEGORIES: GearCategory[] = [
  {
    id: "audio_consoles",
    name: "Audio Consoles",
    icon: "CON",
    items: [
      { id: "yamaha_cl", name: "Yamaha CL Series", manufacturer: "Yamaha", tags: ["digital", "dante", "corporate"] },
      { id: "yamaha_ql", name: "Yamaha QL Series", manufacturer: "Yamaha", tags: ["digital", "dante", "corporate"] },
      { id: "yamaha_rivage", name: "Yamaha Rivage PM", manufacturer: "Yamaha", tags: ["digital", "dante", "broadcast", "large format"] },
      { id: "yamaha_tf", name: "Yamaha TF Series", manufacturer: "Yamaha", tags: ["digital", "dante", "small format"] },
      { id: "digico_sd", name: "DiGiCo SD Series", manufacturer: "DiGiCo", tags: ["digital", "optocore", "large format"] },
      { id: "digico_quantum", name: "DiGiCo Quantum", manufacturer: "DiGiCo", tags: ["digital", "optocore", "flagship"] },
      { id: "ah_dlive", name: "Allen & Heath dLive", manufacturer: "Allen & Heath", tags: ["digital", "dante", "corporate"] },
      { id: "ah_avantis", name: "Allen & Heath Avantis", manufacturer: "Allen & Heath", tags: ["digital", "dante", "mid-format"] },
      { id: "ah_sq", name: "Allen & Heath SQ", manufacturer: "Allen & Heath", tags: ["digital", "dante", "compact"] },
      { id: "midas_m32", name: "Midas M32 / Behringer X32", manufacturer: "Midas", tags: ["digital", "budget", "corporate"] },
      { id: "avid_venue", name: "Avid VENUE S6L", manufacturer: "Avid", tags: ["digital", "concert", "broadcast"] },
      { id: "ssl_live", name: "SSL Live", manufacturer: "SSL", tags: ["digital", "broadcast", "concert"] },
      { id: "soundcraft_vi", name: "Soundcraft Vi Series", manufacturer: "Soundcraft", tags: ["digital", "corporate", "dante"] },
    ],
  },
  {
    id: "wireless",
    name: "Wireless & RF",
    icon: "RF",
    items: [
      { id: "shure_axient", name: "Shure Axient Digital", manufacturer: "Shure", tags: ["wireless", "digital", "flagship"] },
      { id: "shure_ulxd", name: "Shure ULXD", manufacturer: "Shure", tags: ["wireless", "digital", "corporate"] },
      { id: "shure_qlxd", name: "Shure QLXD", manufacturer: "Shure", tags: ["wireless", "digital", "mid-range"] },
      { id: "shure_psm", name: "Shure PSM Series (IEM)", manufacturer: "Shure", tags: ["IEM", "wireless", "monitoring"] },
      { id: "sennheiser_ew", name: "Sennheiser EW-D / EW-DX", manufacturer: "Sennheiser", tags: ["wireless", "digital"] },
      { id: "sennheiser_6000", name: "Sennheiser Digital 6000", manufacturer: "Sennheiser", tags: ["wireless", "digital", "flagship"] },
      { id: "wisycom", name: "Wisycom", manufacturer: "Wisycom", tags: ["wireless", "broadcast", "flagship"] },
      { id: "lectrosonics", name: "Lectrosonics", manufacturer: "Lectrosonics", tags: ["wireless", "broadcast"] },
    ],
  },
  {
    id: "speakers",
    name: "Loudspeakers & Amps",
    icon: "SPK",
    items: [
      { id: "db_gsl", name: "d&b audiotechnik GSL/KSL", manufacturer: "d&b", tags: ["line array", "large format"] },
      { id: "db_yseries", name: "d&b audiotechnik Y/V Series", manufacturer: "d&b", tags: ["line array", "corporate"] },
      { id: "db_esl", name: "d&b audiotechnik E/SL Series", manufacturer: "d&b", tags: ["point source", "small format"] },
      { id: "l_acoustics_k", name: "L-Acoustics K Series", manufacturer: "L-Acoustics", tags: ["line array", "large format"] },
      { id: "l_acoustics_a", name: "L-Acoustics A Series", manufacturer: "L-Acoustics", tags: ["line array", "corporate"] },
      { id: "jbl_vtx", name: "JBL VTX Series", manufacturer: "JBL", tags: ["line array", "corporate"] },
      { id: "qsc_kla", name: "QSC KLA", manufacturer: "QSC", tags: ["portable", "small format"] },
      { id: "meyer_sound", name: "Meyer Sound", manufacturer: "Meyer Sound", tags: ["line array", "installed"] },
    ],
  },
  {
    id: "video_switchers",
    name: "Video Switchers & Processing",
    icon: "SWT",
    items: [
      { id: "barco_e2", name: "Barco E2/S3", manufacturer: "Barco", tags: ["switching", "large format", "corporate"] },
      { id: "barco_px", name: "Barco PX/EX", manufacturer: "Barco", tags: ["switching", "processing"] },
      { id: "analog_way", name: "Analog Way Aquilon/Zenith", manufacturer: "Analog Way", tags: ["switching", "large format"] },
      { id: "ross_carbonite", name: "Ross Carbonite", manufacturer: "Ross", tags: ["switching", "broadcast"] },
      { id: "bmd_atem", name: "Blackmagic ATEM", manufacturer: "Blackmagic", tags: ["switching", "streaming", "budget"] },
      { id: "disguise", name: "Disguise (d3)", manufacturer: "Disguise", tags: ["media server", "projection mapping", "LED"] },
      { id: "resolume", name: "Resolume Arena/Wire", manufacturer: "Resolume", tags: ["media server", "VJ", "mapping"] },
      { id: "watchout", name: "Dataton Watchout", manufacturer: "Dataton", tags: ["media server", "multi-display"] },
      { id: "companion", name: "Bitfocus Companion", manufacturer: "Bitfocus", tags: ["control", "automation", "free"] },
    ],
  },
  {
    id: "cameras",
    name: "Cameras",
    icon: "CAM",
    items: [
      { id: "sony_ptz", name: "Sony PTZ (FR7/BRC)", manufacturer: "Sony", tags: ["PTZ", "robotic", "NDI"] },
      { id: "panasonic_ptz", name: "Panasonic AW-UE Series", manufacturer: "Panasonic", tags: ["PTZ", "NDI", "corporate"] },
      { id: "sony_fx", name: "Sony FX6/FX9", manufacturer: "Sony", tags: ["cinema", "handheld"] },
      { id: "canon_c300", name: "Canon C300/C500", manufacturer: "Canon", tags: ["cinema", "broadcast"] },
      { id: "bmd_ursa", name: "Blackmagic URSA", manufacturer: "Blackmagic", tags: ["cinema", "broadcast", "budget"] },
      { id: "bmd_pocket", name: "Blackmagic Pocket Cinema", manufacturer: "Blackmagic", tags: ["cinema", "compact", "budget"] },
      { id: "sony_broadcast", name: "Sony HDC/HXC Series", manufacturer: "Sony", tags: ["broadcast", "triax", "fiber"] },
      { id: "jvc_connected", name: "JVC Connected Cam", manufacturer: "JVC", tags: ["streaming", "NDI", "compact"] },
    ],
  },
  {
    id: "lighting_consoles",
    name: "Lighting Consoles",
    icon: "LTC",
    items: [
      { id: "grandma3", name: "grandMA3", manufacturer: "MA Lighting", tags: ["console", "flagship", "concert", "corporate"] },
      { id: "grandma2", name: "grandMA2", manufacturer: "MA Lighting", tags: ["console", "legacy", "concert", "corporate"] },
      { id: "etc_eos", name: "ETC Eos Family", manufacturer: "ETC", tags: ["console", "theatre", "corporate"] },
      { id: "etc_ion", name: "ETC Ion/Gio", manufacturer: "ETC", tags: ["console", "theatre", "corporate"] },
      { id: "hog4", name: "High End Hog 4", manufacturer: "High End", tags: ["console", "concert"] },
      { id: "chamsys", name: "ChamSys MagicQ", manufacturer: "ChamSys", tags: ["console", "budget", "flexible"] },
      { id: "avolites", name: "Avolites", manufacturer: "Avolites", tags: ["console", "concert", "media"] },
    ],
  },
  {
    id: "led_video",
    name: "LED & Displays",
    icon: "VID",
    items: [
      { id: "absen", name: "Absen LED", manufacturer: "Absen", tags: ["LED wall", "rental"] },
      { id: "roe_visual", name: "ROE Visual", manufacturer: "ROE Visual", tags: ["LED wall", "rental", "virtual production"] },
      { id: "unilumin", name: "Unilumin", manufacturer: "Unilumin", tags: ["LED wall", "rental"] },
      { id: "samsung_wall", name: "Samsung The Wall", manufacturer: "Samsung", tags: ["LED wall", "direct view", "installed"] },
      { id: "novastar", name: "Novastar Processing", manufacturer: "Novastar", tags: ["LED processing", "controller"] },
      { id: "brompton", name: "Brompton Tessera", manufacturer: "Brompton", tags: ["LED processing", "controller", "flagship"] },
    ],
  },
  {
    id: "projectors",
    name: "Projectors",
    icon: "PRJ",
    items: [
      { id: "christie_laser", name: "Christie Laser (HS/Crimson)", manufacturer: "Christie", tags: ["laser", "large venue"] },
      { id: "barco_proj", name: "Barco UDX/UDM", manufacturer: "Barco", tags: ["laser", "large venue"] },
      { id: "panasonic_proj", name: "Panasonic PT-RZ/RQ", manufacturer: "Panasonic", tags: ["laser", "corporate"] },
      { id: "epson_proj", name: "Epson Pro L Series", manufacturer: "Epson", tags: ["laser", "corporate", "budget"] },
    ],
  },
  {
    id: "comms",
    name: "Comms & Intercom",
    icon: "COM",
    items: [
      { id: "riedel_bolero", name: "Riedel Bolero", manufacturer: "Riedel", tags: ["wireless", "intercom", "flagship"] },
      { id: "riedel_artist", name: "Riedel Artist", manufacturer: "Riedel", tags: ["matrix", "intercom"] },
      { id: "clearcom_freespeak", name: "Clear-Com FreeSpeak", manufacturer: "Clear-Com", tags: ["wireless", "intercom"] },
      { id: "clearcom_v", name: "Clear-Com V-Series", manufacturer: "Clear-Com", tags: ["partyline", "intercom"] },
      { id: "rts", name: "RTS (Bosch)", manufacturer: "RTS", tags: ["matrix", "intercom", "broadcast"] },
      { id: "greengo", name: "Green-GO", manufacturer: "Green-GO", tags: ["IP", "intercom", "ethernet"] },
    ],
  },
  {
    id: "networking",
    name: "AV Networking",
    icon: "NET",
    items: [
      { id: "dante", name: "Audinate Dante", manufacturer: "Audinate", tags: ["audio networking", "IP"] },
      { id: "ndi", name: "NDI (NewTek/Vizrt)", manufacturer: "Vizrt", tags: ["video networking", "IP"] },
      { id: "avb", name: "AVB (MILAN)", manufacturer: "Various", tags: ["audio networking", "IP"] },
      { id: "sdi_routing", name: "SDI Routing/Distribution", manufacturer: "Various", tags: ["video routing", "baseband"] },
      { id: "fiber_systems", name: "Fiber Systems (Opticalcon)", manufacturer: "Various", tags: ["fiber", "signal transport"] },
    ],
  },
  {
    id: "streaming",
    name: "Streaming & Recording",
    icon: "RF",
    items: [
      { id: "vmix", name: "vMix", manufacturer: "StudioCoast", tags: ["streaming", "switching", "software"] },
      { id: "obs", name: "OBS Studio", manufacturer: "Open Source", tags: ["streaming", "software", "free"] },
      { id: "wirecast", name: "Wirecast", manufacturer: "Telestream", tags: ["streaming", "software"] },
      { id: "livestream", name: "Livestream Studio", manufacturer: "Vimeo", tags: ["streaming", "hardware"] },
      { id: "teradek", name: "Teradek", manufacturer: "Teradek", tags: ["encoder", "bonded cellular"] },
      { id: "haivision", name: "Haivision", manufacturer: "Haivision", tags: ["encoder", "SRT"] },
      { id: "zoom_webex", name: "Zoom/Webex/Teams Integration", manufacturer: "Various", tags: ["virtual", "hybrid"] },
    ],
  },
  {
    id: "show_control",
    name: "Show Control & Automation",
    icon: "CTL",
    items: [
      { id: "propresenter", name: "ProPresenter", manufacturer: "Renewed Vision", tags: ["presentation", "lyrics", "playback"] },
      { id: "qlab", name: "QLab", manufacturer: "Figure 53", tags: ["playback", "cues", "theatre"] },
      { id: "spotify_showtime", name: "Spotify Showtime", manufacturer: "Spotify", tags: ["playback", "walk-in music"] },
      { id: "crestron", name: "Crestron", manufacturer: "Crestron", tags: ["control", "automation", "installed"] },
      { id: "extron", name: "Extron", manufacturer: "Extron", tags: ["control", "signal distribution", "installed"] },
      { id: "qsys", name: "QSC Q-SYS", manufacturer: "QSC", tags: ["DSP", "control", "networking"] },
    ],
  },
];

// ═══════════════════════════════════════════
// CERTIFICATIONS
// ═══════════════════════════════════════════

export const CERTIFICATIONS: string[] = [
  "Dante Level 1",
  "Dante Level 2",
  "Dante Level 3",
  "CTS",
  "CTS-D",
  "CTS-I",
  "ETCP Entertainment Electrician",
  "ETCP Rigging - Theatre",
  "ETCP Rigging - Arena",
  "Crestron Certified Programmer",
  "Crestron DMC-D",
  "Crestron DMC-E",
  "Crestron DMC-T",
  "Crestron Master Programmer",
  "Extron AV Associate",
  "Extron Control Specialist",
  "QSC Level 1",
  "QSC Level 2",
  "QSC Level 3",
  "Biamp Tesira Certified",
  "Shure Wireless Workbench",
  "SynAudCon",
  "OSHA 10",
  "OSHA 30",
  "CompTIA Network+",
  "CompTIA A+",
  "CompTIA Security+",
  "Cisco CCNA",
  "Cisco CCNP",
  "AMX Certified Programmer",
  "Netgear AV Line Certified",
  "Audinate Dante Domain Manager",
  "NDI Certified",
];

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

// Get all roles as a flat array
export function getAllRoles(): (Role & { departmentId: string; departmentName: string })[] {
  return DEPARTMENTS.flatMap(dept =>
    dept.roles.map(role => ({ ...role, departmentId: dept.id, departmentName: dept.name }))
  );
}

// Get all specializations for a set of role IDs
export function getSpecializationsForRoles(roleIds: string[]): string[] {
  const specs = new Set<string>();
  DEPARTMENTS.forEach(dept => {
    dept.roles.forEach(role => {
      if (roleIds.includes(role.id)) {
        role.specializations.forEach(s => specs.add(s));
      }
    });
  });
  return Array.from(specs);
}

// Get all gear items as a flat array
export function getAllGear(): (GearItem & { categoryId: string; categoryName: string })[] {
  return GEAR_CATEGORIES.flatMap(cat =>
    cat.items.map(item => ({ ...item, categoryId: cat.id, categoryName: cat.name }))
  );
}

// Get a single gear item by id
export function getGearById(id: string): (GearItem & { categoryId: string; categoryName: string }) | undefined {
  return getAllGear().find(g => g.id === id);
}

// Gear slug helpers for wiki URLs
export function gearIdToSlug(id: string): string {
  return id.replace(/_/g, "-");
}

export function slugToGearId(slug: string): string {
  return slug.replace(/-/g, "_");
}

// Search gear by name, manufacturer, or tags
export function searchGear(query: string): (GearItem & { categoryId: string; categoryName: string })[] {
  const q = query.toLowerCase();
  return getAllGear().filter(g =>
    g.name.toLowerCase().includes(q) ||
    g.manufacturer.toLowerCase().includes(q) ||
    g.tags.some(t => t.toLowerCase().includes(q))
  );
}

// Get role by short name (e.g., "A1" → full role object)
export function getRoleByShortName(shortName: string): (Role & { departmentId: string }) | undefined {
  for (const dept of DEPARTMENTS) {
    const role = dept.roles.find(r => r.shortName === shortName);
    if (role) return { ...role, departmentId: dept.id };
  }
  return undefined;
}

// Convert old flat skill names to new role IDs
export function migrateSkillToRoleId(skill: string): string | null {
  const mapping: Record<string, string> = {
    "A1": "a1",
    "A2": "a2",
    "V1": "v1",
    "V2": "v2",
    "L1": "l1",
    "L2": "l2",
    "LED Specialist": "led_tech",
    "Camera Operator": "camera_op",
    "General AV Tech": "stagehand",
    "Technical Director": "td",
    "Stagehand": "stagehand",
    "Rigger": "stagehand",
    "Spot Op": "spot_op",
    // Removed roles → map to parent
    "RF": "a1",
    "MON": "a1",
    "DSP": "a1",
    "PB": "graphics_op",
    "LP": "l1",
    "SC": "td",
    "SM": "td",
    "RIG": "stagehand",
  };
  return mapping[skill] || null;
}