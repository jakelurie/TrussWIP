import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Become an AV Technician | Truss",
  description:
    "The career nobody talks about that pays $50-120/hr. Learn how to break into live event AV — roles, pay rates, skills, certifications, and how to get your first gig.",
  keywords: [
    "how to become an AV technician",
    "AV technician career",
    "audio visual technician salary",
    "live event technician",
    "AV tech jobs",
    "stagehand jobs",
    "audio engineer career",
    "video technician",
    "lighting technician",
    "corporate AV jobs",
    "freelance AV technician",
    "AV technician training",
  ],
  openGraph: {
    title: "How to Become an AV Technician | Truss",
    description:
      "The career nobody talks about that pays $50-120/hr. Roles, pay, skills, and how to get started with zero experience.",
    type: "article",
    url: "https://trusswork.org/learn",
  },
};

const ROLES = [
  {
    role: "Stagehand",
    rate: "$25-35/hr",
    desc: "Load trucks, push cases, run cables, set up rooms. Entry level.",
  },
  {
    role: "A2 / V2 / L2",
    rate: "$35-55/hr",
    desc: "Assist the lead engineer. Place mics, manage wireless, run patch, set up displays.",
  },
  {
    role: "A1 / V1 / L1",
    rate: "$55-85/hr",
    desc: "Lead engineer. Run the console, design the system, make real-time decisions during the show.",
  },
  {
    role: "Specialist",
    rate: "$65-100/hr",
    desc: "Deep expertise in a specific technology (LED, DSP, projection). High demand, limited supply.",
  },
  {
    role: "Technical Director",
    rate: "$75-120/hr",
    desc: "Oversee all departments. Final sign-off before doors open.",
  },
  {
    role: "Technical Director / Show Caller",
    rate: "$80-125/hr",
    desc: "Oversee technical execution and call cues during the live show. Coordinate all departments in real time.",
  },
];

const CERTS = [
  {
    name: "CTS",
    full: "Certified Technology Specialist",
    issuer: "AVIXA",
    signal: "General AV knowledge, industry standard",
  },
  {
    name: "CTS-I",
    full: "Installation",
    issuer: "AVIXA",
    signal: "System installation expertise",
  },
  {
    name: "CTS-D",
    full: "Design",
    issuer: "AVIXA",
    signal: "System design expertise",
  },
  {
    name: "Dante Cert",
    full: "Levels 1-3",
    issuer: "Audinate",
    signal: "Audio networking proficiency — high demand",
  },
  {
    name: "ETCP",
    full: "Entertainment Technician",
    issuer: "ESTA",
    signal: "Rigging and electrical — required for some venues",
  },
  {
    name: "OSHA 10/30",
    full: "Workplace Safety",
    issuer: "OSHA",
    signal: "Required by some employers",
  },
];

const DEPARTMENTS = [
  {
    name: "Audio",
    icon: "AUD",
    desc: "Microphones, speakers, mixing consoles, wireless systems. Making sure a presenter's voice sounds clear in a room of 3,000 people.",
  },
  {
    name: "Video",
    icon: "VID",
    desc: "Cameras, LED walls, projectors, video switchers, graphics. Putting slides on screen, running IMAG cameras, managing livestreams.",
  },
  {
    name: "Lighting",
    icon: "LTG",
    desc: "Stage lighting, follow spots, programmed light shows. Making sure the stage looks professional and every presenter is properly lit.",
  },
  {
    name: "Staging & Rigging",
    icon: "STG",
    desc: "Truss, chain motors, stage builds, scenic elements. Physically building the structures that hold everything up.",
  },
  {
    name: "IT & Networking",
    icon: "NET",
    desc: "Show networks, streaming infrastructure, AV-over-IP routing. Making sure all the gear communicates.",
  },
  {
    name: "Production",
    icon: "PRD",
    desc: "Technical directors, show callers, production managers. Overseeing all departments and calling the show.",
  },
];

export default function LearnPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* ── Header ──────────────────────────── */}
      <div className="mb-12">
        <Link
          href="/"
          className="inline-block font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange hover:text-orange-400 transition-colors mb-6"
        >
          Truss
        </Link>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-wide uppercase leading-tight mb-4">
          How to Become an{" "}
          <span className="text-signal-orange">AV Technician</span>
        </h1>
        <p className="text-lg sm:text-xl text-aluminum leading-relaxed">
          The career nobody talks about that pays $50-120/hr.
        </p>
      </div>

      {/* ── Intro ───────────────────────────── */}
      <section className="mb-12">
        <p className="text-house-lights/90 leading-relaxed mb-4">
          There are hundreds of thousands of people making $50-100K+ a year
          setting up microphones, running cameras, programming lights, and
          building LED walls for live events. Every corporate keynote,
          conference, concert, and gala requires a crew of technicians behind it.
          The industry is massive, the work is constant, and there&apos;s a
          permanent labor shortage.
        </p>
        <p className="text-aluminum leading-relaxed">
          AV technician isn&apos;t a career path that shows up in college
          brochures. There&apos;s no degree for it. Most people in the industry
          found it by accident. This page exists to fix that.
        </p>
      </section>

      {/* ── What AV techs do ────────────────── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase text-signal-orange mb-2">
          What AV Technicians Actually Do
        </h2>
        <p className="text-aluminum leading-relaxed mb-4">
          AV stands for audio-visual. In live events, it covers everything the
          audience sees and hears that isn&apos;t a human being on stage.
        </p>
        <p className="text-house-lights/90 leading-relaxed mb-6">
          When a CEO speaks at a conference — someone designed the sound system,
          someone placed the microphone, someone built the LED wall, someone is
          mixing audio in real time, someone is advancing slides, and someone is
          switching between camera feeds for the livestream.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {DEPARTMENTS.map((d) => (
            <div
              key={d.name}
              className="bg-deep-stage border border-white/5 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{d.icon}</span>
                <span className="font-heading text-sm font-semibold tracking-wider uppercase">
                  {d.name}
                </span>
              </div>
              <p className="text-xs text-aluminum leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles and pay ───────────────────── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase text-signal-orange mb-2">
          Roles and Pay Scale
        </h2>
        <p className="text-aluminum leading-relaxed mb-4">
          AV has a clear hierarchy. Rates increase with skill and
          responsibility.
        </p>
        <div className="space-y-2">
          {ROLES.map((r) => (
            <div
              key={r.role}
              className="bg-deep-stage border border-white/5 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
            >
              <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[220px]">
                <span className="font-heading text-sm font-semibold">
                  {r.role}
                </span>
                <span className="font-mono text-xs text-signal-orange">
                  {r.rate}
                </span>
              </div>
              <span className="text-xs text-aluminum leading-relaxed">
                {r.desc}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-aluminum/65 mt-3">
          Rates vary by city and experience. Major markets (New York, Las Vegas,
          Los Angeles, San Francisco) pay 15-30% more.{" "}
          <Link
            href="/rates"
            className="text-signal-orange/70 hover:text-signal-orange transition-colors"
          >
            Full rate data by role and city →
          </Link>
        </p>
      </section>

      {/* ── Signal flow + client management ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase text-signal-orange mb-4">
          The Two Things That Matter Most
        </h2>

        <div className="bg-deep-stage border border-white/5 rounded-lg p-5 mb-3">
          <h3 className="font-heading text-base font-semibold tracking-wider uppercase mb-2">
            1. Signal Flow
          </h3>
          <p className="text-sm text-house-lights/90 leading-relaxed mb-3">
            The single most important concept in AV. Signal flow means
            understanding where a signal starts, where it ends, and every step
            in between.
          </p>
          <div className="space-y-2 mb-3">
            <div className="bg-blackout rounded-lg px-3 py-2">
              <span className="font-mono text-[10px] text-signal-orange tracking-wider uppercase block mb-1">
                Audio
              </span>
              <span className="font-mono text-xs text-aluminum">
                Mic → Cable → Stagebox → Network → Console → Processing → Amps
                → Speakers
              </span>
            </div>
            <div className="bg-blackout rounded-lg px-3 py-2">
              <span className="font-mono text-[10px] text-signal-orange tracking-wider uppercase block mb-1">
                Video
              </span>
              <span className="font-mono text-xs text-aluminum">
                Camera → SDI → Router → Switcher → Scaler → LED Processor → LED
                Wall
              </span>
            </div>
          </div>
          <p className="text-xs text-aluminum leading-relaxed">
            Every department has its own version, but the principle is universal:{" "}
            <strong className="text-house-lights">
              input → processing → output.
            </strong>{" "}
            When something doesn&apos;t work, start at one end, follow the path,
            find where it breaks. A tech who understands signal flow can figure
            out almost any problem on any system.
          </p>
        </div>

        <div className="bg-deep-stage border border-white/5 rounded-lg p-5">
          <h3 className="font-heading text-base font-semibold tracking-wider uppercase mb-2">
            2. Client Management
          </h3>
          <p className="text-sm text-house-lights/90 leading-relaxed mb-3">
            AV is a service industry. The client is typically an event planner or
            corporate executive who doesn&apos;t understand the technology and
            needs everything to work perfectly in front of their audience.
          </p>
          <p className="text-xs text-aluminum leading-relaxed">
            The techs who build the best careers aren&apos;t necessarily the most
            technically gifted. They&apos;re the ones who communicate clearly,
            stay calm under pressure, anticipate problems before they escalate,
            and make the client feel confident.{" "}
            <strong className="text-house-lights">
              Technical skills get you hired. Professionalism gets you hired
              back.
            </strong>
          </p>
        </div>
      </section>

      {/* ── Getting started ─────────────────── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase text-signal-orange mb-4">
          Getting Started with Zero Experience
        </h2>
        <p className="text-sm text-aluminum mb-4">
          No degree required. No certifications required. No gear required.
        </p>
        <div className="space-y-3">
          {[
            {
              title: "Stagehand Work",
              text: "Production companies and AV vendors hire stagehands for load-ins and load-outs constantly. This is physical work: pushing road cases, running cables, building stages. It's the entry point. Show up on time, work hard, pay attention to what the engineers are doing.",
            },
            {
              title: "Hotel AV",
              text: "Major hotel chains (Marriott, Hilton, Hyatt) have in-house AV departments operated by companies like Encore Global. They hire entry-level techs and provide on-the-job training. Lower starting pay but consistent work and rapid learning.",
            },
            {
              title: "Crew Platforms",
              text: "List yourself as an available stagehand on platforms like Truss. Set a competitive rate, be honest about your experience level, and accept every opportunity.",
            },
            {
              title: "Networking",
              text: "The industry runs on relationships. One connection leads to gigs, gigs lead to more connections. Every person on a job site is a potential future call.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-deep-stage border border-white/5 rounded-lg p-4"
            >
              <div className="font-heading text-sm font-semibold tracking-wider uppercase mb-1.5">
                {item.title}
              </div>
              <p className="text-xs text-aluminum leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stagehand to engineer ───────────── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase text-signal-orange mb-4">
          Moving from Stagehand to Engineer
        </h2>
        <p className="text-sm text-aluminum mb-4">
          The jump from stagehand to A2/V2/L2 is the biggest. After that,
          progression accelerates with experience.
        </p>
        <div className="space-y-2">
          {[
            {
              label: "Pick one department and go deep",
              text: "Don't try to be an audio/video/lighting generalist. Become the A2 who understands gain structure and RF coordination, or the V2 who can troubleshoot an SDI signal path without supervision.",
            },
            {
              label: "Learn the gear",
              text: "Every major manufacturer publishes free training materials. Yamaha, Shure, Blackmagic, ETC, MA Lighting — they all have YouTube channels, webinars, and documentation. A tech who shows up already knowing the console is dramatically more valuable.",
            },
            {
              label: "Watch the lead",
              text: "On every gig, observe what the A1/V1/L1 does. Ask questions during setup, not during the show. Most lead engineers will teach someone who demonstrates genuine interest and initiative.",
            },
            {
              label: "Be reliable",
              text: "Reliability beats talent in this industry. The tech who shows up early, never cancels, and doesn't create problems will get called back over the brilliant engineer who's unpredictable.",
            },
            {
              label: "Develop a specialty",
              text: '"I do audio" is a commodity. "40-channel wireless RF coordination for award shows" is a career. Specialization drives higher rates and consistent demand.',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="border-l-2 border-signal-orange/20 pl-4 py-1"
            >
              <div className="text-sm font-semibold text-house-lights mb-0.5">
                {item.label}
              </div>
              <p className="text-xs text-aluminum leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The work ────────────────────────── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase text-signal-orange mb-4">
          The Work
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              label: "Schedule",
              text: "Events happen on evenings, weekends, and holidays. Load-in days are typically 10-14 hours. January is slow. September through December is peak season.",
            },
            {
              label: "Physical Demands",
              text: "Lifting, carrying, climbing, standing for extended periods. Road cases weigh 50-150 lbs. Physical fitness matters.",
            },
            {
              label: "Environment",
              text: "Hotel ballrooms, convention centers, arenas, outdoor festival sites. Temperature-controlled to extreme heat. Clean venues to muddy fields.",
            },
            {
              label: "Travel",
              text: "Ranges from local daily gigs to multi-week tours. Some techs work exclusively in one city. Others are on the road 200+ days a year.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-deep-stage border border-white/5 rounded-lg p-4"
            >
              <div className="font-mono text-[10px] text-signal-orange tracking-widest uppercase mb-1.5">
                {item.label}
              </div>
              <p className="text-xs text-aluminum leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-aluminum/65 mt-3">
          Freelance AV is feast or famine. Experienced techs in major markets
          with strong networks stay consistently booked. Newer techs should
          expect inconsistency in the first 1-2 years while building a
          reputation and client base.
        </p>
      </section>

      {/* ── Certifications ──────────────────── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase text-signal-orange mb-2">
          Industry Certifications Worth Knowing About
        </h2>
        <p className="text-sm text-aluminum mb-4">
          Not required to start, but valuable for advancement and higher rates.
        </p>
        <div className="space-y-2">
          {CERTS.map((c) => (
            <div
              key={c.name}
              className="bg-deep-stage border border-white/5 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
            >
              <div className="flex items-center gap-2 min-w-[160px]">
                <span className="font-mono text-xs font-bold text-signal-orange">
                  {c.name}
                </span>
                <span className="text-[10px] text-aluminum/60">
                  {c.issuer}
                </span>
              </div>
              <span className="text-xs text-aluminum leading-relaxed">
                {c.signal}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="text-center py-12 border-t border-ink/[0.06]">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-wide uppercase mb-6">
          Start <span className="text-signal-orange">Now</span>
        </h2>
        <div className="max-w-md mx-auto space-y-3 mb-8 text-left">
          {[
            {
              num: "1",
              text: "Browse AV roles and current market rates",
              href: "/rates",
              linkText: "Rate Guide →",
            },
            {
              num: "2",
              text: "Create a free technician profile",
              href: "/signup?type=tech",
              linkText: "Sign Up →",
            },
            {
              num: "3",
              text: "Learn signal flow",
              href: null,
              linkText:
                'Search "audio signal flow" or "video signal flow basics" on YouTube',
            },
            {
              num: "4",
              text: "Get on a job site",
              href: null,
              linkText: "Accept any stagehand call available in your city",
            },
          ].map((step) => (
            <div key={step.num} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-signal-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="font-mono text-xs font-bold text-signal-orange">
                  {step.num}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-house-lights">
                  {step.text}
                </div>
                {step.href ? (
                  <Link
                    href={step.href}
                    className="text-xs text-signal-orange/70 hover:text-signal-orange transition-colors"
                  >
                    {step.linkText}
                  </Link>
                ) : (
                  <span className="text-xs text-aluminum/65">
                    {step.linkText}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-aluminum mb-6">
          The barrier to entry is showing up. Everything else is learned on the
          job.
        </p>
        <Link
          href="/signup?type=tech"
          className="inline-block px-8 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-orange-600 transition-colors"
        >
          Sign Up Free
        </Link>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="text-center pb-8">
        <Link
          href="/"
          className="inline-block font-mono text-xs text-aluminum/50 hover:text-signal-orange transition-colors"
        >
          trusswork.org
        </Link>
      </footer>
    </main>
  );
}
