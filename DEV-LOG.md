# Truss Development Log

> Two-sided AV labor marketplace built across Feb 18–20, 2026.
> Built with Next.js 15, Supabase, Stripe, Tailwind v4, and Claude Code.

---

## Day 1 — Feb 18, 2026 (Night)

### Session 1: Foundation (10:34pm – 5:52am)

Started from `create-next-app`. Built the entire core platform in one overnight session.

**What got built:**
- Landing/splash page with value prop for both techs and producers
- Full auth flow — signup, login, email confirmation, user type selection (tech/producer)
- Profile editor connected to Supabase (display name, city, skills, gear, bio, rate)
- Public tech profile page with skills, gear, ratings, stats
- Browse/marketplace page with search, skill filters, sort options
- Booking flow — project creation, booking modal, bookings dashboard
- Real-time messaging system (conversations + messages)
- Avatar uploads via Supabase Storage
- Portfolio section for techs
- Role taxonomy with 6 departments, 22+ roles from `taxonomy.ts`

**Design system established:**
- Blackout (#0D0D0D) backgrounds, deep-stage (#1A1A2E) cards
- Signal-orange (#FF4D00) accent, house-lights (#F5F0EB) text, aluminum (#8A8A8A) secondary
- Oswald for headings, Source Sans 3 for body, JetBrains Mono for data
- Tailwind v4 with `@theme` in globals.css (no tailwind.config)

**Bug fixes during session:**
- Tailwind v4 compatibility fixes
- Browse page URL params fix
- Avatar upload/display issues
- Build errors from missing dependencies

---

## Day 2 — Feb 19, 2026

### Session 2: Monetization & Enterprise Features (4:00pm – 7:00pm)

**What got built:**
- Stripe integration — checkout, deposits, payment processing
- Enterprise billing — rate cards, OT/DT multipliers, invoicing, prepaid deposits, PO numbers
- Notification system — in-app notifications with bell icon
- Review system — 5-dimension ratings (skill, punctuality, professionalism, communication, overall)
- XP engine — points for completing gigs, getting reviews, maintaining high ratings
- Tier system — New → Verified → Established → Top Rated → Premier
- Tech dashboard — earnings, upcoming gigs, stats, reputation progress bar
- Availability calendar — techs mark dates as available/unavailable
- Insurance fields — techs declare coverage, producers filter for insured techs

### Session 3: Social & Communication (6:00pm – 8:00pm)

**What got built:**
- Digital business cards at `/card/[id]` — shareable mini-profiles
- Favorites system — producers save techs for later
- Crew sheets — producers organize saved techs by project
- Email notifications via Resend — booking requests, acceptances, confirmations, declines, completions, reviews, level-ups, gig reminders
- Splash page redesign with invoice mockup section

### Session 4: Polish & Fixes (8:00pm – 12:00am)

**Stability work:**
- Lazy-init pattern for Stripe, Resend, Supabase to fix Vercel builds without env vars
- Fix Stripe API version for production
- Fix splash page button click handlers (Next.js Link + onClick interaction)
- Email confirmation screen after signup
- Skill-based rate ranges on profiles and booking modal
- Producer buttons auto-select producer type on signup
- Professional tier system — removed gamey UI, clean badges
- Auto-verification after first 4+ star review
- Fixed messaging — Msg button opens existing conversations or creates new ones
- Restored bookings page that was accidentally overwritten
- Fixed nav links showing/hiding based on profile load state
- Removable skill chips, LinkedIn and website URL fields
- Fixed missing booking request notifications in BookingModal
- Calendar sync (iCal feed), day-before gig reminders, phone collection

---

## Day 3 — Feb 20, 2026

### Session 5: 10 Features Sprint (1:00am – 2:00am)

Single commit added 10 features from a pre-planned feature list:

1. **Book Again** — prefill booking modal from completed bookings
2. **Search by Date** — date range filter on browse, checks availability + existing bookings
3. **SMS Notifications** — Twilio integration for booking alerts and gig reminders
4. **Check-in/Check-out** — clock in/out on paid bookings, tracks actual hours
5. **Invoice PDF** — jsPDF generation with company info, booking table, totals
6. **Profile Analytics** — track profile views and browse appearances, show on dashboard
7. **Bulk Booking** — "Fill All Roles" on projects, batch-send booking requests
8. **Cancellation Policy** — flexible/24hr/48hr/72hr options on tech profiles
9. **Referral System** — unique referral codes, 200 XP reward on first completed gig
10. **Map View** — Leaflet + OpenStreetMap toggle on browse page with city markers

### Session 6: Content, Security, Legal (2:00am – 4:00am)

**What got built:**
- `/rates` — AV Technician Rate Guide 2026, 24 roles × 10 cities, SEO-optimized
- Removed persistent "Powered by Claude" badge (kept subtle footer one)
- **Row Level Security audit** — RLS policies for all 17 Supabase tables
  - `supabase-rls-policies.sql` with ownership-based access control
  - `supabase-admin.ts` — lazy-init service role client (Proxy pattern) for API routes
  - Webhook, cron, and calendar routes switched to admin client
  - Fixed `portfolio_items` RLS (uses `tech_profile_id`, not `tech_id`)
- `/learn` — "How to Become an AV Technician" career guide, SEO meta tags
- `/terms` — Terms of Service (from drafted PDF)
- `/privacy` — Privacy Policy (ethical approach: plain-language summary, specific data tables, "What We Don't Collect" section, no-sell commitment, CCPA compliance)
- Linked terms + privacy from signup page

### Session 7: UX Overhaul — 6 Priorities (3:50am – 4:45am)

Built from `UX-FIXES.md`, each as a separate feature branch:

**Priority 1 — Post-Signup Onboarding Wizard** (`/onboarding`)
- 3-step flow: Name+City → Role (tech) or Company (producer) → Rate or Event City
- Step indicator with progress bar
- Redirects from dashboard/projects if profile incomplete
- Welcome banner on profile page after completion

**Priority 2 — Progressive Disclosure on Edit Profile**
- Profile completeness bar with specific prompts ("Add a photo +15%")
- Collapsed specializations (expandable if roles selected)
- Collapsed per-skill rates (only shown with 2+ roles)
- Collapsed insurance and cancellation policy sections
- Auto-expands sections that already have data

**Priority 3 — Browse Empty/Sparse State**
- Rich empty state (0 results) with "Notify Me" button
- Sparse results banner (<10 results) with "Notify Me"
- Both save to `saved_searches` table (producer_id, filters JSONB)

**Priority 4 — Post-Signup Email Sequence**
- Day 1: "Your profile is live" — link to profile, remind about photo
- Day 3: "Complete your profile" — lists specific missing items (tech only)
- Day 7: "Rate guide + career resources" — links to /rates and /learn (tech only)
- Cron at `/api/cron/onboarding-emails`, tracks progress via `onboarding_email_sent` column
- Vercel cron configured: daily at 2pm UTC

**Priority 5 — Mobile Responsive Pass**
- NavBar: mobile nav links in dropdown with backdrop overlay
- Browse: collapsible filters on mobile, fixed search min-width
- Profile: stats grid 3→5 col responsive, skills/gear stack, CTA buttons wrap
- Edit profile: form grids stack to 1 column, full-width save button
- Dashboard: analytics grid stacks, completeness nudge wraps

**Priority 6 — Browse Page Guidance**
- "How Truss works" banner for first-time producers (1→2→3 steps)
- Dismissed permanently via localStorage
- Filter hint when no filters active
- "View Profile →" text appears on card hover

### Session 8: Splash Page Redesign (Night)

Revisited the splash page with full knowledge of every feature built across 3 days. The original was written on day 1 before most features existed.

**What changed:**
- Removed full "The Problem" section — merged into 4 compact contrast chips in the hero
- Replaced 6 generic tech feature cards with 3 visual pillar mockups:
  - Profile card (avatar, rating, tier badge, skills)
  - Tier progression bar (New → Verified → Established → Top Rated → Premier)
  - Mini dashboard (day rate, views, availability calendar)
- Added Department Showcase — 6 cards rendered from `taxonomy.ts` (Audio, Video, Lighting, Staging, IT, Production)
- Added browse preview mockup in For Producers section (3 fake tech cards)
- Added Resources section with links to `/rates` and `/learn` (previously unreachable from splash)
- Condensed Enterprise Billing — removed invoice mockup (~50 lines) and billing option cards, kept checklist + compact billing strip
- Added Resources column to footer (Rate Guide, Career Guide)
- Added "Read the Rate Guide →" link to final CTA
- Removed mini rate table from splash (rates are estimates, not real platform data yet)
- Added disclaimer banner to `/rates` page noting estimates pending real data

**Design decisions:**
- All mockup data hardcoded (no new Supabase queries on splash)
- Imported `DEPARTMENTS` from `taxonomy.ts` for department cards
- Kept hero animations, Truss Promise, and producer 4-step flow intact

---

## Architecture Summary

### Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 (theme in globals.css)
- **Database:** Supabase (Postgres + Auth + Storage + Realtime)
- **Payments:** Stripe (checkout, deposits)
- **Email:** Resend (transactional emails)
- **SMS:** Twilio (booking alerts, reminders)
- **PDF:** jsPDF + jspdf-autotable (invoices)
- **Maps:** Leaflet + react-leaflet + OpenStreetMap
- **Hosting:** Vercel

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/taxonomy.ts` | 6 departments, 22+ roles, specializations, gear |
| `src/lib/supabase.ts` | Client-side Supabase (anon key) |
| `src/lib/supabase-admin.ts` | Server-side Supabase (service role, lazy Proxy) |
| `src/lib/email.ts` | All Resend email templates |
| `src/lib/sms.ts` | Twilio SMS functions |
| `src/lib/xp-engine.ts` | XP calculations, level-ups, badge awards |
| `src/lib/notifications.ts` | In-app + email + SMS notification dispatch |
| `src/lib/invoice-pdf.ts` | PDF invoice generation |
| `src/lib/city-coords.ts` | Lat/lng for 25 US cities (map view) |
| `src/components/NavBar.tsx` | Sticky nav with mobile dropdown |
| `src/components/BookingModal.tsx` | Multi-step booking flow |
| `src/components/TechMapView.tsx` | Leaflet map of tech locations |
| `src/components/BulkBookingModal.tsx` | Batch booking for project roles |
| `supabase-rls-policies.sql` | RLS policies for all 17 tables |

### Database (17 tables)
`profiles` · `tech_profiles` · `projects` · `project_roles` · `bookings` · `reviews` · `conversations` · `conversation_participants` · `messages` · `notifications` · `availability` · `portfolio_items` · `earned_badges` · `badges` · `favorites` · `profile_views` · `saved_searches` · `referrals`

### Cron Jobs
| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/reminders` | 9am UTC daily | Day-before gig reminders (email + SMS) |
| `/api/cron/onboarding-emails` | 2pm UTC daily | Post-signup email sequence (day 1/3/7) |

---

## Commit Count by Category

| Category | Commits |
|----------|---------|
| Core features | 12 |
| Enterprise/billing | 4 |
| Social/communication | 3 |
| Content pages | 4 |
| Security (RLS) | 2 |
| UX improvements | 6 |
| Splash redesign | 3 |
| Bug fixes | 18 |
| Deploy/config | 4 |
| **Total** | **56** |

---

*Built by Lazarus with Claude Code (Opus 4.6). 56 commits. 3 days. Zero to production.*
