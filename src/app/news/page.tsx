import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News | Truss",
  description:
    "Platform updates, new features, and industry events from Truss — the marketplace for corporate AV technicians and event producers.",
  openGraph: {
    title: "News | Truss",
    description:
      "Platform updates, new features, and industry events from Truss.",
    type: "article",
    url: "https://trusswork.org/news",
  },
};

const PLATFORM_UPDATES = [
  {
    date: "Feb 24, 2026",
    tag: "Feature" as const,
    title: "Security Notification Emails",
    description:
      "Added branded templates for all 7 Supabase security notifications including password changed, email changed, identity linked/unlinked, and MFA enrollment alerts.",
  },
  {
    date: "Feb 24, 2026",
    tag: "Feature" as const,
    title: "Branded Auth Emails",
    description:
      "Signup confirmation, password reset, and magic link emails now use the Truss dark theme with branded design matching all other platform emails.",
  },
  {
    date: "Feb 24, 2026",
    tag: "Feature" as const,
    title: "Expanded City Coverage",
    description:
      "City selection expanded from 25 to nearly 200 US cities. All city dropdowns now use a searchable combobox for fast type-to-filter selection.",
  },
  {
    date: "Feb 24, 2026",
    tag: "Feature" as const,
    title: "Forum Visual Redesign",
    description:
      "Forum pages redesigned with rounded card layouts, scroll-reveal animations, depth-colored comment threading, vote micro-interactions, and modal entrance effects. Matches the design language used across the rest of the platform.",
  },
  {
    date: "Feb 24, 2026",
    tag: "Feature" as const,
    title: "Forum Markdown Support",
    description:
      "Forum posts and comments now support markdown formatting including bold, italic, inline code, links, bullet lists, and code blocks. A compact toolbar above textareas makes formatting easy.",
  },
  {
    date: "Feb 24, 2026",
    tag: "Feature" as const,
    title: "Invoice Billing Approval",
    description:
      "Producers requesting monthly invoice billing now require admin approval before booking on invoice terms. Admins set credit limits and payment terms. Producers are notified when approved or denied.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Content" as const,
    title: "Safety Compliance Guides",
    description:
      "Two new reference pages covering OSHA regulations and fire code compliance for live events. Fall protection, electrical safety, rigging, occupancy limits, pyrotechnics, flame-retardant materials, AHJ inspections, and more.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Project Files",
    description:
      "Producers can now upload schedules, venue specs, input lists, and other project documents. Booked techs see files on their booking detail view with one-click download. Files organized by category with drag-and-drop upload.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Settings Page",
    description:
      "New settings page with account management, notification preferences, privacy controls (profile visibility, rate display, gear list, messaging), billing links for producers, and account deletion. Accessible from the user menu.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Admin Dashboard",
    description:
      "Full platform admin dashboard with seven pages: overview metrics, user management with admin actions, bookings oversight, revenue analytics by city and role, invoice approval queue, review moderation, and real-time activity feed.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Stripe Identity Verification",
    description:
      "Users can now verify their identity with a government ID and selfie match through Stripe Identity. Verified users display an ID badge on their profile and browse cards.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Vercel Analytics and Speed Insights",
    description:
      "Added Vercel Web Analytics for real-time visitor tracking and Speed Insights for Core Web Vitals monitoring alongside existing Google Analytics.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Advanced Splash Page Animations",
    description:
      "Hover micro-interactions on feature cards, rotating gradient border sweeps on comparison strips, and parallax depth on the hero background.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Scroll Animations on Splash Page",
    description:
      "Added scroll-triggered fade-up reveals for each section, staggered card animations for feature grids, and animated number counters for stats.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Splash Page Rebuild with Split Path Marketing",
    description:
      "The homepage now features split tech/producer marketing paths with targeted messaging, a full comparison table, booking flow stepper, and insurance-first positioning.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Content" as const,
    title: "About, Contact, and FAQ Pages",
    description:
      "New About, Contact, and FAQ pages provide transparency on the Truss mission, a direct contact form, and answers to common questions for both technicians and producers.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Content" as const,
    title: "SEO Landing Pages for Every Role and City",
    description:
      "Over 700 statically generated landing pages now target producers searching to hire AV techs and freelancers looking for gigs — covering 21 roles across 15 major US cities.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Forum Light Mode Polish",
    description:
      "Improved forum readability in light mode with stronger borders, more visible sidebar cards, higher contrast text, and better hover states across all forum pages.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Light / Dark Mode",
    description:
      "Toggle between light and dark themes via the sun/moon icon in the navbar. All design tokens flow through CSS custom properties for instant theme switching with zero page reload.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Forum Redesign with Threaded Comments",
    description:
      "Forum rebuilt with compact post rows, left-side vote arrows, threaded comment nesting with collapse/expand, sort tabs, and a two-column layout with sidebar. Inspired by classic Reddit.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Wiki Articles with Revision History",
    description:
      "Gear Wiki pages are now fully editable Wikipedia-style articles. Every edit is tracked with full revision history, edit summaries, and a table of contents. Supports Markdown formatting and gear-to-gear linking.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Browse Page Scalability Upgrade",
    description:
      "Browse now uses server-side filtering, sorting, and pagination with database indexes. Scales to 50,000+ technician profiles.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Gear Wiki",
    description:
      "Crowdsourced knowledge base for 120+ AV gear items. Add tips, flag known issues, ask questions, and upvote the best contributions. Wiki activity shows on profiles.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Rotating Tagline on Splash Page",
    description:
      "The splash page hero now cycles through six value propositions with a slide-up animation, replacing the static tagline.",
  },
  {
    date: "Feb 23, 2026",
    tag: "Feature" as const,
    title: "Community Forum",
    description:
      "Discuss the AV industry with fellow techs and producers. Nine department-based categories, verified skill indicators, helpful marks, and forum activity on profiles.",
  },
  {
    date: "Feb 22, 2026",
    tag: "Feature" as const,
    title: "Payout Nudges & Auto-Retry",
    description:
      "Techs with pending payouts now see the dollar amount on their dashboard and receive email nudges. Pending payouts process automatically once Stripe Connect is set up.",
  },
  {
    date: "Feb 22, 2026",
    tag: "Feature" as const,
    title: "Profile Certifications",
    description:
      "Technicians can now add industry certifications to their profiles — Dante, CTS, ETCP, Crestron, OSHA, and more. Certifications display on public profiles and browse cards.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "VenueSpec",
    description:
      "Crowdsourced venue technical specs from techs who've actually worked there. Submit and browse power, rigging, loading, internet, and production notes for event venues.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Market Intelligence",
    description:
      "Live AV labor market data — rate benchmarks by role, top markets, experience distribution, specialization trends, and hiring demand. All from the Truss marketplace.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "AI Crew Planner",
    description:
      "Describe your event in plain English and get an AI-generated crew plan with roles, headcounts, gear, and production timeline. Each role links to matching techs on Truss.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "AI Smart Search",
    description:
      "Search for crew in plain English. Type something like 'available LED tech in Vegas under $80/hr' and the AI parses it into filters automatically.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "AI Profile Assistant",
    description:
      "Generate or improve your bio with AI. Choose a tone (professional, conversational, or technical) and the assistant writes a bio based on your skills, experience, and gear.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Saved Searches with Alerts",
    description:
      "Producers can save browse filter combinations and get email alerts when new techs match. Manage saved searches from the dashboard.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Rate Insights for Techs",
    description:
      "Your dashboard now shows how your rates compare to other techs with matching skills in your market. See if you're above, competitive, or below market average.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Content" as const,
    title: "Freelance AV Tax Guide",
    description:
      "1099 vs W-2, self-employment tax, deductions, quarterly payments, S-Corp election, and the new No Tax on Overtime provision for AV techs.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Show Calculator",
    description:
      "Input event type, audience size, and production specs to get crew and gear recommendations. Covers corporate, concert, broadcast, festival, and 4 more event formats.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Content" as const,
    title: "Cable Bible",
    description:
      "Complete connector reference for live events — 28 connector types across audio, video, data, power, and hybrid categories with pinouts, specs, and compatibility notes.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Job SEO Pages",
    description:
      "Static SEO pages for every city and role: /jobs/city/san-francisco, /jobs/role/a1, etc. Cross-linked from the main jobs page for discoverability.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Browse & Jobs Pagination",
    description:
      "Browse and jobs pages now load results in batches with a Load More button, improving page performance as the tech base grows.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "API Rate Limiting",
    description:
      "Rate limiting added to all sensitive API routes (signup, checkout, bookings, jobs, admin) to prevent abuse and protect platform stability.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Smarter Rate Display on Browse",
    description:
      "Browse cards now show the rate for the specific role you're filtering by, instead of a generic range. Filtering by A1 shows the A1 rate.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Edit Profile Progressive Disclosure",
    description:
      "Profile editing now uses collapsible sections with completion indicators. Sections auto-expand when they have data, reducing page overwhelm for new users.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Specialization Search on Browse",
    description:
      "Filter technicians by specialization (FOH Mixing, RF Coordination, LED Wall, etc.) in addition to role. Text search now also matches specializations.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Mobile Responsive Pass",
    description:
      "Grid layouts across dashboard, profiles, projects, billing, and other pages now stack properly on phones and small screens.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Admin Dashboard",
    description:
      "Platform admin dashboard with real-time stats, user management, booking overview, and 30-day signup trends.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Career Highlights on Profiles",
    description:
      "Technicians can now add up to 10 notable credits and career milestones to their profile. Highlights display on the public profile under the About tab.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Password Reset Flow",
    description:
      "Users can now reset their password via email from the login page. Includes email verification and secure password update.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Job Board Launched",
    description:
      "Producers can now post job listings and techs can apply with one click using their Truss profile. Browse open positions at /jobs. First 3 posts are free.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Role-Based Splash Page",
    description:
      "The homepage now shows only the hero until visitors choose 'I'm a Technician' or 'I'm a Producer,' then reveals tailored content with role-specific messaging.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Content" as const,
    title: "Crew Roles Updated",
    description:
      "Added Lead Technician, Teleprompter Operator, Breakout Operator, and Power/Electrical Technician to the crew role taxonomy.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Producer Navigation Update",
    description:
      "Invoices and Billing pages are now accessible from the top navigation bar, mobile menu, and profile dropdown for producer accounts.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Server-Side Booking Security",
    description:
      "All booking creation, status transitions, and financial calculations now run server-side. Checkout amounts are read from the database instead of client requests. Status transitions are enforced via a state machine with role-based access control.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Splash Page Animations",
    description:
      "Added shimmer text on the hero headline, hover-lift on value prop cards, floating glow on the Truss icon, and fade-up section entrances. All CSS-only, no JS libraries.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Quick Invite by Name",
    description:
      "Type a tech's name directly on any open role slot to search and send a booking request. Results prioritize skill matches, past crew, and saved techs.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Inline Tech Finder",
    description:
      "Find and book technicians without leaving your project page. The new slide-out panel shows your past crew and saved techs first, with one-click save and filter toggles.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Clone Project with Crew Re-Invite",
    description:
      "Clone any past project to reuse its roles and crew. Check 're-invite same crew' to send booking requests to the same techs with one click.",
  },
  {
    date: "Feb 21, 2026",
    tag: "Feature" as const,
    title: "Show-Type Templates",
    description:
      "Start a new project with pre-built crew templates for Corporate General Session, Concert, Trade Show, Broadcast, Gala, and Conference formats.",
  },
  {
    date: "Feb 20, 2026",
    tag: "Feature" as const,
    title: "Multi-City Availability",
    description:
      "Technicians can now list availability in multiple cities. Travel-ready techs show up in every market they cover.",
  },
  {
    date: "Feb 20, 2026",
    tag: "Feature" as const,
    title: "Freetext Gear Field",
    description:
      "Add any gear to your profile — not just what's in our dropdown. If you own it or know it, list it.",
  },
  {
    date: "Feb 18, 2026",
    tag: "Feature" as const,
    title: "Dual-Role Accounts",
    description:
      "Work as both a technician and a producer from a single account. Switch roles from the navbar without logging out.",
  },
  {
    date: "Feb 15, 2026",
    tag: "Content" as const,
    title: "Rate Guide Launch",
    description:
      "Published the definitive AV technician rate guide — day rates for 24 roles across 10 major US markets.",
  },
  {
    date: "Feb 12, 2026",
    tag: "Content" as const,
    title: "Career Guide Launch",
    description:
      "How to become an AV technician: roles, skills, certifications, and how to land your first gig.",
  },
  {
    date: "Feb 1, 2026",
    tag: "Launch" as const,
    title: "Truss Is Live",
    description:
      "The marketplace for corporate AV technicians and event producers is officially open. Create your profile, set your rate, get discovered.",
  },
];

const INDUSTRY_EVENTS = [
  {
    abbrev: "ISE 2026",
    name: "Integrated Systems Europe",
    dates: "Feb 3–6, 2026",
    location: "Barcelona, Spain",
    description:
      "The world's largest AV and systems integration trade show. Pro audio, digital signage, unified communications, and live events tech.",
  },
  {
    abbrev: "USITT 2026",
    name: "United States Institute for Theatre Technology",
    dates: "Mar 18–21, 2026",
    location: "Milwaukee, WI",
    description:
      "Conference and stage expo for lighting, sound, staging, and rigging professionals in the performing arts and live entertainment.",
  },
  {
    abbrev: "NAB Show 2026",
    name: "National Association of Broadcasters",
    dates: "Apr 12–16, 2026",
    location: "Las Vegas, NV",
    description:
      "Broadcast, media, and entertainment technology. Covers live production, streaming, content creation, and post-production.",
  },
  {
    abbrev: "InfoComm 2026",
    name: "InfoComm International",
    dates: "Jun 7–13, 2026",
    location: "Orlando, FL",
    description:
      "The premier event for the professional AV industry. Networking, certification, and the latest in projection, LED, audio, and control systems.",
  },
  {
    abbrev: "LDI 2026",
    name: "Live Design International",
    dates: "Nov 16–22, 2026",
    location: "Las Vegas, NV",
    description:
      "The go-to show for lighting, staging, and live event production. Gear demos, workshops, and industry networking.",
  },
];

const TAG_STYLES: Record<string, string> = {
  Feature: "bg-signal-orange/15 text-signal-orange",
  Content: "bg-blue-500/15 text-blue-400",
  Launch: "bg-emerald-500/15 text-emerald-400",
};

export default function NewsPage() {
  return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">
            Stay in the Loop
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2">
            TRUSS <span className="text-signal-orange">NEWS</span>
          </h1>
          <p className="text-sm text-aluminum/65 mt-3 max-w-xl mx-auto">
            Platform updates, new features, and upcoming industry events.
          </p>
        </div>

        {/* ===== PLATFORM UPDATES ===== */}
        <section className="mb-20">
          <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-8">
            Platform Updates
          </h2>
          <div className="relative border-l-2 border-signal-orange/20 pl-6 space-y-8">
            {PLATFORM_UPDATES.map((update, i) => (
              <div key={i} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blackout border-2 border-signal-orange/40" />
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-[11px] text-aluminum/60">
                    {update.date}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${TAG_STYLES[update.tag]}`}
                  >
                    {update.tag.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold tracking-wide mb-1">
                  {update.title}
                </h3>
                <p className="text-sm text-aluminum/65 leading-relaxed">
                  {update.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== INDUSTRY CALENDAR ===== */}
        <section className="mb-20">
          <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-8">
            Industry Calendar 2026
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {INDUSTRY_EVENTS.map((event, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05] hover:border-signal-orange/15 transition-colors"
              >
                <div className="font-heading text-sm font-bold tracking-wider uppercase text-signal-orange mb-1">
                  {event.abbrev}
                </div>
                <div className="text-[11px] text-aluminum/50 font-mono mb-2">
                  {event.name}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                  <span className="text-xs text-house-lights/70">
                    {event.dates}
                  </span>
                  <span className="text-[10px] text-aluminum/50">
                    {event.location}
                  </span>
                </div>
                <p className="text-[12px] text-aluminum/60 leading-[1.7]">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="text-center py-12 border-t border-ink/[0.03]">
          <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Stay Connected with <span className="text-signal-orange">Truss</span>
          </h2>
          <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
            Create your free account to get platform updates and be the first to
            know about new features.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            Sign Up Free
          </Link>
        </section>
      </main>
  );
}