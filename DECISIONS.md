# DECISIONS.md — Architecture & Strategy Decisions Log

Record of decisions made and why, so Claude Code doesn't re-suggest rejected ideas or redo settled debates.

---

## 2026-02-21

### RLS Policy Fixes
**Decision:** Dropped open INSERT policies on `gear_items`, `earned_badges`, `notifications`, and tightened `conversation_participants` to only allow users to add themselves.
**Why:** Any authenticated user could corrupt gear taxonomy, self-award badges, join private conversations, or create fake notifications.
**Implication:** Badge awarding, notification creation, and gear management must happen server-side using the service role key. If any of these currently happen client-side, they'll break and need to be moved to API routes.

### Financial Tables Stay Server-Side Only
**Decision:** `invoices` and `account_transactions` keep RLS enabled with zero client policies. All access goes through server-side API routes with the service role key.
**Why:** Financial data should never be queryable from the client. Current pages (`/invoices`, `/billing`) already work this way.

### Booking Updates Need Server-Side Migration
**Decision:** Booking status transitions and financial fields (`rate`, `total_amount`, `platform_fee`, `status`) should be moved to server-side API routes. Current RLS allows both producer and tech to update any field.
**Status:** Shipped. All booking writes go through `/api/bookings` with server-side validation. RLS INSERT/UPDATE policies dropped on bookings and reviews.

### Producer Nav to Invoices/Billing
**Decision:** Add navigation links so producers can actually find `/invoices` and `/billing` pages. They exist and work but aren't discoverable.
**Status:** Shipped. Invoices and Billing now appear in desktop top nav, mobile nav, and profile dropdown for producers.

---

## Template for New Entries

### [Short Title]
**Decision:** What we decided
**Why:** The reasoning
**Alternatives considered:** What we rejected and why
**Implication:** What this means for future work
