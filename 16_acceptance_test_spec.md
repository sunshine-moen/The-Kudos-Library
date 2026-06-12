# Acceptance Test Spec — The Kudos Library

**Purpose:** This document is the verification contract Claude Code (or any builder) must satisfy. Each test below is a runnable specification — given the setup, the action MUST produce the expected outcome, exactly. Where tests check absence ("does NOT fire", "does NOT appear"), the absence is part of the spec.

**Audience:** Claude Code (build verification) + Rebekah (acceptance review at gates).

**How to use:**
- For each test, set up the preconditions, perform the action, and verify every expected-outcome line.
- A test passes only when ALL expected-outcome lines hold. A single divergence is a failure.
- Hard-path tests (the second section) cover edge cases that the central tests don't exercise. Both sections must pass before any milestone is considered complete.

**Status:** Extracted from PRD §13 (Worked Example) on 2026-06-04 as part of the PRD restructure. Reframed from "illustration of how the system works" to "tests the system must pass." Content is unchanged; the new framing is as a verification contract.

---

## Central worked-example test: end-to-end kudos lifecycle

This single scenario exercises ~80% of the load-bearing product behavior. It maps to user-facing functionality across submit, notify, read, badge, digest, and indicator surfaces.

### Test C1: Submit an individual kudos (the central flow)

**Setup:**
- Logged-in user: Rebekah (AG unit lead AND product owner AND admin; for this test, treat as admin giver).
- Recipient: Jamie (OPS sub-team team member).
- Tenant: AG.
- Rebekah's device already confirmed.
- Active featured prompt this week: "Who helped you get something across the line?" with `pre_tag_value_id` = `get_er_done`.

**Action:** Rebekah POSTs to `/api/kudos` with:
```
mode: individual
recipient_id: "b2..." (Jamie)
message_text: "Jamie — the way you rebuilt the donor file QA checklist this week saved us a full day on PR3 reconciliation. Thank you for owning it without being asked."
book_design: "burgundy_clothbound"   // randomly defaulted; Rebekah kept it
font_choice: "garamond_classic"
value_tag_ids: ["get_er_done"]       // PRE-TAGGED from active prompt; Rebekah didn't change
context_category_id: "process_or_system"  // OPTIONAL; Rebekah added
context_text: "Donor file QA for PR3"     // OPTIONAL
giphy_id: null
featured_prompt_id: "fp_2026w22"     // links this kudos to the week's prompt for analytics
```

**Expected outcome — `kudos` row written (all rows include `tenant_id = <AG tenant uuid>`):**
```json
{
  "id": "k7...",
  "tenant_id": "<AG>",
  "recipient_id": "b2...",
  "team_recipient_id": null,
  "giver_id": "a1...",
  "message_text": "Jamie — the way you rebuilt the donor file QA checklist this week saved us a full day on PR3 reconciliation. Thank you for owning it without being asked.",
  "book_design": "burgundy_clothbound",
  "font_choice": "garamond_classic",
  "context_category_id": "process_or_system",
  "context_text": "Donor file QA for PR3",
  "giphy_id": null,
  "featured_prompt_id": "fp_2026w22",
  "submitted_at": "2026-05-29T05:14:00.000Z",
  "edit_window_expires_at": "2026-05-29T05:29:00.000Z",  // submitted_at + 15min
  "badge_evaluated_at": null,                              // set later by badge cron
  "deleted_at": null
}
```

**Expected outcome — `kudos_value` rows:**
```json
{ "kudos_id": "k7...", "tenant_id": "<AG>", "value_tag_id": "get_er_done" }
```
(One row — pre-tagged from prompt. No other value rows.)

**Expected outcome — `email_outbox` row written in the same transaction:**
```
template_type: "recipient_notify"
tenant_id: "<AG>"
kudos_id: "k7..."
recipient_user_id: "b2..."
send_after: "2026-05-29T05:29:00.000Z"  // = edit_window_expires_at; not submitted_at
idempotency_key: "recipient_notify:k:k7...:r:b2..."
delivered_at: null
cancelled_at: null
attempts: 0
```

**Expected outcome — UI:** modal renders on `/celebrate` with "Thanks for celebrating Jamie!" and two buttons: "Recognize another teammate" (form reset; stays on `/celebrate`) and "Back to library" (navigates to `/library`).

**Expected outcome — email NOT sent before window expires:** at any time t < `edit_window_expires_at`, `email_outbox.delivered_at` is NULL for this row. Outbox poller skips it (`send_after > NOW()`).

---

### Test C2: Email delivery after edit window

**Setup:** Test C1 has run. Current time has advanced past `edit_window_expires_at`.

**Action:** Outbox poller fires (every 60s cron).

**Expected outcome — `email_outbox` row picked up:** `send_after <= NOW()`, `delivered_at IS NULL`, `cancelled_at IS NULL`, `attempts < 3`. Row is locked via `FOR UPDATE SKIP LOCKED`.

**Expected outcome — pre-send deleted_at re-check:** poller runs `SELECT deleted_at FROM kudos WHERE id = $kudos_id` immediately before calling Resend. If `deleted_at IS NULL`, proceed. If not null, abort send and set `email_outbox.cancelled_at = NOW()`, `cancellation_reason = "kudos_soft_deleted_during_render"`.

**Expected outcome — email sent:** `sendEmail` is called with idempotency_key = `recipient_notify:k:k7...:r:b2...`. Resend responds 2xx.

**Expected outcome — `email_send_log` row written:** captures template_type, recipient_email_hash, idempotency_key, provider_message_id, quote_id used in this send, sent_at.

**Expected outcome — `email_outbox` updated:** `delivered_at = NOW()`.

**Expected outcome — content:** the recipient_notify email is a teaser only (subject + brief body), with a magic deep-link button and an author quote footer. The author quote is selected from `author_quote` (active rows only), with dedup against the recipient's last 5 sends (best-effort; fallback to any active quote if dedup window has no candidates).

---

### Test C3: Jamie reads the kudos (first-ever read; teaching moment fires)

**Setup:** Test C2 has run. Jamie has never previously read any kudos addressed to her. `team_member.first_kudos_read_at` for Jamie is NULL.

**Action:** Jamie clicks the magic deep-link in the email.

**Expected outcome — authentication:** `/api/auth/[...nextauth]` verifies the single-use token. Token is consumed (single-use). Since Jamie's device is unconfirmed, the "Yes, this is me" confirmation page renders. After confirmation, `device_confirmation` row inserted; session cookie set.

**Expected outcome — redirect:** browser navigates to `/book/k7...`.

**Expected outcome — read recorded (in a single transaction):**
1. INSERT INTO `kudos_read` (kudos_id = k7..., reader_id = b2..., tenant_id = <AG>) ON CONFLICT (kudos_id, reader_id) DO NOTHING.
2. UPDATE `team_member` SET `first_kudos_read_at = NOW()` WHERE id = b2... AND tenant_id = <AG> AND `first_kudos_read_at IS NULL` RETURNING id.

**Expected outcome — UPDATE returns a row** (Jamie's `first_kudos_read_at` was NULL → now NOW()): the book detail page renders with the **recipient onboarding teaching line**: *"This is what Rebekah saw. The library keeps things like this."*

**Expected outcome — page render:** page-turn animation plays (Framer Motion). Message, values, context shown. Pay-it-forward nudge appears at the bottom (carries the active prompt-of-the-week if any). Admin sees a Delete button (Jamie is not admin, so no Delete button for her).

**Expected outcome — per-event email does NOT fire to Rebekah:** out of scope per "Reactions / per-event email" decision (see `15_decision_log.md`).

---

### Test C4: Jamie reads the kudos a second time (re-read; no teaching moment)

**Setup:** Test C3 has run. Jamie navigates to `/book/k7...` again (re-read).

**Action:** GET `/book/k7...`.

**Expected outcome — INSERT into `kudos_read` is a no-op** (UNIQUE on `(kudos_id, reader_id)` triggers `ON CONFLICT DO NOTHING`; no new row).

**Expected outcome — UPDATE on `team_member` returns zero rows** (`first_kudos_read_at` is already set; the `WHERE first_kudos_read_at IS NULL` clause excludes the row).

**Expected outcome — page render:** book detail renders WITHOUT the teaching line. Otherwise identical to Test C3's render.

---

### Test C5: Rebekah's "your books are being picked up" indicator

**Setup:** Test C3 has run. Rebekah navigates to `/library` (or `/profile`).

**Action:** GET `/library`.

**Expected outcome — live counter query:**
```sql
SELECT COUNT(*) FROM kudos_read kr
  JOIN kudos k ON kr.kudos_id = k.id AND kr.tenant_id = k.tenant_id
  WHERE k.giver_id = '<Rebekah>' AND k.tenant_id = '<AG>'
    AND kr.read_at >= date_trunc('week', NOW() AT TIME ZONE 'America/Vancouver');
```
Returns 1 (Jamie's read of k7...).

**Expected outcome — UI:** indicator renders: *"Your books are being picked up — 1 time this week."*

**Expected outcome — no email fires to Rebekah:** the "your books are being picked up" channel is in-app only by default. The `kudos_was_read_digest` weekly Friday digest fires only if Rebekah has opted in via `email_settings.kudos_was_read_digest = true`. Default is false; with no opt-in, no email.

---

### Test C6: Rebekah's 50th kudos triggers Atwood Accolade badge

**Setup:** Test C1 was Rebekah's 50th individual kudos as a giver. After Test C2's window expiration, the badge evaluator cron fires.

**Action:** Badge evaluator cron processes Rebekah's kudos (now that `edit_window_expires_at <= NOW()`).

**Expected outcome — badge_award row written:**
```
giver_id: <Rebekah>
tenant_id: <AG>
badge_id: "atwood_accolade"
awarded_at: NOW()
triggering_kudos_id: k7...
```

**Expected outcome — `kudos.badge_evaluated_at` set:** UPDATE kudos SET badge_evaluated_at = NOW() WHERE id = k7...

**Expected outcome — `email_outbox` row inserted:** template_type = badge_milestone, recipient_user_id = Rebekah, send_after = NOW(). On the next outbox poller pass (≤60s later), the badge_milestone email sends to Rebekah only (badges are private).

**Expected outcome — email content:** subject + story body about the Atwood Accolade. Magic-link to Rebekah's `/profile` to view the new badge. Tone-pass required before launch per polish gates.

---

### Test C7: Self-reference exclusion in manager digest

**Setup:** Test C6 has run. Rebekah is the unit lead for AG (top of hierarchy; no manager above her). The Monday 09:00 PT manager_digest cron fires.

**Action:** manager_digest cron processes Rebekah as a manager (she has direct reports).

**Expected outcome — direct reports' kudos appear normally** in Rebekah's digest.

**Expected outcome — "Badges your team earned this week" section** lists badges for direct reports.

**Expected outcome — Rebekah's own Atwood Accolade does NOT appear in Rebekah's manager digest "Badges your team earned" section.** Actor-exclusion rule: a manager doesn't see their own badges in their digest.

**Expected outcome — no separate badge_milestone email re-fires** to Rebekah from the digest cron (the badge_milestone fired separately in Test C6; the digest just summarizes existing badges, doesn't generate new emails).

---

### Test C8: Self-reference exclusion in anniversary reminder

**Setup:** Rebekah's own `ag_join_date` is exactly 1 week from today. The anniversary-reminder cron fires (daily 09:00 PT, self-gated on tenant timezone).

**Action:** cron evaluates whether to fire anniversary reminders for Rebekah.

**Expected outcome — the reminder evaluates recipients:** Rebekah's direct manager (in AG: none, since Rebekah is the top of AG hierarchy) and admins.

**Expected outcome — Rebekah is herself an admin** — the system excludes her from her own anniversary notification.

**Expected outcome — IF no other admins exist** (a state the launch gate is designed to prevent, but documented for completeness): the system logs the suppression and sends no email.

**Expected outcome — IF other admins exist:** they each receive the anniversary reminder for Rebekah's AG anniversary (UNLESS Rebekah has set `email_settings.anniversary_about_me = false`, which short-circuits the cron before recipient evaluation).

---

## Hard-path tests

These exercise constraints, edge cases, and failure modes that the central tests don't.

### Test H1: Recipient XOR constraint
**Setup:** Attempt to insert a `kudos` row with both `recipient_id` and `team_recipient_id` set (or both NULL).

**Expected outcome:** DB CHECK constraint rejects the insert. API surfaces a 400.

### Test H2: context_text length cap
**Setup:** Submit `/api/kudos` with `context_text` length > 200 chars.

**Expected outcome:** DB CHECK constraint rejects the insert. API returns 400 with validation error.

### Test H3: Cross-team kudos succeeds (no membership restriction)
**Setup:** A BB-team member submits a team kudos to OPS team (giver is not a member of OPS).

**Expected outcome:** kudos accepted. One `kudos` row + N outbox rows (one per active-or-on-leave OPS member, each with unique idempotency key `recipient_notify:k:<kudos_id>:r:<member_id>`).

### Test H4: On-leave recipient still receives team kudos email
**Setup:** A team kudos is submitted to a team that includes a member with `status = 'on_leave'`.

**Expected outcome:** the on-leave member's `email_outbox` row is created and (post-window) sends normally. On-leave does not suppress team kudos.

### Test H5: Soft-delete recompute + leaderboard recalc
**Setup:** A kudos contributing to Rebekah's Atwood Accolade is soft-deleted by an admin.

**Expected outcome (all in one transaction):**
- `kudos.deleted_at` set.
- `admin_audit_log` row written.
- If the deleted kudos was below the badge threshold post-deletion, the corresponding `badge_award` row is revoked (deleted or marked revoked depending on schema choice — see ADD §11).
- `leaderboard_winner` recompute for the affected period is queued.
- If the kudos's `email_outbox` row hasn't fired yet (still within edit window), its `cancelled_at = NOW()` and `cancellation_reason` = `"kudos_soft_deleted_before_send"`; no recipient_notify email fires.

### Test H6: Production launch attempted with 1 admin → blocked
**Setup:** Tenant has exactly 1 active admin. App attempts production initialization.

**Expected outcome:** initialization refused with a clear error message: "production launch requires ≥2 active admins; currently 1." Tenant cannot enter production state.

### Test H7: Kudos submitted with `value_tag_ids = []` (user skipped tagging)
**Setup:** Submit `/api/kudos` with `value_tag_ids: []`.

**Expected outcome:** `kudos` row inserted; zero `kudos_value` rows. CSV export shows blank Values column for that row. No validation error (skip is permitted per pre-tag-with-skip rule).

### Test H8: Kudos submitted while NO featured_prompt is active for the current week
**Setup:** No `featured_prompt` row has `is_active = true` and matches the current week. User opens `/celebrate`.

**Expected outcome:** form pre-tag falls back to the giver's most-used value tag over the rolling last 30 days. If the giver has no recent history, no pre-tag is applied (field renders empty; user picks or skips).

### Test H9: Anniversary subject opt-out
**Setup:** Team member Alex has `email_settings.anniversary_about_me = false`. Alex's UBC hire anniversary is today + 7 days.

**Expected outcome:** the daily anniversary-reminder cron evaluates Alex's anniversary and immediately short-circuits — no reminder emails are queued to any potential recipient. The subject opt-out takes precedence over recipient opt-out evaluation.

### Test H10: Tenant isolation — no cross-tenant reads
**Setup:** Two tenants exist in CI (AG + synthetic test_tenant). Each has its own users, kudos, badges, etc.

**Expected outcome:** for every API surface (GET `/kudos/:id`, GET `/library`, POST `/api/kudos`, GET `/api/export`, etc.), a request authenticated as a user in tenant A returns ONLY rows from tenant A. Attempting to request a row ID belonging to tenant B returns 404 (not 403 — don't leak existence). The CI tenant-isolation suite (Playwright) automates this for every API surface.

### Test H11: Outbox idempotency on cron retry
**Setup:** A cron job inserts an `email_outbox` row with idempotency_key = `manager_digest:ag:2026-W22`. Vercel Cron retries the same invocation (rare but possible).

**Expected outcome:** the second invocation's INSERT triggers `ON CONFLICT (idempotency_key) DO NOTHING`. No duplicate email; no error.

### Test H12: Soft-delete mid-render race
**Setup:** A kudos is in the outbox poller's render queue. Just before `sendEmail` is called, an admin soft-deletes the kudos.

**Expected outcome:** the pre-send `SELECT deleted_at FROM kudos WHERE id = $id` returns non-null. Poller aborts the send; `email_outbox.cancelled_at = NOW()`, `cancellation_reason = "kudos_soft_deleted_during_render"`. No email sent. (Residual: the ~50–500ms between the second deleted_at check and Resend accepting the request remains an accepted edge case where the email may still fire.)

---

## What these tests collectively prove

- `tenant_id` present on all rows; tenant-isolation enforced through schema (composite FKs) + repository layer (TenantContext) + test layer (this suite's H10).
- Pre-tagged values from active featured prompt populate `kudos_value` on submit; user can skip.
- `featured_prompt_id` linkage enables prompt-effectiveness analytics.
- 15-minute edit window + delayed recipient_notify works end-to-end (Test C1 + C2).
- `kudos_read` tracking powers in-app indicator + recipient onboarding moment + optional digest.
- Recipient onboarding teaching line fires only on the user's first-ever kudos read (denormalized atomic claim).
- Self-kudos prevention.
- timestamptz UTC.
- recipient_notify = teaser only.
- Magic deep-link auto-auth with first-device confirmation.
- Modal confirmation behavior on submit.
- Badge fires as private email.
- Self-reference exclusion in manager digest AND anniversary reminder.
- "Your books are being picked up" = in-app indicator only (no per-event email).
- Tenant isolation holds across every API surface (Test H10).
- Outbox idempotency prevents cron-retry duplicate sends.
- Cancellation properly distinguished from failure in outbox lifecycle.

---

## Change log

| Date | Change |
|---|---|
| 2026-06-04 | Extracted from PRD §13 (Worked Example) as part of the PRD restructure. Reframed from illustrative narrative to test specification: each scenario is now a runnable test with explicit setup/action/expected-outcome structure. Hard-path tests promoted from a bulleted list to full Test H-series. Added timezone-aware SQL in C5 (matching ADD rev 1.4). Added Test H10 (cross-tenant isolation), H11 (cron retry idempotency), H12 (soft-delete mid-render race) to cover load-bearing architecture invariants. Original PRD §13 content preserved; new framing as Claude Code's verification contract. |
