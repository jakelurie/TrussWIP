# CLAUDE.md — Project Context (Auto-Read)

## Founder

Uri Leshner. AV industry veteran. Based in San Francisco. Building Truss solo with AI tools.

## Communication Style

- Direct and fast-paced. Doesn't want hand-holding or excessive explanations.
- Prefers action over deliberation. "Let's do it" means start immediately.
- Will push back if something feels wrong — trust that instinct.
- Asks broad creative questions — match that energy instead of defaulting to caution.

## Design & Product Preferences

- Professional over playful. Industry tool, not a game.
- Gamification should be subtle — reputation tiers (New, Verified, Established, Top Rated, Premier) not levels, XP bars, or emoji badges.
- Content should be authoritative and factual, not personal or narrative-driven.
- AI features should feel seamlessly useful, not shoehorned. "Blatantly obviously useful" is the bar.
- The founder prefers to stay behind the brand. Don't insert founder stories into product content.

## What Not To Do

- Don't over-explain or add unnecessary caveats.
- Don't suggest being cautious about building things. If he wants to build it, build it.
- Don't create README files unless asked.
- Don't add emoji-heavy or gamified UI elements.
- Don't make content sound like a personal blog or founder story.
- Don't repeatedly suggest stopping to get users — he knows.

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS with custom design tokens
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Payments:** Stripe (checkout sessions, webhooks)
- **Email:** Resend (domain: trusswork.org, DKIM verified, working)
- **Hosting:** Vercel (auto-deploys on git push to main)
- **Font:** Oswald (headings) + system mono (data)

## Design Tokens (tailwind.config.ts)

- `blackout` — #0A0A0A (page background)
- `deep-stage` — #141414 (card backgrounds)
- `house-lights` — #E8E6E3 (primary text)
- `aluminum` — #8A8A8A (secondary text)
- `signal-orange` — #FF4D00 (brand accent)
- `go-green` — #00C853
- `standby-amber` — #FFB300
- `cue-blue` — #4A9EFF

## Key Architecture

- Taxonomy file at `src/lib/taxonomy.ts` is foundational — 6 departments, 24 roles (expanding to 30), 100+ specializations, 80+ gear items. Use it everywhere.
- Two user types: `tech` and `producer`. Role-based rendering throughout.
- Booking pipeline: pending → accepted → confirmed → paid → completed
- Platform fee: 10% on all bookings
- Three billing types: credit card (Stripe), invoice (Net 15/30), prepaid balance

## Reputation System

| Tier | XP Threshold | Color |
|------|-------------|-------|
| New | 0 | Gray |
| Verified | 1,000 | Blue |
| Established | 3,000 | Purple |
| Top Rated | 6,000 | Orange |
| Premier | 10,000 | Gold |

Presented professionally — no gamification language visible to users.

## Development Workflow

- Use feature branches, not direct commits to main
- Vercel creates preview deployments for non-main branches
- Active pages are `page.tsx` — old versions (page-polished.tsx, page-redesigned.tsx) can be deleted
- Shared logic in `src/lib/`, reusable UI in `src/components/`
- Write descriptive commit messages (e.g. "added career highlights to tech profiles" not "fixed stuff")
- One feature per branch. Build it, test it, merge it. Then start the next one.
- After completing a feature, update BACKLOG.md to mark it done
- When bugs are found, check the screenshot if provided before asking clarifying questions

## Current Priorities

See BACKLOG.md for the full feature list and build order.
See HANDOFF.md for complete database schema, file structure, and feature documentation.
See UX-FIXES.md for onboarding and UI improvement specs.

## Strategic Context

- Truss is a two-sided AV labor marketplace. Techs build profiles, producers book them.
- The moat is the structured industry taxonomy + market data + AI. Not the code.
- Currently pre-revenue, recruiting first users in San Diego.
- Revenue streams: platform fee (10%), job board (future), premium tools (future), market data API (future).
- Go-to-market: San Diego → LA, Vegas → national.
