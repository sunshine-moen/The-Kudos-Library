# PRD — The Kudos Library

**Status:** Draft for build. Ready for Claude Code handoff once Content Plan working session completes (`12_content_plan.md` §10 open items).
**Last updated:** 2026-06-04 (rev 8.0 — restructure; see Appendix B).
**Product owner:** Rebekah Moen.

**Reading order:** this PRD answers *what to build and why* at the product level. For *how it's built* (schema, contracts, flows, infrastructure) read `09_ADD_kudos_library.md`. For acceptance tests Claude Code must satisfy read `16_acceptance_test_spec.md`. For decisions + rationale read `15_decision_log.md`. For user-facing language read `12_content_plan.md` (+ companions `05_author_quotes_starter.md`, `06_email_design_brief.md`). For success measurement read `13_measurement_validation_plan.md`. For the Mural-retirement adoption strategy read `14_launch_adoption_plan.md`. For the v1.5/v2 roadmap read `07_v2_strategy.md`.

---

## Executive summary (90 seconds)

The Kudos Library is a private, library-themed web app where teammates leave each other written recognition that appears as books on personal bookshelves. Built specifically for UBC departments locked out of mainstream peer-recognition tools — most assume Slack or Teams plugin access (blocked at UBC) or sit above a single department's budget.

v1 is the validation build for the UBC Annual Giving (AG) team: ~10–20 people, single-tenant production, cloud-hosted (Vercel + Neon + Resend), magic-link authenticated, full WCAG 2.1 AA. Designed for 5–20 kudos per week. The internal trigger the product attaches to is **witnessing** — the moment you notice a colleague doing something good and feel an urge to mark it so it doesn't disappear (validated week 4–6 via team survey).

**Critical adoption context:** AG has a 3-year-old habit of giving kudos via Mural + Friday team meeting. As part of launch, the Mural board is retired and the meeting-kudos ritual ends; the library is announced as the replacement. This is the adoption strategy, not a logistics detail — see `14_launch_adoption_plan.md`. Targets in `13_measurement_validation_plan.md` are recalibrated for the migration scenario (expect a real adoption dip at weeks 2–6 as meeting-triggered kudos die before witnessing-triggered ones form).

If AG uses it, v1.5 expands to 3–4 free UBC department pilots to validate the product across cultures. v2 commercializes as a fundraiser model where subscriptions = recurring donations to UBC funds (see `07_v2_strategy.md`; gated on v1.5 success + executive approvals).

This document specifies v1 only. Schema carries `tenant_id` columns + composite FKs defaulted to AG so the v1.5 multi-tenant migration is a query-scoping change, not a schema rebuild.

---

## Table of contents

- [0. Glossary: v1 / v1.x / v1.5 Pilot / v2](#0-glossary-v1--v1x--v15-pilot--v2)
- [1. What to Build](#1-what-to-build)
- [2. Users & Scale](#2-users--scale)
- [3. User Stories](#3-user-stories)
- [4. Walkthrough](#4-walkthrough)
- [5. Screens](#5-screens)
- [6. Constraints (hard rules + admin defaults)](#6-constraints-hard-rules--admin-defaults)
- [7. Done Means (functional + polish gates)](#7-done-means-functional--polish-gates)
- [8. Out of Scope](#8-out-of-scope)
- [9. Future Extension (stub — see roadmap doc)](#9-future-extension-stub--see-roadmap-doc)
- [10. Build Order (phase table)](#10-build-order-phase-table)
- [Appendix A: Companion-doc map](#appendix-a-companion-doc-map)
- [Appendix B: Change Log](#appendix-b-change-log)

---

## 0. Glossary: v1 / v1.x / v1.5 Pilot / v2

The product evolves in four stages. The **product-owner role persists across all stages and all tenants**; the **unit-lead role is per-tenant**. In v1 (AG only) Rebekah holds both. In v1.5+, Rebekah remains product owner but each pilot department has its own unit lead.

| Label | Meaning | Architectural shape |
|---|---|---|
| **v1** | AG validation build. | Single-tenant production. Schema carries `tenant_id` columns + composite FKs defaulted to AG. |
| **v1.1, v1.2, …** | Incremental improvements to the same AG-only product. | Still single-tenant. |
| **v1.5 Pilot** | Expansion to 3–4 free pilot UBC departments. | Multi-tenant production. Migration = enabling tenant-scoped queries (schema already supports it). |
| **v2** | Commercial fundraiser model. See `07_v2_strategy.md`. | Multi-tenant + billing + fund-selection + Librarian impact emails. |

**Schema tenant-readiness** (active rule, not aspirational): every team-scoped table carries a `tenant_id` column in v1, defaulted to the AG tenant, with composite FKs. v1 queries don't filter on tenant_id. v1.5 migration becomes "enable tenant-scoped query filtering + per-tenant auth checks + isolation testing." Tables without tenant_id (`icon_preset`, `tenant` itself) are documented in ADD §4.

---

## 1. What to Build

A library a team builds together. Each kudos is a small moment kept — when a colleague stepped in to help, shared what they knew, or showed kindness in the middle of fast work. Over time, the small moments become something bigger: a history of the team and the bonds we build by recognizing each other. The library is a place to slow down and notice the people who make great work — and make work great.

Single-tenant production. Built for and used by the UBC Annual Giving (AG) team.

**Positioning.** Built specifically for UBC departments locked out of mainstream recognition tools. Most B2B peer-recognition platforms (Bonusly, Matter, Nectar, Assembly, Kudos.com) assume Slack or Teams plugin access; UBC IT blocks these for AG. Enterprise alternatives sit above a single department's budget. Open-source options require Slack or a self-host engineering team. The Kudos Library serves the UBC department with none of those. Market: UBC + peer public-sector higher-ed. Private-sector SaaS not a competitor.

**v1 purpose:** validate the product with AG. v1 does not pitch a commercial future; v2 lives in `07_v2_strategy.md`.

**The real alternative to writing a kudos is doing nothing — the moment passes.** Other alternatives (saying it at standup, a Teams DM, a line in the next 1:1) exist, but in practice most witnessed moments end with nothing kept. The product's actual job is to convert moments that would otherwise pass into ones that get preserved. The unprompted-giver rate metric in `13_measurement_validation_plan.md` is the proxy for this.

**The internal trigger.** The product attaches to **witnessing competence and kindness around you** — the moment you notice a colleague doing something good (often when you're not the direct beneficiary) and feel an urge to mark it so it doesn't disappear. Gratitude is the secondary trigger; witnessing is the primary one. This is the load-bearing emotion the entire product design serves. Validation plan: see `13_measurement_validation_plan.md`.

**Locked product copy** (not subject to per-tenant editing): hero line, recipient onboarding teaching moment, "your books are being picked up" indicator phrasing, pay-it-forward nudge. Canonical source: `12_content_plan.md` §1.

---

## 2. Users & Scale

**Primary user (AG unit lead, also product owner in v1):** Rebekah Moen, Senior Director, Annual Giving, UBC. Two distinct hats:
- **Unit lead** — manages AG's use of the product. Per-tenant role.
- **Product owner** — owns product integrity across all tenants and all versions. Cross-tenant role.

In v1 (AG only) one person fills both. In v1.5+ these are different people. The cross-tenant evolution lives in `07_v2_strategy.md`.

**Single-owner caveat.** Every decision attributed to "the product owner" in v1 is a single-owner judgment call without external review. This applies to FIPPA risk posture, badge governance, vendor breach re-vetting, points-skip contingency decisions, witnessing-trigger validation, and content stewardship. Doc names "product owner" rather than Rebekah because the role is what persists.

**Secondary users (team members):** Rebekah's direct reports + skip-level reports across BB, IF, OPS, SA.

**Roles in v1 (three; permissions stack):**
- **User** — every team member.
- **Manager** — people-manager account type with direct reports linked.
- **Administrator** — site admin (roster, templates, schedules, manages admin-editable lists, schedules weekly featured prompts, can soft-delete any kudos, triages feedback). Configurable max via `team_settings.max_admins`; default 3. App gate prevents production launch with <2 active admins.

**Teams (within AG tenant):** All-org team **AG**; sub-teams **BB**, **IF**, **OPS**, **SA**.

**AG values vocabulary** (12 total; admin-editable):

| DAE values | AG team values |
|---|---|
| Excellence | Learning |
| Integrity | Connection |
| Respect | Innovation |
| Accountability | Agility |
| Communications | Kindness |
| Collaboration | Get 'er done |

The AG culture statement (six AG team values above) lives in the marketing page's Built-for-UBC section per `12_content_plan.md` §2 — not in the library itself (library has hardcoded product copy).

**Device:** desktop. Mobile responsive = roadmap (see `07_v2_strategy.md`).

**Scale + cost:**
- Team size: 10–20 (AG).
- Kudos volume: 5–20/week.
- Year-1 records: ~1,000–1,500 kudos.
- Timezone: `APP_TIMEZONE=America/Vancouver`; user-facing "Pacific Time" / "PT".
- **Hosting cost (verifying $50/mo ceiling):** Vercel Pro $20/mo (required — Hobby tier caps at 2 cron jobs ≥24h intervals; v1 needs 11+ at minute/daily/weekly cadences per ADD §12) + Neon free + Resend free (≤3,000 emails/mo) + Plausible $9/mo + Sentry free (≤5,000 events/mo) + Giphy free = **~$29/mo total**. Comfortable headroom.

**Data residency + FIPPA posture (v1 prototype acceptance):** v1 uses US-cloud (Vercel/Neon/Resend) without a formal PIA in v1 scope. v1 is explicitly a prototype for single-unit AG release; data category is narrow (business-card + peer kudos text); audience is small and known. PIA conversation with UBC privacy office is slated to begin as part of v1.5 preparation. v1 includes mitigations: user can request removal of any kudos they gave or received, data-export for FIPPA-style subject requests, no vendors with significant known breach history. Rationale + reversibility recorded in `15_decision_log.md`.

**Active-giver definition:** ≥1 kudos given in a rolling 2-week window.

**Mid-cycle joiners / leavers:** new = magic-link welcome → T&C + Privacy Policy on first login. Departing = admin deactivates with per-deactivation choice (keep visible as "former teammate" / hide shelf / hard-delete).

---

## 3. User Stories (JTBD format: "When X, I want to Y, so that Z")

**Team member (giver):**
> **When** I notice a colleague step in to help, share what they knew, or show kindness in the middle of fast work, **I want to** mark the moment in a place that keeps it, **so that** the moment doesn't evaporate AND the colleague knows they were seen AND I'm acting consistently with the kind of teammate I want to be. (Multiple progress dimensions: preservation + relational + identity. All three matter; preservation is primary.)

**Team member (recipient):**
> **When** I'm heads-down in fast work and the wins go uncelebrated, **I want to** know that what I did mattered to someone, **so that** I feel seen on a team that's often too busy to say so out loud.

**Manager:**
> **When** review season approaches or a direct report needs recognition, **I want to** see a regular pattern of what my reports have been noticing in each other (plus reminders for the people who've been overlooked or are approaching a work anniversary), **so that** I can join in recognition consistently — without surveilling — and have something honest to reference at review time.

**Manager / Admin (team recognition):**
> **When** my team receives external recognition I want them all to see (from a VP, exec, or external partner), **I want to** pass it through in one motion, **so that** the recognition reaches everyone immediately rather than evaporating in the inbox.

**AG unit lead:**
> **When** I'm shaping what gets celebrated this week (an event, a campaign push, a quiet moment of mastery), **I want to** set up the roster, customize email cadences + templates, schedule the weekly featured prompt, and quietly remove anything inappropriate, **so that** the library reflects the culture I'm trying to build, not a generic template.

**Product owner (persists across tenants and versions):**
> **When** content quality drifts or an author's legacy changes or a vendor has an incident, **I want to** maintain the product's integrity through annual reviews and policy updates, **so that** the library stays defensible regardless of which unit lead is operating it in any given tenant.

---

## 4. Walkthrough

User-visible flows in one paragraph each. For event sequencing, timing windows, transaction boundaries, and the outbox pattern, see ADD §5. For edge paths and error states, see `16_acceptance_test_spec.md` hard-path tests.

**Login.** Magic-link only in v1. First-time login presents T&C + Privacy Policy. Returning user with active session lands at `/library`. Returning with expired session goes through `/login` → magic-link → signed in. Click-from-email uses a magic deep-link (single-use signed token + kudos ID); on a new device the "Yes, this is me" confirmation page renders (forwarding-friction, not account protection). Device confirmation expires after 90d inactivity.

**Give a kudos.** Pick mode (Individual default; Team toggle). Pick recipient (team member or team). Values are pre-tagged at form load (from active featured prompt's `pre_tag_value_id` if any, else giver's most-used over rolling 30 days) — user can change tag(s) or skip. Optional context category + context text (≤200 chars) + GIF + book design (random default rotation) + font. Submit. Modal confirmation: "Thanks for celebrating [recipient_first_name]!" with "Recognize another teammate" (form reset, stays on `/celebrate`) and "Back to library." A 15-minute edit window opens for the giver to edit message/values/context/GIF; the recipient_notify email queues and fires at window expiration. Badge milestone evaluation runs after the window closes.

**Receive a kudos.** Email arrives (teaser only + magic deep-link button + author quote footer). Click → magic deep-link auth → `/book/[id]`. Page-turn animation. Message, values, optional context shown. On the recipient's first-ever kudos read (the read that flips `team_member.first_kudos_read_at` from NULL → NOW()), the recipient onboarding teaching line renders above the kudos. Subsequent reads don't show it. Pay-it-forward nudge at the bottom (carries the active prompt-of-the-week if any).

**Manager weekly digest.** Monday 09:00 PT (configurable per-manager: weekly or biweekly). Non-empty week: `manager_digest` lists direct reports' kudos + "Badges your team earned" section (actor-excluded). Empty week: `manager_quiet_week`.

**Manager overlooked-recipient nudge.** Weekly. Per-manager: which direct reports have zero received kudos in the configured window (default 30d)? Email with `/celebrate` deep-links. Suppressed by `email_settings.overlooked_recipient_nudge = false`.

**Prompt-of-the-week.** Wednesday email to anyone who hasn't given a kudos this calendar week AND has the opt-in. Renders the active featured prompt. Same prompt appears on `/celebrate` (top, prominent), in passive signage on `/library`, and at the bottom of every `/book/[id]` modal as pay-it-forward.

**Admin Friday prompt-scheduling reminder.** If no `featured_prompt` row exists for the upcoming Monday's week, `prompt_admin_reminder` email fires to all admins Friday morning with a deep-link to Library Setup → Prompts.

**Inactive-giver escalation.** Only after 4+ consecutive weeks of zero kudos. The weekly prompt-of-the-week catches earlier disengagement; this is the escalation. Suppressed by `on_leave` AND `email_settings.inactive_giver_nudge = false`.

**"Your books are being picked up" indicator.** When a recipient reads a kudos, the giver sees an in-app counter on `/library` and `/profile`: *"Your books are being picked up — N times this week."* Live; not cached. Optional weekly Friday digest if `email_settings.kudos_was_read_digest = true` (default OFF). **Per-event email never fires.**

**Work anniversary reminder.** Daily 09:00 PT (admin-configurable). Fires when `ubc_hire_date` OR `ag_join_date` matches today + lead time (default 1 week before). Recipients: direct manager + manager's manager (or admins if no manager's manager exists, e.g., top-of-hierarchy). Subject opt-out (`email_settings.anniversary_about_me = false`) short-circuits; recipient opt-out (`email_settings.anniversary_reminders = false`) suppresses individual recipients. Actor-excluded.

**Manager CSV export.** Manager: scoped to direct reports. Admin: unrestricted. Filters: date / recipient / giver / value / context. Untagged kudos show blank Values column.

**Team-kudos cross-recognition.** Any team member can send a team kudos to any team within AG (admins exempt from any restriction). Recipient_notify fans out to all team members with `status IN ('active', 'on_leave')` — on-leave members still receive team kudos.

**Send feedback.** `/profile` has a Send Feedback button → feedback_submission row → admin Feedback tab. Two kinds: feature_request, bug_report.

**Administrator — initial setup.** In staging: import roster, designate ≥2 admins, seed values list (12 for AG), context categories (6), prompts (10 picker + 10 featured-prompt rotation), schedule launch-week featured prompt, populate marketing page, review all 12 email templates. Production launch gate blocks deployment with <2 admins.

**Administrator — moderate.** Admin can soft-delete any kudos at any time (including during edit window). Triggers recompute: badge revoke if below threshold, leaderboard recalc, admin_audit_log entry, outbox cancellation if the email hasn't fired yet.

**Administrator — deactivate / name admins.** Deactivation choice per-member: keep visible as "former teammate" / hide shelf / hard-delete. Admin-promote subject to `team_settings.max_admins`.

---

## 5. Screens

**16 distinct views across 9 routes.** Public marketing page at `/`; app at `/library`; submit-a-kudos at `/celebrate`. Book detail = modal. `/export` = endpoint. Admin = one route with 6 tabs.

| # | Route or view | Audience | Purpose |
|---|---|---|---|
| 1 | `/` | Public | Marketing page. Single scrollable with anchor top-nav. Sections per `12_content_plan.md` §2. Footer: Terms · Privacy. No Roadmap section. Build step 30 output is staging-only until step 38 deploy (see §6 staging-only rule). |
| 2 | `/library` | Signed-in | Library homepage. Hardcoded product hero line as quote-style header + "Your books are being picked up" live indicator (respects `email_settings.show_pickup_indicator`) + "This week we're noticing" sign rendering active featured prompt + New Arrivals shelf + team shelves + leaderboard cards + library wayfinding signage. Prominent "Your shelf →" entry point in nav. |
| 3 | `/shelf/[member]` | Signed-in | A teammate's personal shelf. Hidden/deactivated → friendly 404. |
| 4 | `/team/[slug]` | Signed-in | A team's shelf. |
| 5 | `/book/[id]` modal | Signed-in | Opened book with page-turn animation. Values + (optional) context shown. Admin sees Delete. Recipient onboarding teaching line shows on the recipient's first-ever kudos read. |
| 6 | `/celebrate` | Signed-in | Submit-a-kudos. Individual/Team toggle. Prompt-of-the-week prominently shown at top. Values pre-tagged; user can change or skip. Optional context + GIF + book design (random default) + font. Modal confirmation. |
| 7 | `/profile` | Signed-in | Your shelf shortcut, badges, "Your books are being picked up" indicator, Email Settings panel (all toggles independent — including `kudos_was_read_digest` opt-in and `prompt_of_the_week` toggle), data-export + account-delete entry points, Send Feedback button. |
| 8 | `/login` | Public | Magic-link auth. |
| 9a | `/admin` → Roster | Administrator | Members + manager/sub-team + per-deactivation + on-leave + `ubc_hire_date` + `ag_join_date` + unassigned-manager banner + admin-promote (subject to `max_admins`). |
| 9b | `/admin` → Templates | Administrator | Edit subject + HTML body for 12 email templates + Marketing Page copy. T&C + Privacy Policy product-curated (read-only). Each edit logged in `admin_audit_log`. |
| 9c | `/admin` → Schedules | Administrator | All cadence + timing knobs + `max_admins`. |
| 9d | `/admin` → Library Setup | Administrator | Values list + context categories + prompts (picker pool) + weekly featured prompt scheduling (calendar view; optional `pre_tag_value_id` link). |
| 9e | `/admin` → Quotes (tiny view) | Administrator | List of author quotes with single deactivate-toggle per row. No add-quote in v1. Audit-logged. |
| 9f | `/admin` → Feedback | Administrator | Triage feedback. |

**Endpoints:** `/export`, `/api/...` (see ADD §6 for full API contracts).

**Modals from footer:** Terms of Service, Privacy Policy.

**Out of v1's view count (deferred):** `/admin` → Special Collections tab (v1.1); `/changelog` (v2); pricing page (v2); multi-tenant signup (v2); Roadmap section on marketing page (v2 vision lives in `07_v2_strategy.md`).

---

## 6. Constraints (hard rules + admin defaults)

For the stack (Next.js / Postgres / Resend / NextAuth / etc.) and vendor breach rule, see ADD §2 (Topology). For the environment variable list, see ADD §12.

### Hard rules (non-negotiable invariants)

- All kudos public to the team. Admin-only soft-delete.
- Minimal personal data ("business card"): name, email, department, job title, `ubc_hire_date`, `ag_join_date`. No profile photos.
- Per-team isolation — single-tenant production in v1.
- No self-kudos (UI + API + DB CHECK).
- Team kudos to any AG team (giver doesn't need to belong; admins always exempt). On-leave team members still receive team kudos.
- **Every kudos has ≥1 value tag pre-populated** (from the active featured prompt's `pre_tag_value_id` if any, else the giver's most-used over rolling 30 days). **User can change the tag(s) or skip tagging entirely** — kudos can submit with zero tags. (Reopened from prior "required ≥1" rule; see `15_decision_log.md`.)
- T&C + Privacy Policy acceptance required on first login.
- All timestamps `timestamptz` UTC.
- All write endpoints require valid session.
- Magic deep-link: single-use; TTL 14d; first-device confirmation required (forwarding-friction, NOT account protection).
- Magic-link login: single-use, TTL 10 min.
- Rate limits: `/login` 5/15min/IP; resend magic-link 1/5min/email; kudos submit 30/hr/user.
- Session: HttpOnly + Secure + SameSite=Lax. CSRF tokens. CSP headers (default-src 'self'; img-src includes Giphy CDN).
- **Production launch gate: ≥2 active admins required.** App refuses production initialization with <2 admins; deployment blocks with clear error. Detection: `NODE_ENV=production` AND `NEXTAUTH_URL` matching a non-staging hostname pattern; gate check runs in a post-deploy verification step before traffic is routed.
- **15-minute edit window** for every kudos. `recipient_notify` queues at submission, sends at window expiration. Badge milestone evaluation runs AFTER window closes (badges fire for FINAL kudos content).
- Full WCAG 2.1 AA in v1 (formal audit + remediation + re-audit; see §10 build order).
- No sound effects in v1.
- Animation: book-open ≤600ms; book-hover ≤200ms; reduced-motion disables both.
- Data subject rights (FIPPA-style): user data export + account self-delete + "remove this kudos I gave or received" request.
- T&C + Privacy Policy + Marketing Page copy live as `static_content` rows. T&C + Privacy Policy product-curated (legal review to edit). Marketing copy admin-editable. Every edit audit-logged.
- **Hardcoded product copy** (hero line, recipient onboarding teaching moment, "your books are being picked up" indicator phrasing, pay-it-forward nudge): NOT in `static_content`. Lives in the code (see ADD §3 + canonical strings in `12_content_plan.md` §1). Reflects the product's voice, not any tenant's culture.
- DB backup / DR: Neon PITR (7d); nightly automated restore-to-staging verified by runbook check; RPO ≤ 24h, RTO ≤ 4h. Set up at build phase A (before user data accumulates).
- **Staging-only enforcement.** Pre-launch deploys (Phase E + audit prep) deploy to a staging subdomain (`staging-kudos.ag.ubc.ca` or similar) protected by HTTP basic auth (shared password rotated post-launch) AND `robots.txt` disallowing all crawlers. Staging is not linked from any public surface. Production hostname does not resolve to the app until the Phase F deploy.

### Admin-configurable defaults

| Setting | Default | Allowed range |
|---|---|---|
| `team_settings.max_admins` | 3 | ≥2 enforced by app gate |
| Inactive-giver nudge threshold | 4 weeks (escalation pattern) | 14d / 21d / 4w / 6w |
| Overlooked-recipient window | 30 days | 14 / 30 / 60 |
| Overlooked-recipient cadence | Weekly | weekly only in v1 |
| Top-giver thank-you send time | Fri 15:00 PT | per-tenant local time |
| Manager digest cadence (per-manager) | Weekly | weekly / biweekly |
| Leaderboard Top-N (Week + Month) | 5 | 3 / 5 / 10 |
| Anniversary lead time | 1 week before | 1_week_before / 3_days_before / day_of |
| Anniversary email time | 09:00 PT | per-tenant local time |
| Values list / context categories / prompt picker pool / featured-prompt schedule | Seeded; admin-editable | n/a |
| Author quotes | Product-curated; admin deactivate-only (tiny view) | n/a |

### FIPPA posture (NOT a launch blocker for v1)

Per §2: v1 is a prototype for single-unit release; PIA conversation slated for v1.5 prep. Documented as a single-owner judgment call. Full rationale in `15_decision_log.md`.

---

## 7. Done Means (functional + polish gates)

**Functional acceptance gates** — every box must check before v1 launches. The expected behavior of each gate is verified by the corresponding test in `16_acceptance_test_spec.md`. Where a gate maps to a specific test, it's noted.

*Auth + roster + bus-factor*
- [ ] Magic-link login + magic deep-link with first-device confirmation work end-to-end.
- [ ] First login presents T&C + Privacy Policy; user must accept.
- [ ] Resend magic-link works, rate-limited.
- [ ] Admin can add/edit/remove members with `ubc_hire_date` + `ag_join_date` + sub-team.
- [ ] Admin can deactivate (3 options), mark on-leave, see unassigned-manager banner.
- [ ] Production launch gate enforced — deployment refused with <2 admins (Test H6).
- [ ] `team_settings.max_admins` respected by Roster tab admin-promote flow.
- [ ] v1.x readiness: NextAuth config structured so adding the credentials provider in v1.x is a single-column migration + provider wiring (~1 day), not a rework.
- [ ] v1.5 readiness: all team-scoped tables carry `tenant_id` + composite FKs; v1 rows defaulted to AG tenant; v1 queries don't filter on tenant_id (Test H10).

*Give + receive a kudos*
- [ ] User can submit individual or team kudos with: message, book design (random default; can change), font, OPTIONAL context (+ optional context text ≤200 chars), OPTIONAL GIF (Test C1).
- [ ] Values are pre-tagged at form load (from active featured prompt's `pre_tag_value_id` if any, else giver's most-used over rolling 30 days). User can change tag(s) or skip entirely (Tests C1, H7, H8).
- [ ] Team kudos to any AG team; on-leave team members still receive team kudos (Tests H3, H4).
- [ ] Self-kudos blocked UI/API/DB (Test H1, indirect).
- [ ] **15-minute edit window** + recipient_notify queued, fires at window expiration (Tests C1, C2).
- [ ] Soft-delete during window cancels recipient_notify via outbox `cancelled_at` (Test H5).
- [ ] Soft-delete mid-render race handled via second `deleted_at` check before sendEmail (Test H12).
- [ ] Recipient_notify is teaser only (no full message) + magic deep-link button + author quote footer.
- [ ] Modal overlay confirmation on `/celebrate` (not browser pop-up, not new window).
- [ ] Book detail shows message + values + (optional) context.
- [ ] **Recipient onboarding teaching moment** renders on the recipient's first-ever kudos read (Test C3). Does NOT render on subsequent reads (Test C4). Team-kudos variant copy ("your team") renders for team-recipient kudos.
- [ ] First-ever-read claim is race-free via `team_member.first_kudos_read_at` atomic conditional UPDATE.

*Library UI + animation*
- [ ] Homepage hardcoded product hero line + "Your books are being picked up" indicator + "This week we're noticing" prompt sign + New Arrivals + team shelves + leaderboard + wayfinding signage.
- [ ] Culture-statement equivalent for AG lives on marketing page Built-for-UBC section (NOT on `/library`).
- [ ] Book-open page-turn (≤600ms); reduced-motion = instant.
- [ ] Book-hover micro-animation (≤200ms); reduced-motion = no transform.
- [ ] No sound effects.
- [ ] Leaderboard Top-N respects admin config; distinct Week vs. Month card designs.
- [ ] Search-by-name navigates to that shelf.

*Manager*
- [ ] Weekly/biweekly digest per-manager.
- [ ] Non-empty: `manager_digest` with full text + magic deep-links + "Badges your team earned" private section (actor-excluded — Test C7).
- [ ] Empty: `manager_quiet_week`.
- [ ] Overlooked-recipient nudge: weekly; lists overlooked direct reports with `/celebrate` deep-links.
- [ ] Work anniversary reminder: lead time per admin config; direct manager + manager's manager (or admins); actor-excluded; subject opt-out respected (Test H9, C8).
- [ ] Each `email_settings` toggle is independent.

*Prompt-of-the-week system*
- [ ] Admin can schedule weekly featured prompts in Library Setup → Prompts (calendar view; can schedule ahead; optional `pre_tag_value_id` link).
- [ ] Wednesday email fires to anyone who hasn't given a kudos this calendar week AND has the prompt_of_the_week toggle on.
- [ ] Friday admin reminder fires if no `featured_prompt` row exists for the upcoming Monday's week.
- [ ] If no admin-scheduled prompt, system auto-rotates from `is_default_rotation` pool starting Sunday night (Test H8).
- [ ] Prompt-of-the-week visible prominently at top of `/celebrate`.
- [ ] If active prompt has `pre_tag_value_id`, `/celebrate` pre-tags that value on form load.

*"Your books are being picked up" mechanic*
- [ ] In-app indicator on `/library` and `/profile`: live counter of this-week reads of the user's given kudos (Test C5). Tenant-local week boundary.
- [ ] Click → details view (which kudos were read, by whom).
- [ ] Optional weekly Friday digest sends if `email_settings.kudos_was_read_digest = true`. Default off.
- [ ] **Per-event email NEVER fires.**

*Email infrastructure*
- [ ] All 12 email types templated (HTML); admin-editable except T&C/PP; quote footer; quote dedupe best-effort.
- [ ] Dedup fallback: if dedup constraint can't be satisfied, drop constraint silently (random active quote selected; repeats permitted).
- [ ] Send failures retry per outbox backoff schedule; persistent failures (`attempts = 3`) surface as alerts (Test H11 covers cron retry idempotency).
- [ ] No empty-condition emails (except quiet-week).
- [ ] Send log retained 90 days, auto-purged.

*Recognition*
- [ ] Top Giver — Week and Month compute at boundary rollover.
- [ ] Top Giver — Week winner receives announcement (no empty-period email).
- [ ] Private badge milestones award correctly (Test C6); private email to awardee.
- [ ] Soft-delete recomputes badges + leaderboard (Test H5).

*Export, moderation, feedback, quotes, marketing, privacy + accessibility*
- [ ] Manager + Admin CSV export with filters (date / recipient / giver / value / context). Untagged kudos show blank Values column.
- [ ] Admin soft-delete works.
- [ ] User feedback submission + admin Feedback tab.
- [ ] Admin Quotes tab: list with single deactivate-toggle per row; audit-logged; no add-quote functionality.
- [ ] `/` renders all required sections per `12_content_plan.md` §2; copy editable in Templates tab; admin edits logged. AG culture statement renders in Built-for-UBC section. Step 30 output staging-only; production renders after step 38 deploy.
- [ ] Author quotes: ~30-quote seed at deploy. Admin tiny view allows deactivate. Product owner annual review log maintained in `AUTHOR_REVIEW_LOG.md`.
- [ ] User can request data export.
- [ ] User can request account self-delete.
- [ ] WCAG 2.1 AA audit + remediation + re-audit complete (formal conformance report).
- [ ] Sentry: PII stripped from events.

*Content plan + team training (see companion docs)*
- [ ] All sample copy finalized per `12_content_plan.md` §10 open items.
- [ ] AG team rollout / kickoff session held before production launch per `14_launch_adoption_plan.md`. Required completion criteria: 60-minute live session walking through the product; recorded for absentees; one office-hours session offered the following week; rollout email goes out day before.

*Witnessing-trigger validation (week 4–6 post-launch)*
- [ ] Single-question survey sent to AG team per `13_measurement_validation_plan.md`. Responses coded for witnessing vs gratitude. Findings recorded in repo `LAUNCH_VALIDATION.md`. If gratitude wins ≥60% of clear-coded responses, content plan kicks off a copy revision pass.

### Polish gates (not blocking; charming-not-required)

- [ ] Cat on homepage.
- [ ] Librarian walks across screen ~hourly (reduced-motion pauses).
- [ ] Book-hover micro-animation smooth.
- [ ] Library-themed copy throughout (post content plan).
- [ ] First-visit recognition ("cozy library" within 5 seconds).
- [ ] Badge milestone email tone-pass (lighten the Atwood Accolade and any treacly copy).

---

## 8. Out of Scope

1. Mobile
2. AI-generated review summaries
3. Private kudos
4. Self-kudos
5. End-user flagging UI
6. User-uploaded images
7. Anonymous givers
8. Scheduled or draft kudos
9. In-app notifications / push / SMS
10. In-app reply/comment threads
11. Review-mode tagging
12. Profile photos
13. Cross-team / public browsing
14. Reactions on kudos
15. Slack / Teams plugin
16. Email-to-kudos (v1.0.1 contingent commitment — see §9)
17. Game-world walk-around library navigation
18. Custom admin-defined badges (v1.1+)
19. Multi-language support
20. Passwords in v1 (planned for v1.x if needed)
21. Pricing page
22. Multi-tenant self-serve org signup (v2)
23. Public sign-up flow for individuals
24. Public Roadmap section on marketing page
25. Unit Leader as a separate role from Manager
26. Multi-tenant production / on-prem (v1.5 / v2)
27. Sound effects
28. "Did you know" author facts
29. 3D pull-off-shelf book animation
30. 6-digit code login fallback
31. Birthdays auto-celebration
32. Group / collaborative kudos (v1.1)
33. Manager-to-employee distinct treatment
34. HRIS / Workday integration
35. Advanced analytics dashboards
36. Goals / OKRs / KPIs tagging
37. Special Collections (v1.1)
38. Changelog (v2)
39. Admin add-quote functionality (v1: tiny deactivate-only view; v1.5+ may add)
40. Admin badge editor (v1.1+)
41. Points / rewards / redemption economy
42. **Per-event "your kudos was read" email** (in-app indicator + optional weekly digest only)
43. **Per-tenant `library_culture_statement` content row** (hero line hardcoded; tenant-specific cultural content goes in marketing page only)
44. **Required-at-submit value tagging** (was a hard rule; reopened to pre-tagged-with-skip — see `15_decision_log.md`)
45. **Mural archive import** (Mural retired without data migration; library starts empty — see `14_launch_adoption_plan.md` + `15_decision_log.md`)

---

## 9. Future Extension (stub — see roadmap doc)

The full v1.x / v1.5 / v2 roadmap lives in `07_v2_strategy.md`. This stub captures only what's load-bearing for v1.0 build decisions:

**Email-to-kudos — committed as v1.0.1 patch IF the week-4 witnessing-vs-gratitude survey confirms witnessing as the primary trigger.** Not "to be considered" — explicitly committed to as the default v1.0.1 release, contingent on the survey result. The witnessing-decays-through-the-day problem (witnessed at 10:47am; opened the library at 4:15pm; specifics have decayed) is exactly what email-to-kudos solves. Once witnessing is validated, this becomes the default next move. Viable in UBC environment (no Slack/Teams plugin needed). Estimated 1–2 weeks.

Everything else — Special Collections, surprise badges, custom admin-defined badges, mobile, group kudos, admin add-quote, far-future items — see `07_v2_strategy.md`.

---

## 10. Build Order (phase table)

Optimized for: (a) kudos flow live ASAP to test whether AG uses the product, (b) safety basics (backup, app-gate, audit) in place BEFORE data accumulates, (c) admin config tabs added when needed not preemptively.

| Phase | Target | Goal | Key milestones | Gate |
|---|---|---|---|---|
| **A** | End of week 2 | Foundation + safety basics | Scaffold (Next.js + Prisma + Sentry + Plausible + Framer Motion). Migrations + seeds (tenant-aware throughout) for all tables per ADD §4. Backup/DR setup BEFORE any user data (Neon PITR + nightly verified restore-to-staging). Magic-link login + magic deep-link + first-device confirmation. T&C + Privacy Policy modal. Kudos schema + give-a-kudos flow with 15-min edit window + delayed recipient_notify. `sendEmail` adapter + recipient_notify template. Library homepage stub. Book detail with page-turn + first-ever-read teaching moment. | **🎯 MVP checkpoint**: AG can give/receive kudos + see teaching moment on first read. Hand to AG in friendly pre-prod. Decide whether to continue. |
| **B** | End of week 4 | Manager value | Admin Roster tab. App-gate ≥2 admins check. Manager digest worker (non-empty + quiet-week). CSV export. Team shelves + team-kudos mode. Leaderboard cards. New Arrivals component. | Manager-value gate. |
| **C** | End of week 5 | Recognition + engagement loop | Private badge milestone system (9 badges + weekly streak evaluator + private email). Top-giver announcement worker. Inactive-giver nudge worker (4+-week escalation). Overlooked-recipient nudge worker. Work anniversary reminder worker. Prompt-of-the-week system (scheduling + Wednesday email + admin Friday reminder + Sunday-night default rotation). "Your books are being picked up" in-app indicator + optional weekly digest. | Full engagement loop live. |
| **D** | End of week 6 | Admin config + user features | Admin Templates / Schedules / Library Setup / Quotes (tiny view) / Feedback tabs. User `/profile` (shelf + badges + indicator + Email Settings panel + data export + account delete + Send Feedback). Data subject rights (export endpoint + self-delete + kudos-removal request). | User-facing complete. |
| **E** | End of week 7 | Public surface + content | Marketing page at `/` stub (staging-only). Content plan working session — finalize all copy per `12_content_plan.md` §10. Capture real marketing-page screenshots from now-functional app. | Content plan applied. |
| **F** | End of week 8 | Accessibility + launch | WCAG 2.1 AA audit + remediation (timeboxed 5 working days) + re-audit. Polish pass (cat, librarian walk, wayfinding signage, final copy). **Mural retirement + last meeting-kudos handoff** per `14_launch_adoption_plan.md`. Team rollout / kickoff session (60min live + recorded + office-hours followup + rollout email). Deploy to Vercel production with seeded AG team (production launch gate must pass). | **Live with AG.** |
| **Post-launch** | Weeks 4–6 | Validation | Witnessing-vs-gratitude survey per `13_measurement_validation_plan.md`. Findings recorded in `LAUNCH_VALIDATION.md`. Decision rule: if gratitude wins ≥60%, content plan revision pass within 2 weeks. | Witnessing hypothesis validated (or revised). |

Step-level detail (the prior PRD §15 numbered steps) lives in the v7.5.4 archived PRD if needed; for build execution Claude Code should consume this phase table + the tests in `16_acceptance_test_spec.md` + the architecture per ADD §15. A thin BUILD_PLAN.md may be added per phase as Claude Code starts each phase.

---

## Appendix A: Companion-doc map

| Doc | Purpose | When to consult |
|---|---|---|
| `09_ADD_kudos_library.md` | How it's built — schema, contracts, flows, infrastructure | Always alongside this PRD when building |
| `16_acceptance_test_spec.md` | Verification contract Claude Code must satisfy | At every phase gate |
| `15_decision_log.md` | Product decisions + rationale | When asking "why didn't we do X instead?" |
| `12_content_plan.md` | All user-facing language; locked vs sample copy distinction | When implementing any user-facing surface |
| `13_measurement_validation_plan.md` | Success metrics, targets (recalibrated for Mural migration), witnessing survey, contingency rule | Pre-launch (targets) + post-launch (week 4 / 6 / 8 / 12 reviews) |
| `14_launch_adoption_plan.md` | The Mural-retirement adoption strategy | Pre-launch (the strategy) + during launch (the sequence) |
| `07_v2_strategy.md` | v1.5 pilot + v2 commercial vision | Anytime someone asks about the future |
| `05_author_quotes_starter.md` | Author quote seed set + verification process | Content plan + author governance |
| `06_email_design_brief.md` | HTML email template design system | Email infrastructure build |
| `03_design_intent.md` | Cozy British library aesthetic spec | UI/visual design work |
| `10_design_deliverables.md`, `11_design_system.md`, `11_design_tokens.css` | Design system implementation | UI build |
| `01_prework_seven_questions.md`, `02_brain_dump_notes.md` | Origin context | Onboarding new contributors |
| `08_internal_trigger_memo.md` | Hook Model analysis driving witnessing-trigger framing | Anyone challenging the witnessing-as-trigger choice |
| `_archive/` | Pre-restructure PRD (v7.5.4) and ADD (v1.4) snapshots | If you need to see how a section looked before restructure |

---

## Appendix B: Change Log

| Rev | Date | Summary |
|---|---|---|
| 8.0 | 2026-06-04 | **Restructure pass.** PRD trimmed from ~60 pages (1,665 lines) to ~15 pages per David's bar. No product changes; everything moved to dedicated docs: Decision Log (Appendix A → `15_decision_log.md`), Worked Example (§13 → `16_acceptance_test_spec.md` as the verification contract), Behavioral criteria + contingency (§7 → `13_measurement_validation_plan.md` with targets recalibrated for Mural-migration scenario), Database Schema (§11 → ADD §4 Schema definitions), Env vars (§10 → ADD §12), External Service Contracts (§12 → ADD §6), Domain Rules content (§14 → `12_content_plan.md`), Domain Rules behavior preserved as walkthrough + hard rules. **New material:** `14_launch_adoption_plan.md` captures Mural retirement as the adoption strategy (was background context; now load-bearing) + resolves the "Friday meeting kudos = unprompted?" question (no — counts as external). Pre-restructure PRD archived at `_archive/04_PRD_library_of_kudos_v7.5.4_pre_restructure.md`. |
| 7.5.4 | 2026-06-02 | ADD critic batch-3 reconciliation: added `team_member.first_kudos_read_at` column to schema (atomic claim mechanism for first-ever-read teaching moment). No product changes. |
| 7.5.3 | 2026-06-02 | ADD critic batch-2 reconciliation: NextAuth credentials-provider claim aligned ("single-column migration + provider wiring (~1 day)" — not "no schema migration"). |
| 7.5.2 | 2026-06-02 | ADD-driven reconciliation: added `kudos.badge_evaluated_at` + `cron_run_log` table; updated cost tally to ~$29/mo (Vercel Pro). |
| 7.5.1 | 2026-06-02 | Product name locked: "The Kudos Library" (was "Library of Kudos"). |
| 7.5 | 2026-06-02 | JTBD critique addressed: §3 rewritten in JTBD format; multiple progress dimensions surfaced; §1 adds "doing nothing" sentence; 15-min edit window + delayed recipient_notify; social-dimension framing on two Decision Log entries; library metaphor justification; worst-case email volume model; launch-day surfacing tactics. |
| 7.4 | 2026-06-02 | Hook Model follow-up: pay-it-forward nudge spec'd; form-reset on "Recognize another teammate"; email-to-kudos committed as v1.0.1 contingent; pre-tag from giver's-most-used over rolling 30d; passive prompt sign on `/library`; `show_pickup_indicator` toggle; teaching moment team-kudos variant; surprise badges as v1.1 experiment. |
| 7.3 | 2026-06-02 | Hook Model memo integration: witnessing named as internal trigger; library hero line locked + productized; values tagging reopened to pre-tagged-with-skip; prompt-of-the-week system; inactive-giver nudge becomes 4+-week escalation; "your books are being picked up" mechanic; recipient onboarding teaching moment; book design random default rotation; §7 behavioural metrics rewritten with unprompted-giver rate. |
| 7.2 | 2026-06-01 | Critique-driven targeted fixes: composite FKs added; T&C content requirements expanded; marketing page sections defined as canonical list; subject opt-out for anniversaries; production-gate detection mechanism; staging-only enforcement; quote-dedup fallback; build order reordered so screenshots captured BEFORE WCAG audit. |
| 7.1 | 2026-06-01 | Editorial cleanup: revision history extracted to Change Log; Decision Log added; front matter cleaned; no spec changes. |
| 7.0 | 2026-06-01 | `tenant_id` columns added throughout schema; app-gate ≥2 admins replaces emergency-promote; tiny admin Quotes-deactivate-only view; named-badge v2 fallback explicit; FIPPA reframed as prototype-acceptance; magic deep-link confirmation framed as forwarding-friction; sample-copy disclaimer; marketing page staging-only; vendor breach rule defined; v1.5 timeline corrected. |
| 6.0 | 2026-05-31 | Up to 3 admins; SA sub-team added; AG culture statement architecture clarified; timezone naming clarified; FIPPA reframed as prototype-acceptance; active-giver = 2-week window; team kudos to any AG team; anniversary fields (ubc + ag dates); /profile email-settings toggles; quotes product-controlled; New Arrivals (not Just Returned); /give → /celebrate. |
| 5.0 | 2026-05-30 | Critique-driven rewrite: v2 material extracted; FIPPA flagged as needing PIA; build order inverted (kudos flow first); bus-factor mitigation; DB backup/DR; magic deep-link tightened. |
| 4.0 | 2026-05-30 | Lean v1 additions: values tagging, kudos prompts, Recent Activity, overlooked-recipient nudges, slim work anniversary MVP, T&C + Privacy Policy spec. |
| 3.0 | 2026-05-30 | Creative additions: team books, Canadian-author badge theming, author-quote email footers, magic deep-link, customizable leaderboards, HTML email design. |
| 2.0 | 2026-05-29 | First gap-filling pass: stack proposed; badges drafted; values + context tagging discussed. |
| 1.0 | 2026-05-28 | Initial PRD draft against David's template; gaps flagged. |
