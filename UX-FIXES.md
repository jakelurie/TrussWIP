# UX-FIXES.md — Intuition & Onboarding Improvements

Read FOUNDER.md and HANDOFF.md first for full context.

## Priority 1: Post-Signup Onboarding Flow

After a new user confirms their email and logs in for the first time, don't drop them on the dashboard. Instead, show a 3-step onboarding wizard:

**Step 1:** "What should we call you?" — Display name + city (dropdown from existing CITIES list)

**Step 2:** "What's your primary role?" — Show the 6 department icons from taxonomy.ts. User taps a department, then picks one role. That's it. No multi-select, no specializations yet.

**Step 3 (tech only):** "What's your rate?" — Single input for hourly rate for their primary role. Show the market range for that role from the /rates data as a hint.

Then redirect to their profile page with a "Your profile is live — producers can find you now" confirmation. Link to edit-profile for "Add more details later."

For producers, Step 2 becomes "What's your company?" and Step 3 becomes "What city do you produce events in?" Then redirect to /browse.

Build this at src/app/onboarding/page.tsx. Trigger it by checking if the user's profile has display_name set — if not, redirect to /onboarding from the dashboard.

## Priority 2: Simplify Edit Profile for New Users

The current edit-profile page shows everything at once. Instead:

- Show a "Profile Completeness" bar at the top with specific prompts: "Add a photo (+15%)" "Add your bio (+10%)" "Add gear proficiencies (+10%)"
- Collapse the specializations section by default — only show it if the user clicks "Add specializations"
- Collapse the per-skill rates section by default — only show if user has 2+ roles selected
- Move insurance to its own collapsible section at the bottom

Don't remove any functionality. Just progressive disclosure — basics visible, advanced collapsed.

## Priority 3: Empty State on Browse

When a producer browses and there are few results (under 10 techs), show a helpful empty state instead of a sparse grid:

- "More techs are joining every day. Save this search and we'll notify you when new [role] techs join in [city]."
- Add a "Notify Me" button that saves their filter as a saved search (store in a new saved_searches table: producer_id, filters jsonb, created_at)
- This gives producers a reason to come back

## Priority 4: Post-Signup Email Sequence

Create 3 automated emails after signup (use the existing Resend integration in src/lib/email.ts):

**Day 1 (immediate after profile creation):** "Your profile is live" — link to their public profile, remind them to add a photo

**Day 3:** "Complete your profile" — show what's missing, mention that complete profiles get 3x more views (even if we don't have data yet, this is industry standard for marketplaces)

**Day 7:** "Have you checked out the rate guide?" — link to /rates and /learn, position Truss as a career resource not just a job board

Trigger these from a simple check: query profiles where created_at matches the interval and send accordingly. Can be a cron job at src/app/api/cron/onboarding-emails/route.ts.

## Priority 5: Mobile Pass

Do a responsive audit on these pages in order of importance:
1. Browse page (producers will search on desktop AND mobile)
2. Profile page (techs will share their profile link — it'll be opened on phones)
3. Edit profile (techs might update their profile from a job site)
4. Dashboard

Focus on: touch targets big enough to tap, no horizontal scrolling, readable text without zooming, collapsible filters on mobile.

## Priority 6: Browse Page Guidance

Add subtle contextual hints for first-time producers:
- If no filters are selected: "Filter by role, city, or availability to find your crew"
- On tech cards: make the entire card clickable (it may already be) and add a subtle "View Profile →" on hover
- If the producer has never made a booking: show a one-time banner at top "Find a tech → View their profile → Request to Book. It's that simple."
- Dismiss the banner permanently after first click (store in localStorage or a user preference)

## Implementation Notes

- Build each priority as a separate branch, test, then merge to main
- The onboarding flow should feel fast and lightweight — no heavy animations, no progress dots, just clean steps
- Match existing design system: blackout backgrounds, signal-orange accents, Oswald headings, mono data text
- Don't break any existing functionality — edit-profile should still work exactly as it does, just with better progressive disclosure
