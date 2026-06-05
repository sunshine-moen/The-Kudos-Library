# The Kudos Library — Implementation Plan

**Based on:** PRD v8.0 · ADD v1.4 · Design System v1.2 · Design Tokens v1.0 · Acceptance Test Spec v1.0 (2026-06-04)
**Stack:** Next.js 15 (App Router) · Postgres/Neon · Prisma · NextAuth · Resend · Vercel Pro · Tailwind v4 · Framer Motion · Playwright

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-05 | v1.2 | Critic batch 2 applied — 19 issues resolved (7 Definitely-Fix, 4 Worth-Fix, Phase A descope + Phase C split, 6 polish items). See "v1.2 Critic Batch" table below. |
| 2026-06-05 | v1.1 | VP review applied — 32 issues resolved (3 Critical, 11 High, 12 Medium, 6 Low). |
| 2026-06-05 | v1.0 | Initial plan from PRD v8.0 · ADD v1.4 · Design System v1.2 · Design Tokens v1.0. |

---

## v1.2 Critic Batch — Issues Resolved

| # | Severity | Change |
|---|----------|--------|
| 1 | Fix | Scaffold cron route notation corrected from `[name]/route.ts` to the 13 explicit handler paths (consistent with fix #12 in v1.1). |
| 2 | Fix | `featured_prompt` schema/seed conflict resolved: `week_start_date` is nullable; UNIQUE constraint becomes a partial index `WHERE week_start_date IS NOT NULL`. Default-rotation prompts have NULL week_start_date. Reconciled in ADD §4 Schema definitions. |
| 3 | Fix | Outbox stuck-row alert now requires `attempts = 3 AND delivered_at IS NULL AND cancelled_at IS NULL` (matches ADD §11 alert spec; legitimate cancellations don't trigger). |
| 4 | Fix | `/api/admin/health` auth model specified: dedicated `ADMIN_HEALTH_SECRET` env var; endpoint verifies via `crypto.timingSafeEqual()`. NOT a public endpoint; NOT reusing `CRON_SECRET`. |
| 5 | Fix | Account delete 30-day grace period lifecycle specified: `team_member.pending_deletion_at TIMESTAMPTZ NULL` column (added to ADD §4); `account-deletion-processor` cron (daily) hard-deletes rows where `pending_deletion_at < NOW() - INTERVAL '30 days'`; user cancellation via "Restore account" link in grace-period email. |
| 6 | Fix | Migration 005 split into 005a–d (consistency with the 002a/002b principle). |
| 7 | Fix | Phase B deliverables now explicitly include the team-kudos teaching-moment variant ("This is what [giver_first_name] saw your team do."). |
| 8 | Worth | Mural rollback trigger criteria pinned: invoke the rollback if `unprompted-giver rate < 10% for 3 consecutive weeks after week 6` per `13_measurement_validation_plan.md` contingency rule. |
| 9 | Worth | AG roster CSV added as explicit Day-1 prereq with required columns + owner. |
| 10 | Worth | `16_acceptance_test_spec.md` confirmed to exist (created 2026-06-04 as part of PRD restructure); version pinned. |
| 11 | Worth | Magic-link new-device UX trade-off flagged: cross-device reading requires fresh authentication; intentional security stance. |
| 12 | Scope | Phase A descoped to protect the MVP checkpoint: `/library` polish, axe-core integration, and NavHeader polish moved to Phase B. Phase A ships minimal layout + skip-link landmarks + hero. |
| 13 | Scope | Phase C split into C1 (Week 5: badges + soft-delete cascade + top-giver + inactive-nudge) and C2 (Week 5.5/6: prompt-of-the-week system + work-anniversary + pickup counter + kudos-was-read-digest + pay-it-forward + WayfindingSign + Giphy filter + featured-prompt UI + email copy review). Phase D collapses into the existing Week 6 slot. End date holds; sequencing is more honest. |
| 14 | Polish | Cron count reconciled: 13 crons (was 11 in ADD §2 topology — ADD updated). |
| 15 | Polish | WCAG manual testing noted as the bulk of Phase F effort (axe-core gates per phase catch automated issues only; ~30–50% of WCAG 2.1 AA criteria). |
| 16 | Polish | Production hostname DNS request moved to Day 1 (alongside Resend DNS); not deferred to Phase E. |
| 17 | Polish | `AG_TENANT_ID` env var documented with v1.5-future-obsolescence note (becomes session-derived tenant lookup in multi-tenant). |
| 18 | Polish | Ephemeral Postgres in CI clarified: Docker container (postgres:16-alpine) spun up in CI job; not Neon test branch (avoids consuming Neon compute on every PR). |
| 19 | Polish | `lib/content/hardcoded.ts` file header comment specified: `// Locked: not admin-editable; cross-tenant product voice; see 15_decision_log.md`. |

---

## Review Summary (from v1.1)

Reviewed: 2026-06-05 | Reviewers: VP Product, VP Engineering, VP Design | Issues: 32 (3 Critical · 11 High · 12 Medium · 6 Low)

### Changes Applied (v1.1)

| # | Severity | VP | Change |
|---|----------|----|--------|
| 1 | Critical | Eng | Added `failed_at` column + Sentry alert spec to `email_outbox`; outbox dead-letter runbook trigger defined |
| 2 | Critical | Eng | Specified `crypto.timingSafeEqual()` for CRON_SECRET verification + explicit 404 for unknown cron names |
| 3 | Critical | Eng | Removed duplicate `lib/tenant/context.ts`; consolidated TenantContext + AG_TENANT_ID into `lib/auth/tenant-context.ts` |
| 4 | High | Product | Added Mural rollback contingency: emergency meeting-kudos ritual preserved as fallback during weeks 2–6 |
| 5 | High | Product | Added `16_acceptance_test_spec.md` to Critical Source Files; flagged as required prerequisite for Phase F gate |
| 6 | High | Product | Added `13_measurement_validation_plan.md` and `05_author_quotes_starter.md` to Critical Source Files |
| 7 | High | Design | Added axe-core accessibility gate per-phase starting Phase B; Phase F audit is now a confirmation pass only |
| 8 | High | Design | Page-turn animation capped at 400ms (was 600ms); user motion preference toggle specified |
| 9 | High | Design | Teaching moment vs. pay-it-forward priority rule defined: teaching moment takes precedence on first read; nudge shown on all subsequent reads |
| 10 | High | Eng | Migration 002 split: `team` first (002a), then `team_member` with self-FK and sub_team FK (002b); no circular ordering |
| 11 | High | Eng | Neon environment separation specified: prod branch, staging branch, dev branch — dr-verify targets staging only |
| 12 | High | Eng | 13 cron handlers split across individual route files; dynamic dispatch removed |
| 13 | High | Eng | Magic-link token security model clarified: new-device click invalidates token, issues new device confirmation flow |
| 14 | High | Eng | Soft-delete recomputation scoped to affected giver only; index on `(giver_id, tenant_id, deleted_at)` prevents full-table scan |
| 15–32 | various | — | See v1.1 commit; preserved unchanged in v1.2. |

---

## Context

UBC Annual Giving (~10–20 people) needs a private, library-themed peer-recognition app where kudos appear as books on personal bookshelves. The core emotion is **witnessing** — preserving the moment you notice a colleague doing something good. On launch day, the existing Mural board kudos ritual is retired entirely; this is a replacement, not an addition. Adoption risk is real: expect a dip in weeks 2–6 as meeting-triggered kudos die before witnessing-triggered ones form. A post-launch survey (week 4) validates whether the witnessing hypothesis holds.

The architecture is designed for v1.5 multi-tenant readiness — no schema rewrite at that point. Every design decision flows from three-layer tenant isolation: Postgres composite FKs, repository-pattern TenantContext, and a Playwright cross-tenant test suite that fails the build if any layer is breached.

---

## Pre-Phase-A Prerequisites (Day 1 — block on these before scaffolding)

These MUST exist before Phase A begins. They have lead times outside Rebekah's control:

1. **AG roster CSV.** Required columns: `first_name`, `last_name`, `email`, `department`, `job_title`, `ubc_hire_date` (ISO), `ag_join_date` (ISO), `manager_email`, `sub_team` (one of: BB, IF, OPS, SA, or blank for unit lead). Owner: Rebekah. If not ready, Phase A's seed step blocks.
2. **Resend custom-domain DNS records submitted to UBC IT.** SPF, DKIM, DMARC. 24–72h DNS propagation. Submit Day 1.
3. **Production hostname DNS record requested from UBC IT.** Submit Day 1 alongside Resend DNS — UBC IT DNS lead times are unpredictable. Don't wait for Phase E.
4. **Neon Postgres project created** with three branches: `prod`, `staging`, `dev`. PITR enabled on prod (7-day window).
5. **Vercel Pro account active** + `CRON_SECRET` and `ADMIN_HEALTH_SECRET` (≥32 chars each, distinct per env) generated.
6. **`16_acceptance_test_spec.md` v1.0 confirmed present** in repo root (was created 2026-06-04 as part of PRD restructure). The Phase F gate depends on it.
7. **Content plan working session calendar block** for early Phase E (per `12_content_plan.md` §10 open items).
8. **Witnessing-vs-gratitude survey** drafted in TypeForm (per `13_measurement_validation_plan.md`); response collection scheduled for Week 4 post-launch.

---

## Project Scaffold Structure

```
the-kudos-library/
├── app/
│   ├── (public)/page.tsx           # / — marketing page (staging-only until Phase F)
│   │   ├── login/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── terms/page.tsx
│   ├── (authed)/
│   │   ├── layout.tsx              # Session guard → /login if no session
│   │   ├── library/page.tsx
│   │   ├── shelf/[member]/page.tsx
│   │   ├── team/[slug]/page.tsx
│   │   ├── book/[id]/page.tsx      # Modal route (intercepting)
│   │   ├── celebrate/page.tsx
│   │   └── profile/page.tsx
│   ├── admin/
│   │   ├── layout.tsx              # Admin role gate + tab nav
│   │   ├── health/route.ts         # GET /api/admin/health (ADMIN_HEALTH_SECRET-gated)
│   │   └── {roster,templates,schedules,library-setup,quotes,feedback}/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── kudos/route.ts          # POST · PATCH · DELETE
│       ├── kudos-read/route.ts     # POST
│       ├── export/route.ts         # GET (CSV stream)
│       ├── feedback/route.ts       # POST
│       └── webhook/cron/           # 13 INDIVIDUAL route files (no dynamic [name] dispatch)
│           ├── outbox-poller/route.ts
│           ├── badge-evaluator/route.ts
│           ├── manager-digest/route.ts
│           ├── prompt-of-the-week/route.ts
│           ├── prompt-admin-reminder/route.ts
│           ├── inactive-nudge/route.ts
│           ├── overlooked-recipient/route.ts
│           ├── anniversary-reminder/route.ts
│           ├── top-giver-announcement/route.ts
│           ├── kudos-was-read-digest/route.ts
│           ├── leaderboard-rollover/route.ts
│           ├── account-deletion-processor/route.ts
│           ├── audit-purge/route.ts
│           └── dr-verify/route.ts
│           # 14 total — 13 product crons + dr-verify
├── lib/
│   ├── db/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   └── repositories/           # kudos · kudos-read · team-member · team ·
│   │       ...                     # featured-prompt · value-tag · context-category ·
│   │                               # badge · leaderboard · outbox · audit · static-content ·
│   │                               # email-template · author-quote · feedback · team-settings
│   ├── auth/
│   │   ├── tenant-context.ts       # TenantContext type; AG_TENANT_ID constant (v1 single-tenant; v1.5+ replaces with session-derived lookup); extractTenantContext()
│   │   ├── middleware.ts           # withTenantContext; requireAdmin; requireManager
│   │   └── magic-link.ts          # Deep-link token issue + verify (new-device click invalidates token; issues new confirmation)
│   ├── email/
│   │   ├── send.ts                 # sendEmail adapter (Resend) — ONLY file that calls Resend
│   │   ├── quote-footer.ts         # selectQuote() with dedup logic
│   │   └── templates/              # 12 template .tsx files
│   ├── outbox/
│   │   ├── writer.ts              # writeOutboxRow(tx, opts)
│   │   └── poller.ts              # drain() — called by cron/outbox-poller only
│   ├── cron/
│   │   ├── digests.ts             # manager-digest, manager-quiet-week
│   │   ├── nudges.ts              # prompt-of-week, inactive-nudge, overlooked-recipient, kudos-was-read
│   │   ├── anniversaries.ts
│   │   ├── leaderboards.ts        # rollover + top-giver-announcement
│   │   ├── badge-evaluator.ts
│   │   ├── account-deletion.ts    # processes pending_deletion_at rows past grace period
│   │   ├── purge.ts               # audit-purge (send log + expired tokens)
│   │   └── dr-verify.ts           # nightly restore-to-staging verify
│   ├── badges/
│   │   ├── criteria.ts            # evaluateCriteria(criteria, giverState) → bool
│   │   └── seed.ts                # 9 hardcoded badge definitions for AG
│   ├── errors/app-error.ts        # AppError base class + subclasses
│   ├── content/hardcoded.ts       # PRODUCT_COPY constants — file header comment:
│   │                               # "// Locked: not admin-editable; cross-tenant product voice; see 15_decision_log.md"
│   └── analytics/plausible.ts    # track(event, props)
├── components/
│   ├── ui/                        # Button (3 variants) · Input · Callout · Modal · Toast
│   ├── library/                   # BookSpine · Shelf · LibraryCard · WayfindingSign
│   ├── kudos/                     # KudosForm · BookDetail · PageTurnAnimation
│   ├── admin/                     # RosterTable · TemplateEditor · SchedulePanel · etc.
│   ├── email/                     # Shared email layout (web-safe fonts)
│   └── layout/NavHeader.tsx · Footer.tsx
├── styles/
│   ├── design-tokens.css          # Copy of 11_design_tokens.css — single source of truth
│   └── globals.css                # @import tokens + @theme block for Tailwind v4
├── prisma/schema.prisma + migrations/
├── scripts/seed/
│   ├── seed-ag-tenant.ts          # Full AG seed (reads AG roster CSV from /scripts/seed/data/)
│   └── seed-test-tenant.ts        # Synthetic tenant for CI isolation tests
├── playwright/
│   ├── tenant-isolation/          # Cross-tenant attempt tests (build-blocking)
│   ├── flows/                     # Core user flow e2e tests
│   └── fixtures/                  # Shared auth helpers
├── docs/runbooks/                 # outbox-stuck-row · dr-verify-failed · restore-from-pitr · cross-tenant-fail
├── vercel.json                    # 14 cron schedules (13 product + dr-verify + account-deletion-processor; see below)
├── LAUNCH_VALIDATION.md           # Post-launch witnessing survey results (populated post-launch)
└── .eslintrc.json                 # Includes no-raw-prisma-outside-repos rule
```

---

## Architecture Invariants (enforce from day 1)

**1. Transactional outbox — always co-commit.** Kudos write + `email_outbox` row happen in the same `prisma.$transaction()`. No exceptions. `sendEmail` is called ONLY from `lib/outbox/poller.ts`.

**2. Repository pattern with TenantContext.** Every repository function signature: `async function doX(ctx: TenantContext, ...): Promise<T>`. ESLint rule (`no-restricted-imports`) prevents raw `PrismaClient` usage outside `lib/db/repositories/*` and `lib/db/prisma.ts`.

**3. Cron handlers write to outbox only** — never call `sendEmail` directly. Idempotency keys prevent duplicate sends on Vercel retry.

**4. Composite FKs** — write these as raw SQL in migrations (not Prisma model syntax). Every child table references parent via `(id, tenant_id)` composite key. Cross-tenant linkage is rejected at DB level.

**5. Build fails on cross-tenant breach** — Playwright tenant-isolation suite runs in CI against a synthetic second tenant.

**6. CRON_SECRET and ADMIN_HEALTH_SECRET use constant-time comparison** — `crypto.timingSafeEqual()`. Unknown cron handler paths return 404 (no dynamic dispatch). The `/api/admin/health` endpoint verifies a distinct `ADMIN_HEALTH_SECRET` (NOT reused from `CRON_SECRET`).

**7. Outbox dead-letter handling** — `email_outbox` has `failed_at TIMESTAMPTZ NULL` AND `cancelled_at TIMESTAMPTZ NULL` columns. Sentry alert fires when any row reaches `attempts = 3 AND delivered_at IS NULL AND cancelled_at IS NULL` (legitimate cancellations do NOT trigger the alert). The `outbox-stuck-row` runbook triggers on this alert.

**8. `PRODUCT_COPY` hardcoded constants are intentional** — shared voice across tenants, version-controlled, not admin-editable by design. File header comment in `lib/content/hardcoded.ts` documents the intent: `// Locked: not admin-editable; cross-tenant product voice; see 15_decision_log.md`.

---

## Database Migration Sequence

| Migration | Tables |
|-----------|--------|
| 001 | `tenant`, `icon_preset` (no tenant_id — created first) |
| 002a | `team` (must exist before team_member sub_team FK) |
| 002b | `team_member` (composite self-FK + sub_team FK referencing 002a `team`; includes `first_kudos_read_at`, `pending_deletion_at`) |
| 003 | `magic_link_token`, `device_confirmation`, `team_settings` |
| 004 | `value_tag`, `context_category`, `prompt_starter`, `author_quote`, `static_content`, `email_template` |
| **005a** | `featured_prompt` (with `week_start_date` NULLable; partial UNIQUE `(tenant_id, week_start_date) WHERE week_start_date IS NOT NULL`; default-rotation prompts have NULL week_start_date and are not subject to the uniqueness constraint) |
| **005b** | `kudos` (with all CHECK constraints + composite FKs) |
| **005c** | `kudos_value` (composite FK to kudos + value_tag) |
| **005d** | `kudos_read` |
| 006 | `badge_definition`, `badge_award`, `leaderboard_winner` |
| 007 | `email_outbox` (with partial index on pending rows; includes `failed_at`, `cancelled_at`, `cancellation_reason`), `email_send_log` |
| 008 | `admin_audit_log`, `cron_run_log`, `work_anniversary_reminder`, `feedback_submission` |

**Key `kudos` CHECK constraints:**
```sql
CHECK (num_nonnulls(recipient_id, team_recipient_id) = 1)  -- exactly one recipient type
CHECK (recipient_id IS NULL OR giver_id <> recipient_id)   -- can't kudo yourself
CHECK (context_text IS NULL OR length(context_text) <= 200)
```

**Key `featured_prompt` constraints (CHANGED in v1.2):**
```sql
-- week_start_date is NULL for default-rotation prompts
ALTER TABLE featured_prompt ALTER COLUMN week_start_date DROP NOT NULL;
-- Partial unique: scheduled prompts must be unique per tenant+week;
-- default-rotation prompts are unconstrained
CREATE UNIQUE INDEX idx_featured_prompt_scheduled
  ON featured_prompt (tenant_id, week_start_date)
  WHERE week_start_date IS NOT NULL;
```

**Active-prompt query** (scheduled prompts only):
```sql
SELECT * FROM featured_prompt
WHERE tenant_id = $tenant
  AND week_start_date = $current_week_start_in_tenant_tz
LIMIT 1;
```

**Default-rotation fallback** (when no scheduled prompt exists):
```sql
SELECT * FROM featured_prompt
WHERE tenant_id = $tenant
  AND is_default_rotation = true
ORDER BY RANDOM()
LIMIT 1;
```

**Key indexes:** `idx_outbox_pending` (partial, WHERE delivered_at IS NULL AND cancelled_at IS NULL AND attempts < 3), `idx_kudos_badge_eval` (WHERE badge_evaluated_at IS NULL AND deleted_at IS NULL), `idx_kudos_read_reader` (reader_id, tenant_id), `idx_kudos_giver` (giver_id, tenant_id, deleted_at — prevents full-table scan on soft-delete recompute), `idx_team_member_pending_deletion` (pending_deletion_at WHERE pending_deletion_at IS NOT NULL — drives the account-deletion-processor cron).

**Neon environment separation:** prod branch → `DATABASE_URL` in Vercel production; staging branch → `DATABASE_URL` in Vercel preview; local dev branch → `.env.local`. The `dr-verify` cron targets the staging branch only — it never touches prod or dev.

**Seed order (after all migrations):** tenant → icon_preset → team → team_settings → value_tag → context_category → prompt_starter → featured_prompt (10 default-rotation prompts with `is_default_rotation = true`, `week_start_date = NULL`) → badge_definition → author_quote (~30) → email_template (12 types) → static_content (terms, privacy, marketing) → team_member (from AG roster CSV in `/scripts/seed/data/ag-roster.csv`).

---

## Design System Integration

`styles/design-tokens.css` — copy verbatim from repo root `11_design_tokens.css`.

`styles/globals.css`:
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?...');  /* 5 families per token file */
@import "./design-tokens.css";
@theme {
  --color-inst-navy: var(--inst-navy);
  --color-lib-cream: var(--lib-cream);
  /* ... all token groups mapped to Tailwind @theme */
}
```

**Enforcement:** Raw hex values in `components/` and `styles/globals.css` are a build error (ESLint regex rule scoped to these directories only — excludes comments, tests, and token files). All colour/font references must use CSS custom properties or the generated Tailwind classes.

**Token drift check:** CI runs `diff 11_design_tokens.css styles/design-tokens.css` and fails the build on any difference. Update `styles/design-tokens.css` by copying from repo root, never editing it directly.

**Email fallback font stack:** When web fonts are blocked in email clients — Georgia (display/body roles), Arial (UI roles), Courier New (card/stamp roles). Hex colours unchanged. Matches design system spec.

**Component build order:** Primitives (`ui/`) → Library atoms (`library/`) → Auth components → Layout (with skip-link, `<nav>`, `<main>`, `<footer>` landmarks from Phase A) → Kudos atoms → Shelf components → Admin components → Email components.

---

## Cron Job Setup

`vercel.json` registers **14 crons** (13 product + dr-verify; account-deletion-processor is the 14th if separated from audit-purge — see cron route list in Project Scaffold). Time-sensitive ones (manager-digest, nudges, anniversaries, etc.) run hourly and self-gate inside the handler using the tenant's `timezone` setting from `team_settings`.

**Note on cross-doc reconciliation:** ADD §2 topology diagram has been updated to show all 13 product crons (was 11 in prior version — missing badge-evaluator and kudos-was-read-digest).

**DST-safe self-gate pattern:**
```typescript
const localHour = parseInt(now.toLocaleString("en-CA", { timeZone: settings.timezone, hour: "numeric", hour12: false }));
const localDay  = now.toLocaleString("en-CA", { timeZone: settings.timezone, weekday: "long" }).toLowerCase();
if (localDay !== "monday" || localHour !== 9) return { skipped: true };
```

Boundary millisecond timing (08:59:59 → 09:00:00) is safe via idempotency keys on `(template_type, tenant_id, week_iso)` — a duplicate fire across the boundary is no-op'd.

All 13 (or 14, with `account-deletion-processor`) handlers live in **individual route files** under `/api/webhook/cron/{handler-name}/route.ts` — **not** a single dynamic `[name]` route. This avoids bundling all handlers into one serverless function (cold-start and 250MB limit risk). Each handler: verify `CRON_SECRET` via `crypto.timingSafeEqual()` → insert `cron_run_log` started row → run logic → update log row with outcome. An unknown path returns 404 immediately.

---

## Phase-by-Phase Deliverables

### Phase A — Foundation + Core Flow (Weeks 1–2)
**Gate: AG MVP checkpoint — decide whether to continue.**

**Descoped in v1.2** to protect the MVP date: `/library` polish, axe-core integration, and NavHeader visual polish moved to Phase B. Phase A ships the minimal scaffolding + core flow + verification suite, not the polished library experience.

- Next.js 15 scaffold; TypeScript strict; ESLint with no-raw-prisma rule
- Tailwind v4 + design tokens wired; Google Fonts via `next/font/google`
- Prisma + Neon; migrations 001–008 (with the 002 and 005 splits); AG seed
- `dr-verify` cron (nightly restore-to-staging) — **test manually before any user data**
- NextAuth magic-link; `/login` page; rate limiting (5 req/15min/IP); ToS acceptance gate
- `withTenantContext` middleware; `AG_TENANT_ID` constant; all 15 repository stubs
- `writeOutboxRow` helper; `sendEmail` adapter (Resend); `AppError` hierarchy
- `POST /api/kudos` (individual only) + `PATCH /api/kudos/:id` (15-min window)
- `outbox-poller` cron — drain; render `recipient-notify`; `sendEmail`; log
- `recipient-notify` email template (teaser + magic deep-link + author quote footer)
- `/celebrate` — individual kudos form: book design picker, font picker (5 presets), Giphy picker, 15-min countdown
- `/celebrate` fast path: recipient + message is a valid kudos submission. Book design, font, Giphy, value tags, and context are all optional enhancements — never blockers.
- `/book/[id]` modal — page-turn animation (≤400ms; instant on reduced-motion); uses Next.js intercepting routes (`(..)book/[id]`); direct URL renders full page; back closes modal. Admin Delete button.
- Magic deep-link: single-use, 14d TTL, device confirmation ("Yes, this is me"). New-device click invalidates token and issues a fresh device confirmation flow. **UX trade-off (flag for QA):** cross-device reading requires fresh `/login` or a new deep-link — recipient who reads on phone can't open the same deep-link on laptop. Intentional security stance (prevents post-recipient forwarding).
- NavHeader (minimal) and Footer with skip-link and semantic landmarks (`<nav>`, `<main>`, `<footer>`) from Phase A — visual polish deferred to Phase B
- `POST /api/kudos-read` — atomic `first_kudos_read_at` claim; return `is_first_ever_read`
- Recipient first-read teaching moment (individual variant) — renders on `/book/[id]` when `is_first_ever_read = true`. Pay-it-forward nudge renders on all subsequent reads. Teaching moment takes precedence on the first read; nudge is hidden on that visit.
- `/library` stub with hardcoded hero line from `PRODUCT_COPY.hero` (full library layout in Phase B)

**Phase A verification:**
- [ ] Magic-link login → `/celebrate` → give kudos → 15-min window active → edit message → email arrives with updated message
- [ ] Recipient clicks magic deep-link → device confirmation → `/book/[id]` → page-turn plays (≤400ms) → teaching moment on first read only; pay-it-forward nudge on second read
- [ ] Kudos with only recipient + message submits successfully (no value tags, no GIF, no font selection)
- [ ] `dr-verify` cron completes without error targeting staging branch (check `cron_run_log`)
- [ ] Tenant-isolation Playwright suite passes (synthetic second tenant cannot read AG data)
- [ ] Acceptance tests C1, C2, C3, C4, H1, H2 from `16_acceptance_test_spec.md` pass

---

### Phase B — Manager Value + Library Experience (Weeks 3–4)

Picks up the Phase-A descoped items + adds manager surfaces.

- Team kudos mode in `POST /api/kudos` (fan out one outbox row per active+on_leave member, each with unique idempotency key `recipient_notify:k:<kudos_id>:r:<member_id>`)
- **Team-kudos teaching-moment variant** (new in v1.2 plan): when a team-recipient kudos is read for the first time, render *"This is what [giver_first_name] saw your team do. The library keeps things like this."* (vs the individual variant *"This is what [giver_first_name] saw."*). Locked product copy per `12_content_plan.md` §1.
- `/admin/roster` — add/edit/deactivate members; on-leave toggle; admin-promote (subject to `team_settings.max_admins`)
- `manager-digest` cron (Mon 09:00 PT, self-gating); `manager_digest` + `manager_quiet_week` email templates
- `overlooked-recipient` cron + email template (opt-out)
- `GET /api/export` — CSV stream; manager scoped to direct reports; admin unrestricted; filters
- `/library` fully wired: New Arrivals shelf + personal/team shelves + leaderboard cards + library wayfinding signage
- `/shelf/[member]`, `/team/[slug]` pages
- `leaderboard-rollover` cron (Mon 00:00 PT + 1st of month); `leaderboard_winner` rows
- Book-hover micro-animation (≤200ms; reduced-motion no transform)
- **NavHeader + Footer visual polish** (deferred from Phase A): UBC Navy header, crest in footer
- **axe-core integration in Playwright** (deferred from Phase A): every Phase B+ verification includes a zero-violation axe-core scan on new screens

**Phase B verification:** manager digest (both variants); overlooked-recipient nudge + opt-out; CSV export scoping; team kudos fan-out; team-kudos teaching-moment variant fires on first read of a team kudos; admin max_admins gate; leaderboard cards correct. axe-core scan passes on `/library`, `/shelf/[member]`, `/team/[slug]`, `/admin/roster`. Acceptance tests C5, C7, H3, H4 from `16_acceptance_test_spec.md` pass.

---

### Phase C1 — Recognition + Soft-Delete (Week 5)

Split from former Phase C in v1.2 to right-size the week.

- `badge-evaluator` cron fully implemented; 9 badge criteria evaluated post-edit-window
- `badge_milestone` email template (private to awardee; actor-excluded from manager section)
- Soft-delete cascade: recompute badge counts + leaderboard_winner in same transaction (scoped to affected giver via `idx_kudos_giver`); cancel outbox if undelivered; log to `admin_audit_log`
- `top-giver-announcement` cron (Fri) + email template
- `inactive-nudge` cron (daily; 4+ consecutive weeks dry; respects on_leave + opt-out)

**Phase C1 verification:** badge milestone award + email (Test C6); soft-delete recompute + outbox cancel (no full-table scan; Test H5); inactive-nudge not firing before 4 weeks; top-giver announcement at Fri boundary. axe-core scan passes on Phase C1 new screens.

---

### Phase C2 — Engagement Loop + Featured Prompts (Week 5.5–6, overlapping with Phase D start)

The behavioural surface — Hook Model loops + library mood-setting.

- `prompt-of-the-week` cron (Wed); `prompt-admin-reminder` cron (Fri); default rotation (Sun night auto-insert, selects from `featured_prompt WHERE is_default_rotation = true AND tenant_id = $tenant`)
- Giphy picker: `rating=g` filter enforced; fallback to text-only kudos if Giphy API unavailable
- `/celebrate` — active featured prompt shown prominently; `pre_tag_value_id` pre-tagged on load (user can toggle it off — it is a default, not forced)
- `/library` — "This week we're noticing" wooden sign shows active featured prompt
- `work-anniversary-reminder` cron (daily; dual opt-out: subject `anniversary_about_me` short-circuits before recipient `anniversary_reminders` evaluation)
- "Your books are being picked up" live counter on `/library` + `/profile`; click → detail view; respects `email_settings.show_pickup_indicator`
- `kudos-was-read-digest` cron (Fri; opt-in only, default OFF)
- Pay-it-forward nudge at bottom of `/book/[id]` (shown on all reads except the first-ever read)
- WayfindingSign hidden (`display: none`) until an active featured prompt exists — no blank sign rendered
- Overlooked-recipient email copy reviewed for tone before Phase C2 ships; opt-out remains default

**Phase C2 verification:** prompt rotation; anniversary dual opt-out (Tests C8, H9); pickup counter live (Test C5); kudos-was-read-digest opt-in only (default OFF respected); pay-it-forward nudge / teaching-moment priority correct. axe-core scan passes on all Phase C2 new screens.

---

### Phase D — Admin Config + User Profile (Week 6, overlapping Phase C2 tail)

- `/admin/templates` — edit 12 email template subjects + HTML; audit-logged; T&C/Privacy shown read-only
- `/admin/schedules` — all cadence + timing knobs
- `/admin/library-setup` — values, context categories, prompt pool, weekly prompt calendar
- `/admin/quotes` — deactivate toggle only; audit-logged
- `/admin/feedback` — triage list; status updates
- `/profile` — shelf shortcut; badge list; pickup indicator; 8 independent email setting toggles; data export; account delete request; Send Feedback
- `POST /api/feedback`
- **Account delete flow (new in v1.2 spec):**
  - User clicks "Delete my account" on `/profile` → confirmation modal → `team_member.pending_deletion_at = NOW()`
  - System sends grace-period email: *"Your account will be deleted on [date 30 days from now]. Click [Restore account] to cancel."*
  - "Restore account" link sets `pending_deletion_at = NULL`; success message; admin notified
  - `account-deletion-processor` cron (daily 09:00 PT, system-wide): for any team_member WHERE `pending_deletion_at IS NOT NULL AND pending_deletion_at < NOW() - INTERVAL '30 days'`, execute hard-delete cascade (kudos given/received soft-deleted via prior soft-delete logic; team_member row deleted; admin_audit_log row written; final confirmation email sent)
  - Data retained in PITR for 7 days post-purge per Neon retention

**Phase D verification:** template edit flows through to next cron send; featured prompt pre-tag works; email settings toggle behavior; user data export; account delete request → grace period email → restore works; account delete request → 30 days pass → cron deletes the account; production gate still enforced.

---

### Phase E — Marketing Page + Content (Week 7)

- `/` marketing page: Hero · What it is · How it works · What's inside · AG culture statement · Sign in CTA
- `robots.txt` disallow on staging; production hostname not yet live (DNS was requested Day 1; should be ready by now)
- Content plan working session — finalize all copy per `12_content_plan.md` §10; seed into DB (email_template, static_content, author_quote, prompt_starter)
- ~30 author quotes seeded from `05_author_quotes_starter.md`; `AUTHOR_REVIEW_LOG.md` initialized
- Library microcopy throughout; cat on homepage = decorative SVG illustration, `aria-hidden="true"`, no interaction
- Librarian walk animation (hourly; reduced-motion pauses) — timebox: 1 day max; cut to Phase F polish if behind schedule
- **Marketing page screenshots captured from live staging app.** Staging is populated with synthetic-but-realistic kudos data (≥15 sample kudos across the 4 sub-teams, with seeded badges + leaderboard winners) so the marketing page shows a real-feeling library, not placeholder rectangles.

**Phase E verification:** all content plan §10 open items resolved; screenshots from functional app (not mockups). Email-to-kudos (v1.0.1) is explicitly out of scope for this plan — tracked separately pending post-launch survey.

---

### Phase F — Accessibility + Launch (Week 8)

WCAG 2.1 AA formal audit — note: per-phase axe-core gates from Phase B caught automated issues (~30–50% of WCAG 2.1 AA criteria). Phase F is **the bulk of WCAG effort**: manual screen-reader walkthroughs, keyboard navigation testing, contrast verification on real hardware, focus-order checks, alt-text review on emails. axe-core passing is necessary but not sufficient.

- WCAG 2.1 AA formal audit (automated + manual; 5-day timebox)
- Remediation; re-audit; conformance report
- Production launch gate: `GET /api/admin/health` → ≥2 active admins (auth via `ADMIN_HEALTH_SECRET` header); deployment workflow checks this before promoting traffic
- AG team rollout: 60-min live kickoff session per `14_launch_adoption_plan.md` (owner: Rebekah; medium: Zoom; agenda: product walkthrough + values list + how to give a kudos + email digest explanation + opt-out walkthrough + "your books are being picked up" explanation); recording posted; office hours offered next week
- **Mural board retired + last meeting-kudos ritual closed out** per `14_launch_adoption_plan.md`
- DNS cutover to production hostname (DNS record was requested Day 1; should propagate well in advance of cutover); Sentry release tag; post-deploy smoke test

**Phase F verification:** WCAG conformance report signed off (manual + automated both clean); all acceptance tests from `16_acceptance_test_spec.md` v1.0 (Tests C1–C8 + H1–H12) green; prod smoke test passing; Mural retired confirmed with team lead; launch communications sent per `14_launch_adoption_plan.md`.

---

### Post-Launch — Witnessing Validation (Weeks 4–6 post-launch)

- Week 4: witnessing-vs-gratitude single-question survey per `13_measurement_validation_plan.md` (owner = Rebekah; tool = TypeForm; minimum response threshold = 80% of active team)
- Week 6: code responses; record in `LAUNCH_VALIDATION.md`
- Decision per `13_measurement_validation_plan.md`: if gratitude ≥60% of clear-coded responses, content revision pass within 2 weeks; if witnessing validates, email-to-kudos (v1.0.1) moves to active development

---

## Testing Strategy

**Playwright tenant-isolation suite** (`/playwright/tenant-isolation/`) — runs in CI against AG + synthetic `test_tenant`. Test cases: read AG kudos as test_tenant session → 403; POST kudos with AG recipient_id as test_tenant → 400/403; GET /api/export as test_tenant → test_tenant data only; etc. **Any cross-tenant success fails the build.** (Maps to Test H10 in `16_acceptance_test_spec.md`.)

**Core flow tests** (`/playwright/flows/`): `give-kudos` (C1), `receive-kudos` (C2, C3), `edit-window` (C1, C2), `soft-delete` (H5), `admin-roster`, `leaderboard`, `badge` (C6).

**CI pipeline:**
1. Lint (including no-raw-prisma + token hex rules)
2. TypeScript strict check
3. Unit tests (repositories with mocked Prisma)
4. **Spin up ephemeral Postgres**: Docker container running `postgres:16-alpine` (NOT a Neon test branch — avoids consuming Neon compute on every PR; CI ephemeral DB destroyed after run)
5. Run migrations + AG + test_tenant seed
6. Playwright tenant-isolation suite
7. Playwright flow suite (with `page.clock.install()` for edit-window timing — see below)
8. Next.js production build
9. → All green: auto-deploy to staging
10. → Manual gate: promote to production

**Edit-window render race testing:** use `page.clock.install()` to simulate the clock jump from minute 14 to minute 15. Specific assertion: *"Kudos edited at T=14m succeeds; email rendered at T=15m+1s reflects the edited version because the outbox poller reads kudos state from DB at render time (not at submit time)."* This is the read-time-semantics guarantee from ADD §5.

**Per-phase axe-core gate** — axe-core integrated into Playwright from Phase B. Each phase verification checklist includes a zero-violation axe-core requirement. Phase F WCAG 2.1 AA formal audit is a confirmation pass for automated issues + the bulk of manual WCAG testing (screen-reader walkthroughs, keyboard nav, contrast verification).

---

## Launch Checklist

**Vercel Pro:** 14 cron entries in `vercel.json`; `CRON_SECRET` and `ADMIN_HEALTH_SECRET` (each ≥32 chars, distinct per env, distinct from each other); staging HTTP basic auth.

**Env vars (dev / staging / prod):** `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `ADMIN_HEALTH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `GIPHY_API_KEY`, `SENTRY_DSN`, `PLAUSIBLE_DOMAIN`, `APP_TIMEZONE=America/Vancouver`, `AG_TENANT_ID` (v1 single-tenant; v1.5+ replaces with session-derived tenant lookup).

**Neon:** PITR enabled (7-day window); pooled connection string; restore-to-staging runbook tested manually before any user data; ≥2 people with Neon access.

**Resend:** Custom domain SPF/DKIM/DMARC submitted **Day 1** (24–72h DNS propagation); test send confirmed before any user receives email.

**Sentry:** `beforeSend` strips `message_text`, `context_text`, emails, magic-link tokens, session cookies, device tokens. Verified PII-free before launch.

**Production launch gate:** `GET /api/admin/health` (authenticated via `ADMIN_HEALTH_SECRET` header) → `{ admins_ok: true }` in deployment workflow. Blocks deploy when fewer than 2 active admins. Auth is `crypto.timingSafeEqual()` on `ADMIN_HEALTH_SECRET`; NOT public; NOT reusing `CRON_SECRET`.

**Mural rollback contingency (TRIGGER CRITERIA pinned in v1.2):** If `unprompted-giver rate < 10% for 3 consecutive weeks after week 6` per `13_measurement_validation_plan.md` contingency rule, the emergency fallback is to restore the brief meeting-kudos verbal ritual (≤5 min at the start of the next standup) while the content revision runs. This is not a permanent option — it exists to prevent a kudos vacuum during the dip window. Owner: Rebekah. Cancel ritual when unprompted-giver rate recovers above 30% sustained for 2 weeks.

**Witnessing survey:** Owner = Rebekah (product lead); tool = TypeForm; minimum response threshold = 80% of active team members before results are coded. 60% gratitude threshold applies only to coded (witnessing/gratitude/unclear) responses, not total responses.

**Leaderboard rollover idempotency:** Idempotency key = `(tenant_id, kind, period_start)`. When the 1st of the month falls on Monday, both rollover triggers fire — the second is a no-op because the `leaderboard_winner` row already exists with that key.

---

## Sequencing Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Resend DNS propagation (UBC IT ticket 3–5 days) | HIGH | Submit Day 1; use non-UBC sender temporarily if needed |
| Production hostname UBC IT DNS record | HIGH | **Submit Day 1 alongside Resend DNS** (not Phase E); UBC IT DNS lead times unpredictable |
| Mural retirement with no fallback | HIGH | Emergency verbal ritual preserved for weeks 2–6 if needed; trigger criteria pinned in Launch Checklist |
| `16_acceptance_test_spec.md` not at Phase F | HIGH | **Confirmed: file exists at v1.0 (2026-06-04). Pinned in Pre-Phase-A prerequisites.** |
| Phase A scope density (no buffer if it slips) | HIGH | Descoped in v1.2 — `/library` polish, axe-core integration, NavHeader visual polish moved to Phase B. If Phase A still slips, MVP checkpoint slides 1 week; Phase B+ compress proportionally |
| Composite FK syntax in Prisma | MEDIUM | Write composite FKs as raw SQL; migration 005 split into 005a-d (consistency with 002a/002b); test early |
| `featured_prompt` schema/seed conflict | MEDIUM | Resolved in v1.2: `week_start_date` nullable + partial UNIQUE; default-rotation prompts have NULL week_start_date |
| Edit-window render race (edit at min 14, send at min 15) | MEDIUM | `page.clock.install()` in Playwright; specific assertion: edited kudos at T=14m → email at T=15m+1s reflects edit (read-time semantics per ADD §5) |
| WCAG findings requiring component rework | MEDIUM | axe-core gate per phase from Phase B; formal audit in Phase F is confirmation pass for automated + bulk-of-effort for manual |
| Magic-link cross-device UX friction | MEDIUM | Documented as intentional trade-off (prevents post-recipient forwarding); flag at QA review |
| `/api/admin/health` auth model | MEDIUM | Resolved in v1.2: dedicated `ADMIN_HEALTH_SECRET` env var; `crypto.timingSafeEqual()` verification |
| Account delete grace period implementation | MEDIUM | Resolved in v1.2: `pending_deletion_at` column + `account-deletion-processor` cron + "Restore account" cancellation path; full lifecycle in Phase D |
| Leaderboard double-trigger on Mon-1st | MEDIUM | Idempotency key on `(tenant_id, kind, period_start)` makes second trigger a no-op |
| Vercel plan tier for minutely crons | MEDIUM | (Reassessed in v1.2 — impact is full cron breakdown if misconfigured) Verify Pro plan in dashboard after any Vercel config change; individual route files prevent bundle size issues |
| Content plan §10 open items not resolved | LOW | Calendar block the working session at start of Phase A |
| Design token drift | LOW | CI diff check fails build if `styles/design-tokens.css` diverges from `11_design_tokens.css` |
| AG roster CSV not ready | LOW | Listed as Pre-Phase-A prerequisite; column spec documented; owner = Rebekah |

---

## Critical Source Files

| File | Version | Purpose |
|------|---------|---------|
| `09_ADD_kudos_library.md` | v1.4+ | Primary technical spec — schema, flows, repo pattern, outbox, cron, env vars. (Reconciled with this plan: ADD §4 has featured_prompt nullable + team_member.pending_deletion_at; ADD §2 topology has all 13 crons.) |
| `04_PRD_library_of_kudos.md` | v8.0 | Product spec — screens, constraints, acceptance gates, phase table |
| `11_design_tokens.css` | v1.0 | Copy verbatim into `styles/design-tokens.css` |
| `11_design_system.md` | v1.2 | Visual reference for all component implementation |
| `12_content_plan.md` | v1.0 | All user-facing copy; canonical source for PRODUCT_COPY constants; email template structure |
| `13_measurement_validation_plan.md` | v1.0 | Post-launch witnessing survey protocol + recalibrated targets + Mural rollback trigger criteria |
| `14_launch_adoption_plan.md` | v1.0 | Mural-retirement adoption strategy; kickoff session details |
| `15_decision_log.md` | v1.0 | Product decisions + rationale (referenced by `lib/content/hardcoded.ts` header comment) |
| `16_acceptance_test_spec.md` | **v1.0 (2026-06-04)** | **Phase F gate — all acceptance tests (C1–C8, H1–H12) must pass before launch.** File confirmed present. |
| `05_author_quotes_starter.md` | v1.0 | Seed source for ~30 author quotes in `author_quote` table |