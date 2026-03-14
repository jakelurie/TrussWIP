# TRUSS — Developer Handoff Document
## Last Updated: February 21, 2026

---

## WHAT IS TRUSS?

Truss is a two-sided marketplace connecting **AV technicians** (freelance audio, video, lighting, staging, IT, and production professionals) with **event producers** (companies and individuals who need to staff live/corporate events). Think "LinkedIn meets Uber for the corporate AV industry."

**Live at:** https://trusswork.org
**Repo:** GitHub (private) — deployed to Vercel via git push
**Creator:** Uri Leshner (San Francisco, CA)

**Also read:** FOUNDER.md (working preferences), BACKLOG.md (master feature list), UX-FIXES.md (onboarding improvements), BUSINESS-PLAN.md (strategy), YEAR-PLAN.md (12-month roadmap)

---

## TECH STACK

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS with custom design tokens
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Payments:** Stripe (checkout sessions, webhooks)
- **Email:** Resend (domain: trusswork.org — DKIM verified, emails working)
- **Hosting:** Vercel (auto-deploys on git push to main)
- **Font:** Oswald (headings) + system mono (data)

### Design Tokens (defined in tailwind.config.ts)
- `blackout` — #0A0A0A (page background)
- `deep-stage` — #141414 (card backgrounds)
- `house-lights` — #E8E6E3 (primary text)
- `aluminum` — #8A8A8A (secondary text)
- `signal-orange` — #FF4D00 (brand accent)
- `go-green` — #00C853
- `standby-amber` — #FFB300
- `cue-blue` — #4A9EFF

---

## ENVIRONMENT VARIABLES (Vercel + .env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://dfrgjnrvcoajvpcuncig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
STRIPE_SECRET_KEY=sk_live_<key>
RESEND_API_KEY=re_UHtGanqh_2s8t3t6yrQJchNpvjzqtsu6a
NEXT_PUBLIC_SITE_URL=https://trusswork.org
```

---

## DATABASE SCHEMA (Supabase)

### profiles
- `id` (uuid, PK, = auth.users.id)
- `display_name` (text)
- `email` (text)
- `user_type` ("tech" | "producer")
- `city` (text)
- `avatar_url` (text)
- `is_verified` (boolean)
- `billing_type` ("credit_card" | "invoice" | "prepaid")
- `company` (text) — for producers
- `company_name` (text)
- `payment_method` (text)
- `po_number` (text)
- `referral_code` (text, unique) — auto-generated for referral system

### tech_profiles
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles.id)
- `primary_skill` (text) — short name like "A1", "V1"
- `skills` (text[]) — array of short names
- `specializations` (text[]) — array of specialization strings
- `gear` (text[]) — array of gear names
- `bio` (text)
- `years_experience` (integer)
- `hourly_rate` (integer) — default rate
- `skill_rates` (jsonb) — { "A1": 65, "A2": 45 } per-role rates
- `available` (boolean)
- `level` (integer, 0-4)
- `xp` (integer)
- `completed_gigs` (integer)
- `avg_rating` (numeric)
- `review_count` (integer)
- `profile_complete` (integer, 0-100)
- `has_insurance` (boolean)
- `insurance_type` (text)
- `insurance_provider` (text)
- `cancellation_policy` (text, default 'flexible')

### projects
- `id` (uuid, PK)
- `producer_id` (uuid, FK → profiles.id)
- `name` (text)
- `city` (text)
- `venue` (text)
- `start_date` (date)
- `end_date` (date)
- `status` ("draft" | "active" | "completed" | "cancelled")
- `notes` (text)
- `created_at` (timestamptz)

### project_roles
- `id` (uuid, PK)
- `project_id` (uuid, FK → projects.id)
- `skill` (text) — role short name
- `quantity` (integer)
- `filled` (integer)

### bookings
- `id` (uuid, PK)
- `project_id` (uuid, FK → projects.id)
- `project_role_id` (uuid, FK → project_roles.id)
- `producer_id` (uuid, FK → profiles.id)
- `tech_id` (uuid, FK → profiles.id)
- `status` ("pending" | "accepted" | "confirmed" | "declined" | "paid" | "completed" | "cancelled")
- `rate` (numeric)
- `total_hours` (numeric)
- `total_amount` (numeric)
- `platform_fee` (numeric)
- `notes` (text)
- `po_number` (text)
- `payment_method` (text)
- `reviewed` (boolean)
- `checked_in_at` (timestamptz)
- `checked_out_at` (timestamptz)
- `actual_hours` (numeric)
- `sent_at` / `responded_at` / `confirmed_at` / `completed_at` (timestamptz)
- `created_at` (timestamptz)

### reviews
- `id` (uuid, PK)
- `booking_id` (uuid, FK → bookings.id)
- `tech_id` (uuid, FK → profiles.id)
- `producer_id` (uuid, FK → profiles.id)
- `rating` (integer, 1-5)
- `comment` (text)
- `subcategories` (jsonb) — { punctuality: 5, communication: 4, skill: 5 }
- `created_at` (timestamptz)

### profile_views
- `id` (uuid, PK)
- `tech_user_id` (uuid, FK → profiles.id)
- `viewer_id` (uuid, FK → profiles.id, nullable)
- `viewed_at` (timestamptz)
- `source` (text, default 'profile')

### referrals
- `id` (uuid, PK)
- `referrer_id` (uuid, FK → profiles.id)
- `referred_id` (uuid, FK → profiles.id, nullable)
- `referred_email` (text)
- `status` (text, default 'pending')
- `reward_given` (boolean, default false)
- `created_at` (timestamptz)
- `completed_at` (timestamptz)

### conversations / messages / conversation_participants
Standard messaging schema. Conversations have participants, messages belong to conversations.

### favorites
- `id` (uuid, PK)
- `producer_id` (uuid, FK)
- `tech_id` (uuid, FK)

### portfolio_items
- `id` (uuid, PK)
- `tech_id` (uuid, FK)
- `title` (text)
- `description` (text)
- `photo_url` (text)
- `tags` (text[])

### availability
- `id` (uuid, PK)
- `tech_id` (uuid, FK)
- `date` (date)
- `status` ("available" | "booked" | "unavailable")

### badges / earned_badges
Predefined badges (e.g., "First Gig", "50 Gigs", "5-Star Streak") and which techs have earned them.

### notifications
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `type` (text)
- `title` (text)
- `body` (text)
- `read` (boolean)
- `created_at` (timestamptz)

---

## FILE STRUCTURE

```
src/
├── app/
│   ├── page.tsx                    — Splash/landing page
│   ├── layout.tsx                  — Root layout
│   ├── globals.css                 — Tailwind + custom styles
│   ├── signup/page.tsx             — Signup with tech/producer toggle
│   ├── login/page.tsx              — Login
│   ├── dashboard/page.tsx          — Dashboard (role-based: tech vs producer)
│   ├── edit-profile/page.tsx       — Profile editor (taxonomy-based)
│   ├── browse/page.tsx             — Tech marketplace with filters
│   ├── profile/[id]/page.tsx       — Public tech profile
│   ├── projects/page.tsx           — Project management
│   ├── project/[id]/page.tsx       — Project detail
│   ├── bookings/page.tsx           — Booking management
│   ├── messages/page.tsx           — Messaging
│   ├── favorites/page.tsx          — Saved techs
│   ├── availability/page.tsx       — Availability calendar
│   ├── billing/page.tsx            — Billing settings
│   ├── invoices/page.tsx           — Invoice history
│   ├── card/[id]/page.tsx          — Digital business card
│   ├── crew/[id]/page.tsx          — Crew sheet
│   ├── terms/page.tsx              — Terms of Service (19 sections)
│   ├── privacy/page.tsx            — Privacy Policy
│   ├── rates/page.tsx              — Public AV rate guide (SEO)
│   ├── learn/page.tsx              — "How to Become an AV Tech" (SEO)
│   ├── tools/
│   │   ├── day-rate-calculator/    — Freelance income calculator
│   │   ├── rf-coordination/        — RF frequency reference
│   │   ├── power-calculator/       — AV power draw calculator
│   │   ├── signal-flow/            — Interactive signal flow simulator
│   │   ├── cable-bible/            — Connector reference guide
│   │   ├── freelance-tax-guide/    — Tax guide for freelancers
│   │   └── contract-templates/     — Free contract/invoice templates
│   └── api/
│       ├── checkout/route.ts       — Stripe checkout session
│       ├── webhook/route.ts        — Stripe webhook handler
│       ├── deposit/route.ts        — Prepaid balance deposits
│       ├── notify/route.ts         — Email notification trigger
│       └── cron/reminders/route.ts — Gig reminder emails
├── components/
│   ├── NavBar.tsx                  — Main navigation
│   ├── BookingModal.tsx            — Booking request modal
│   ├── ReviewModal.tsx             — Post-gig review modal
│   ├── BulkBookingModal.tsx        — Multi-role booking
│   └── TechMapView.tsx             — Leaflet map view for browse
├── lib/
│   ├── supabase.ts                 — Supabase client
│   ├── taxonomy.ts                 — AV INDUSTRY TAXONOMY
│   ├── email.ts                    — Resend email templates
│   ├── notifications.ts            — In-app notification helpers
│   ├── xp-engine.ts                — Reputation point engine
│   ├── sms.ts                      — Twilio SMS (not active)
│   ├── invoice-pdf.ts              — jsPDF invoice generation
│   └── city-coords.ts              — City lat/lng for map view
└── sql/
    ├── insurance-migration.sql
    ├── skill-rates-migration.sql
    └── specializations-migration.sql
```

---

## KEY FEATURES BUILT

### For Techs
- Signup → email confirmation → login → edit profile
- Taxonomy-based profile editor: 6 departments, 24 roles, 100+ specializations, 80+ gear items
- Per-skill rates: Different hourly rates per role
- Profile photo upload (Supabase Storage)
- Reputation system: New → Verified → Established → Top Rated → Premier
- Portfolio gallery with lightbox
- Availability calendar
- Digital business card at /card/[id]
- Insurance field (self-declared)
- Check-in/check-out for gigs
- Cancellation policy settings
- Profile analytics (view counts)
- Referral system
- Dashboard with reputation progress and upcoming gigs

### For Producers
- Project creation with crew roles and quantities
- Browse marketplace with filters (skill, city, availability, insurance)
- Search by date availability
- Tech profiles with skills, rates, reviews, portfolio
- Booking flow with rate auto-fill
- Book Again from completed bookings
- Bulk booking for filling multiple roles
- Three billing types: credit card, invoice, prepaid
- Booking management with status tabs
- Crew sheets with PDF export
- Favorites and rebook
- Review system (1-5 stars + subcategories)
- Invoice PDF export
- Map view of techs (Leaflet)

### Public Pages & Tools (No Login Required)
- Rate Guide (/rates) — AV rates by role and city
- Learn (/learn) — "How to Become an AV Technician"
- Day Rate Calculator (/tools/day-rate-calculator)
- RF Coordination Cheat Sheet (/tools/rf-coordination)
- Power Calculator (/tools/power-calculator)
- Signal Flow Simulator (/tools/signal-flow)
- Cable Bible (/tools/cable-bible)
- Freelance Tax Guide (/tools/freelance-tax-guide)
- Contract Templates (/tools/contract-templates)
- Terms of Service (/terms) — 19 sections
- Privacy Policy (/privacy)

### Booking Status Pipeline
```
pending → accepted → confirmed → paid → completed
                  ↘ declined
```

### Email Notifications (7 types, via Resend)
1. Booking request received
2. Booking accepted
3. Booking confirmed
4. Booking declined
5. Gig completed
6. Review received
7. Tier unlocked (reputation milestone)

### The AV Industry Taxonomy (src/lib/taxonomy.ts)
6 departments, 24 roles (expanding to 30), role-specific specializations, and a structured gear database. This is the strategic moat.

---

## BILLING ARCHITECTURE

### Credit Card Flow
Producer → Book → Stripe Checkout → Webhook confirms → Status: "paid"

### Invoice Flow
Producer → Book → Status: "paid" immediately → PO number attached → Monthly invoice

### Prepaid Flow
Producer → Deposit via Stripe → Balance stored → Book → Balance auto-deducted

Platform fee: 10% on all bookings.

---

## REPUTATION SYSTEM

| Tier | XP Threshold | Color |
|------|-------------|-------|
| New | 0 | Gray |
| Verified | 1,000 | Blue |
| Established | 3,000 | Purple |
| Top Rated | 6,000 | Orange |
| Premier | 10,000 | Gold |

XP sources: Complete gig (+100), Earn review (+50), 5-star review (+75 bonus)

Presented professionally — no gamification language visible to users.

---

## DEVELOPMENT WORKFLOW

### Use feature branches
```bash
git checkout -b feature-name
# build and test
git checkout main
git merge feature-name
git push
```
Vercel creates preview deployments for non-main branches automatically.

### Local development
```bash
cd ~/Desktop/truss
npm run dev
```

### Database changes
Run SQL in Supabase dashboard → SQL Editor

### File convention
- Active pages are `page.tsx`
- Old versions are `page-*.tsx` (can be cleaned up)
- Shared logic in `src/lib/`
- Reusable UI in `src/components/`

---

## KNOWN ISSUES

1. Multiple page versions (page-polished.tsx, page-redesigned.tsx, etc.) — active file is always page.tsx, old versions can be deleted
2. Bookings page needs pagination at scale
3. No password reset flow
4. No admin panel
5. Supabase RLS policies need audit — URGENT before real users
6. Stripe/Resend keys need verification they're server-side only
7. Signal flow simulator has bugs — needs debugging
8. Mobile responsiveness not optimized yet

---

## SECURITY PRIORITIES

1. **Audit Supabase RLS on all tables** — ensure users can only read/write their own data
2. **Verify API keys are server-side only** — Stripe secret key and Resend key must not be in client code
3. **Upgrade to Supabase Pro** ($25/mo) for automatic backups once real users exist
4. **Add rate limiting** on API routes before scaling

---

## STRATEGIC VISION

Truss's moat is the **AV labor taxonomy** and the **market data** that flows from it. The platform starts as a marketplace but the long-term value is the intelligence layer: rate benchmarking, workforce planning, AI-powered crew matching, and industry analytics.

**AI roadmap:** Natural language crew search, profile writing assistant, producer copilot (auto-builds crew plans), market intelligence from transaction data.

**Revenue streams:** Platform fee (10%, now), job board postings (Year 2), premium producer tools (Year 2), insurance referrals (Year 2), training marketplace (Year 2+), market data API (Year 2+).

**Go-to-market:** San Diego first → LA, Vegas → national.

**Community:** Discord server for techs (planned).

See BACKLOG.md for the complete feature list and build order.
