# BACKLOG.md — Master Feature List

Everything discussed, organized by status and priority. This is the single source of truth for what to build.

---

## BUILT & DEPLOYED
- [x] Marketplace (browse, filter, search)
- [x] Tech profiles (skills, bio, rates, gear, photo, availability)
- [x] Producer profiles and project creation
- [x] Booking flow (request, accept, confirm, complete)
- [x] Three billing methods (credit card, invoice, prepaid)
- [x] Messaging system
- [x] Review system
- [x] Notification system + notification preferences
- [x] Email notifications (Resend)
- [x] Reputation system (tiers: New → Verified → Established → Top Rated → Premier)
- [x] Industry taxonomy (6 departments, 30 roles, 100+ specializations, 80+ gear)
- [x] Per-skill rate cards
- [x] Favorites list
- [x] Availability calendar
- [x] Profile photos / avatar upload
- [x] Splash page with role-based content split
- [x] Terms of Service (19 sections)
- [x] Privacy Policy
- [x] Rate Guide page (/rates)
- [x] Professional UI (removed gamification)
- [x] Learn page (/learn) — "How to Become an AV Technician"
- [x] Day Rate Calculator (/tools/day-rate-calculator)
- [x] RF Coordination Cheat Sheet (/tools/rf-coordination)
- [x] Power Calculator (/tools/power-calculator)
- [x] Signal Flow Simulator (/tools/signal-flow)
- [x] Contract Templates (/tools/contract-templates)
- [x] Post-signup onboarding wizard (3 steps)
- [x] Post-signup email sequence (Day 1, Day 3, Day 7)
- [x] Empty state on browse page
- [x] Browse page guidance for first-time producers
- [x] Supabase RLS on all 17 tables
- [x] Server-side booking mutations with status state machine

## BUILT BY CLAUDE CODE (needs testing/verification)
- [ ] Book Again button
- [ ] Search by date
- [ ] SMS notifications (Twilio — skip for now, no account)
- [ ] Check-in / check-out
- [ ] Invoice PDF export
- [ ] Profile analytics
- [ ] Bulk booking
- [ ] Cancellation policy settings
- [ ] Referral system
- [ ] Map view (Leaflet)

## READY TO BUILD

### UX
- [x] Progressive disclosure on edit profile page
- [x] Mobile responsive pass (grid layouts audited and fixed)

### Platform Features
- [ ] Google Places API for city autocomplete (replace metro areas with precise location + radius search when scale justifies it)
- [x] Career Highlights on tech profiles — up to 10 notable credits/achievements (title, year, optional description), self-reported, displayed on public profile
- [x] Admin dashboard (view all users, bookings, revenue, disputes)
- [x] Password reset flow
- [x] Search by specialization on browse
- [x] Smarter rate display on browse cards
- [x] Saved searches with alerts for producers
- [x] Rate analytics for techs ("techs like you charge $X")
- [ ] Insurance partnership integration

### Free Tools (future)
- [ ] Gear Comparison Tool — needs comprehensive spec database assembled first
- [x] Cable Bible — connector reference with pinouts and specs
- [x] Show Calculator — input event details, outputs crew and gear recommendations

### AI Features
- [x] Smart Search — natural language crew search ("find me 2 A1s in San Diego under $75/hr for March 15")
- [x] Profile Assistant — AI helps techs write bios and optimize profiles
- [x] Producer Copilot — AI builds crew plans based on event description
- [x] Market Intelligence — rate benchmarking, demand trends, career advice from real data
- [ ] Autonomous Crew Coordination — AI handles full booking workflow

### Job Board
- [x] Producers post jobs from existing account (Jobs tab on Projects page)
- [x] Job posting flow (title, role, city, employment type, pay range, pay type, description, requirements)
- [x] Database: `jobs` and `job_applications` tables with RLS
- [x] Public /jobs page with filters (role, city, employment type, pay sort)
- [x] One-click apply using Truss profile
- [x] Employer dashboard: see applicants with profiles, skills, ratings, tier; shortlist/hire/reject
- [x] Revenue model: 3 free posts, paywall after (Stripe integration pending)
- [x] SEO pages for job listings (/jobs/city/[slug] and /jobs/role/[role], SSG)

### Revenue Features
- [ ] Premium producer tools (priority placement, bulk tools, API access)
- [ ] Training marketplace (partner with certification providers)
- [ ] Payroll processing
- [ ] Same-day pay (advance on confirmed bookings)
- [ ] Equipment insurance referrals

### Community Forum (Replaces Discord)

**Why forum over Discord:** Discord is off-platform, we don't own the data, content isn't indexable by search engines, and posts aren't tied to Truss profiles. An on-platform forum where a Grammy audio mixer's answer to a wireless question lives on their Truss profile is vastly more valuable.

**Core features:**
- [x] Forum at /forum — threaded discussion board
- [x] Categories mapped to the 6 AV departments (Audio, Video, Lighting, Staging & Rigging, IT & Networking, Production & Management) plus General, Gear Talk, Rate Discussion
- [x] Posts and comments tied to user's Truss profile — display name, avatar, role, reputation tier, and verified skills shown alongside every post
- [x] Authority signal: users with relevant skills get a subtle "Verified Skill" indicator on their posts
- [x] Upvote system on answers ("helpful" marks that surface good answers)
- [x] Profile page shows forum activity — visible to producers
- [x] Tables: `forum_categories`, `forum_posts`, `forum_comments`, `forum_helpful_marks`
- [x] Moderation: report button, admin can hide/delete/lock
- [x] SEO: forum posts indexable

**Authority mechanics:**
- [ ] "Top Contributors" leaderboard per category (by helpful marks, not post count)
- [ ] Profile badge: "Top Audio Contributor" etc. — earned by sustained helpful participation
- [ ] Producers can see forum activity when reviewing a tech's profile

**Content moderation (legal):**
- [ ] Content guidelines in TOS (no spam, no rate-fixing discussion, no harassment)
- [x] Report mechanism on all posts and comments
- [x] Admin moderation queue (hide/lock/pin via API)
- [ ] Attorney review: does hosting rate discussion threads create antitrust exposure?

### Gear Wiki

**What it is:** Crowdsourced knowledge base for every piece of AV gear in the taxonomy. Each gear item gets a wiki page where users contribute real-world notes, tips, gotchas, and anecdotes.

**Why it matters:** Shure's docs tell you specs. The wiki tells you what the Grammy A1 learned the hard way about Axient networking in a 40-channel RF environment. That practitioner knowledge doesn't exist in structured form anywhere online.

**Core features:**
- [x] Wiki at /wiki — one page per gear item in taxonomy.ts
- [x] Auto-generated stub pages for all 120+ gear items
- [x] User contributions: "Add a note" — short-form with the user's profile attached
- [x] Note categories: "Tips & Tricks", "Known Issues", "Compatibility Notes", "Show Stories"
- [x] Each note shows contributor's name, role, reputation tier, and relevant skills
- [x] Upvote on notes to surface the best ones
- [x] Q&A section on each gear page — users ask questions, others answer (Stack Overflow style, scoped to specific gear)
- [x] Answers can be marked "accepted" by the question asker
- [x] Tables: `wiki_page_stats`, `wiki_notes`, `wiki_questions`, `wiki_answers`, `wiki_helpful_marks`
- [x] SEO: wiki pages indexable ("/wiki/shure-axient")

**Auto-hotlinking (forum → wiki):**
- [ ] Forum posts mentioning gear items from taxonomy.ts auto-link to wiki pages
- [ ] Server-side on save (store as markdown links, avoids re-processing on render)

**IP considerations (for attorney):**
- [ ] Wiki contribution license terms (Creative Commons style — user retains ownership, Truss gets perpetual display license)
- [ ] Manufacturer trademark usage: fair use for factual/informational purposes, confirm with attorney

### Content Updates
- [x] Freelance AV Tax Guide with "No Tax on Overtime" (One Big Beautiful Bill Act), 1099 vs W-2, deductions, quarterly payments, S-Corp election
- [x] Add disclaimers to all /tools and /rates pages

### Data & Content
- [x] VenueSpec — crowdsourced venue technical specs from techs
- [ ] "State of AV Labor" annual report from marketplace data
- [ ] Blog / content marketing section
- [ ] Rate data API for enterprise subscribers

### Infrastructure & Security
- [x] Verify Stripe/Resend keys are server-side only (audited — all in API routes and server libs only)
- [ ] Supabase Pro plan for backups
- [ ] UptimeRobot monitoring
- [x] Rate limiting on API routes
- [ ] Staging Supabase project for dev
- [ ] Error monitoring (Sentry or similar)
- [x] Database pagination on bookings/browse (display pagination with Load More)
- [x] Clean up duplicate page versions in codebase (removed dead xp-engine.ts client, added .gitignore for supabase temp)

### Legal & Business
- [ ] Attorney consultation ($2,500-4,000)
- [ ] LLC formation
- [ ] Trademark TRUSS
- [ ] E&O insurance for platform
- [ ] Formal dispute resolution process

---

## BUILD ORDER

### Month 3-4 (after core marketplace is stable)
- Forum v1 (categories, posts, comments, profile integration)
- Wiki v1 (auto-generated stub pages, user notes, basic search)
- Auto-hotlinking (forum → wiki)

### Month 5+
- Authority badges and top contributor mechanics
- Forum moderation tools
- Wiki note categories and upvoting
- SEO optimization for forum and wiki pages
