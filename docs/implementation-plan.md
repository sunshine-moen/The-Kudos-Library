# The Kudos Library — Implementation Plan

**Based on:** PRD v8.0 · ADD v1.4 · Design System v1.2 · Design Tokens v1.0  
**Stack:** Next.js 15 (App Router) · Postgres/Neon · Prisma · NextAuth · Resend · Vercel Pro · Tailwind v4 · Framer Motion · Playwright

---

## Review Summary

Reviewed: 2026-06-05 | Reviewers: VP Product, VP Engineering, VP Design | Issues: 32 (3 Critical · 11 High · 12 Medium · 6 Low)

### Changes Applied

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
| 12 | High | Eng | 13 cron handlers split across individual route files under `/api/webhook/cron/[name]/`; dynamic dispatch removed |
| 13 | High | Eng | Magic-link token security model clarified: new-device click invalidates token, issues new device confirmation flow |
| 14 | High | Eng | Soft-delete recomputation scoped to affected giver only; index on `(giver_id, tenant_id, deleted_at)` prevents full-table scan |
| 15 | Medium | Product | Librarian walk animation scoped to Phase E: max 1 day; cut to Phase F polish if behind schedule |
| 16 | Medium | Product | Giphy picker: Giphy `rating=g` filter required; fallback to text-only kudos if API unavailable |
| 17 | Medium | Product | Pre-tag contract clarified: user can toggle off `pre_tag_value_id`; it is a default selection, not forced |
| 18 | Medium | Product | Witnessing survey: owner = product lead; tool = TypeForm; minimum response threshold = 80% of active team |
| 19 | Medium | Design | `/celebrate` fast path defined: recipient + message submits a valid kudos; all other fields are optional enhancements |
| 20 | Medium | Design | NavHeader/Footer must include skip-link, `<nav>`, `<main>`, `<footer>` landmarks from Phase A build |
| 21 | Medium | Design | BookSpine placeholder state specified for Phase A; hover behavior retrofitted in Phase B with no Phase A regression |
| 22 | Medium | Design | Email fallback font stack defined: Georgia (display/body), Arial (UI), Courier New (card/stamp) — matches design system spec |
| 23 | Medium | Design | Overlooked-recipient email copy review scheduled in Phase C; tone review before enabling default opt-out |
| 24 | Medium | Eng | ESLint hex-value rule scoped to `components/` and `styles/globals.css` only; excluded from comments, tests, and token files |
| 25 | Medium | Eng | `design-tokens.css` sync check added to CI: `diff 11_design_tokens.css styles/design-tokens.css` fails build on drift |
| 26 | Medium | Eng | Leaderboard rollover idempotency: idempotency key includes `(period_start, kind, tenant_id)`; double-trigger on Mon 1st is safe |
| 27 | Low | Product | Cat on homepage: decorative SVG illustration, `aria-hidden="true"`, no interaction |
| 28 | Low | Product | Account delete grace period: 30 days; data retained in PITR for 7 days post-purge |
| 29 | Low | Design | WayfindingSign placeholder: hidden (`display: none`) until active featured prompt exists; no blank sign rendered |
| 30 | Low | Design | `/book/[id]` uses Next.js intercepting routes (`(..)book/[id]`); direct URL renders full page; back closes modal |
| 31 | Low | Eng | `PRODUCT_COPY` hardcoded constants documented as intentional: shared voice across tenants, version-controlled, not admin-editable |
| 32 | Low | Product | Email-to-kudos (v1.0.1) explicitly marked out-of-scope for this plan; tracked separately pending post-launch survey |

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-05 | v1.1 | VP review applied — 32 issues resolved (3 Critical, 11 High, 12 Medium, 6 Low) |
| 2026-06-05 | v1.0 | Initial plan from PRD v8.0 · ADD v1.4 · Design System v1.2 · Design Tokens v1.0 |

---

## Context

UBC Annual Giving (~10–20 people) needs a private, library-themed peer-recognition app where kudos appear as books on personal bookshelves. The core emotion is **witnessing** — preserving the moment you notice a colleague doing something good. On launch day, the existing Mural board kudos ritual is retired entirely; this is a replacement, not an addition. Adoption risk is real: expect a dip in weeks 2–6 as meeting-triggered kudos die before witnessing-triggered ones form. A post-launch survey (week 4) validates whether the witnessing hypothesis holds.

The architecture is designed for v1.5 multi-tenant readiness — no schema rewrite at that point. Every design decision flows from three-layer tenant isolation: Postgres composite FKs, repository-pattern TenantContext, and a Playwright cross-tenant test suite that fails the build if any layer is breached.

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
│   │   ├── book/[id]/page.tsx      # Modal route
│   │   ├── celebrate/page.tsx
│   │   └── profile/page.tsx
│   ├── admin/
│   │   ├── layout.tsx              # Admin role gate + tab nav
│   │   └── {roster,templates,schedules,library-setup,quotes,feedback}/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── kudos/route.ts          # POST · PATCH · DELETE
│       ├── kudos-read/route.ts     # POST
│       ├── export/route.ts         # GET (CSV stream)
│       ├── feedback/route.ts       # POST
│       └── webhook/cron/[name]/route.ts   # 13 handlers dispatched by [name]
├── lib/
│   ├── db/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   └── repositories/           # kudos · kudos-read · team-member · team ·
│   │       ...                     # featured-prompt · value-tag · context-category ·
│   │                               # badge · leaderboard · outbox · audit · static-content ·
│   │                               # email-template · author-quote · feedback · team-settings
│   ├── auth/
│   │   ├── tenant-context.ts       # TenantContext type; AG_TENANT_ID constant; extractTenantContext()
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
│   │   ├── purge.ts               # audit-purge (send log + expired tokens)
│   │   └── dr-verify.ts           # nightly restore-to-staging verify
│   ├── badges/
│   │   ├── criteria.ts            # evaluateCriteria(criteria, giverState) → bool
│   │   └── seed.ts                # 9 hardcoded badge definitions for AG
│   ├── errors/app-error.ts        # AppError base class + subclasses
│   ├── content/hardcoded.ts       # PRODUCT_COPY constants (hero, onboarding, pickup indicator)
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
│   ├── seed-ag-tenant.ts          # Full AG seed
│   └── seed-test-tenant.ts        # Synthetic tenant for CI isolation tests
├── playwright/
│   ├── tenant-isolation/          # Cross-tenant attempt tests (build-blocking)
│   ├── flows/                     # Core user flow e2e tests
│   └── fixtures/                  # Shared auth helpers
├── docs/runbooks/                 # outbox-stuck-row · dr-verify-failed · restore-from-pitr · cross-tenant-fail
├── vercel.json                    # 13 cron schedules
├── LAUNCH_VALIDATION.md           # Post-launch witnessing survey results (populated post-launch)
└── .eslintrc.json                 # Includes no-raw-prisma-outside-repos rule
```

---

## Architecture Invariants (enforce from day 1)

**1. Transactional outbox — always co-commit**
Kudos write + `email_outbox` row happen in the same `prisma.$transaction()`. No exceptions. `sendEmail` is called ONLY from `lib/outbox/poller.ts`.

**2. Repository pattern with TenantContext**
Every repository function signature: `async function doX(ctx: TenantContext, ...): Promise<T>`  
ESLint rule (`no-restricted-imports`) prevents raw `PrismaClient` usage outside `lib/db/repositories/*` and `lib/db/prisma.ts`.

**3. Cron handlers write to outbox only** — never call `sendEmail` directly. Idempotency keys prevent duplicate sends on Vercel retry.

**4. Composite FKs** — write these as raw SQL in migrations (not Prisma model syntax). Every child table references parent via `(id, tenant_id)` composite key. Cross-tenant linkage is rejected at DB level.

**5. Build fails on cross-tenant breach** — Playwright tenant-isolation suite runs in CI against a synthetic second tenant.

**6. CRON_SECRET must use constant-time comparison** — use `crypto.timingSafeEqual()`. Unknown cron `[name]` values must return 404, not 200.

**7. Outbox dead-letter handling** — add `failed_at TIMESTAMPTZ NULL` column to `email_outbox`. Sentry alert fires when any row reaches `attempts = 3` with `delivered_at IS NULL`. The `outbox-stuck-row` runbook triggers on this alert.

**8. `PRODUCT_COPY` hardcoded constants are intentional** — shared voice across tenants, version-controlled, not admin-editable by design. This is a known trade-off documented here, not a bug.

---

## Database Migration Sequence

| Migration | Tables |
|-----------|--------|
| 001 | `tenant`, `icon_preset` (no tenant_id — created first) |
| 002a | `team` (must exist before team_member sub_team FK) |
| 002b | `team_member` (composite self-FK + sub_team FK referencing 002a `team`) |
| 003 | `magic_link_token`, `device_confirmation`, `team_settings` |
| 004 | `value_tag`, `context_category`, `prompt_starter`, `author_quote`, `static_content`, `email_template` |
| 005 | `featured_prompt`, `kudos` (with all CHECK constraints + composite FKs), `kudos_value`, `kudos_read` |
| 006 | `badge_definition`, `badge_award`, `leaderboard_winner` |
| 007 | `email_outbox` (with partial index on pending rows), `email_send_log` |
| 008 | `admin_audit_log`, `cron_run_log`, `work_anniversary_reminder`, `feedback_submission` |

**Key `kudos` CHECK constraints:**
```sql
CHECK (num_nonnulls(recipient_id, team_recipient_id) = 1)  -- exactly one recipient type
CHECK (recipient_id IS NULL OR giver_id <> recipient_id)   -- can't kudo yourself
CHECK (context_text IS NULL OR length(context_text) <= 200)
```

**Key indexes:** `idx_outbox_pending` (partial, WHERE delivered_at IS NULL AND cancelled_at IS NULL AND attempts < 3), `idx_kudos_badge_eval` (WHERE badge_evaluated_at IS NULL AND deleted_at IS NULL), `idx_kudos_read_reader`, `idx_kudos_giver` (on `giver_id, tenant_id, deleted_at` — prevents full-table scan on soft-delete recompute).

**Neon environment separation:** prod branch → `DATABASE_URL` in Vercel production; staging branch → `DATABASE_URL` in Vercel preview; local dev branch → `.env.local`. The `dr-verify` cron targets the staging branch only — it never touches prod or dev.

**Seed order (after all migrations):** tenant → icon_preset → team → team_settings → value_tag → context_category → prompt_starter → featured_prompt (default rotation) → badge_definition → author_quote (~30) → email_template (12 types) → static_content (terms, privacy, marketing) → team_member (from AG roster CSV).

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

`vercel.json` registers 13 crons. Time-sensitive ones (manager-digest, nudges, anniversaries, etc.) run hourly and self-gate inside the handler using the tenant's `timezone` setting from `team_settings`.

**DST-safe self-gate pattern:**
```typescript
const localHour = parseInt(now.toLocaleString("en-CA", { timeZone: settings.timezone, hour: "numeric", hour12: false }));
const localDay  = now.toLocaleString("en-CA", { timeZone: settings.timezone, weekday: "long" }).toLowerCase();
if (localDay !== "monday" || localHour !== 9) return { skipped: true };
```

All 13 handlers live in individual route files under `/api/webhook/cron/{handler-name}/route.ts` — **not** a single dynamic `[name]` route. This avoids bundling all 13 handlers into one serverless function (cold-start and 250MB limit risk). Each handler: verify `CRON_SECRET` via `crypto.timingSafeEqual()` → insert `cron_run_log` started row → run logic → update log row with outcome. An unknown path returns 404 immediately.

---

## Phase-by-Phase Deliverables

### Phase A — Foundation + Core Flow (Weeks 1–2)
**Gate: AG MVP checkpoint — decide whether to continue.**

- Next.js 15 scaffold; TypeScript strict; ESLint with no-raw-prisma rule
- Tailwind v4 + design tokens wired; Google Fonts via `next/font/google`
- Prisma + Neon; migrations 001–008; AG seed
- `dr-verify` cron (nightly restore-to-staging) — **test manually before any user data**
- NextAuth magic-link; `/login` page; rate limiting (5 req/15min/IP); ToS acceptance gate
- `withTenantContext` middleware; `AG_TENANT_ID` constant; all 15 repository stubs
- `writeOutboxRow` helper; `sendEmail` adapter (Resend); `AppError` hierarchy
- `POST /api/kudos` (individual only) + `PATCH /api/kudos/:id` (15-min window)
- `outbox-poller` cron — drain; render `recipient-notify`; `sendEmail`; log
- `recipient-notify` email template (teaser + magic deep-link + author quote footer)
- `/celebrate` — individual kudos form: book design picker, font picker (5 presets), Giphy picker, 15-min countdown
- `/book/[id]` modal — page-turn animation (≤400ms; instant on reduced-motion); uses Next.js intercepting routes (`(..)book/[id]`); direct URL renders full page; back closes modal. Admin Delete button.
- Magic deep-link: single-use, 14d TTL, device confirmation ("Yes, this is me"). New-device click invalidates token and issues a fresh device confirmation flow.
- **`/celebrate` fast path:** recipient + message is a valid kudos submission. Book design, font picker, Giphy, value tags, and context are all optional enhancements — never blockers.
- NavHeader and Footer must include skip-link and semantic landmarks (`<nav>`, `<main>`, `<footer>`) from Phase A — not deferred to Phase F audit.
- `POST /api/kudos-read` — atomic `first_kudos_read_at` claim; return `is_first_ever_read`
- Recipient first-read teaching moment (individual variant) — renders on `/book/[id]` when `is_first_ever_read = true`. Pay-it-forward nudge renders on all subsequent reads. Teaching moment takes precedence on the first read; nudge is hidden on that visit.
- `NavHeader` (UBC Navy) + `Footer` (UBC Navy + crest)
- `/library` stub with hardcoded hero line from `PRODUCT_COPY.hero`

**Phase A verification:**
- [ ] Magic-link login → `/celebrate` → give kudos → 15-min window active → edit message → email arrives with updated message
- [ ] Recipient clicks magic deep-link → device confirmation → `/book/[id]` → page-turn plays (≤400ms) → teaching moment on first read only; pay-it-forward nudge on second read
- [ ] Kudos with only recipient + message submits successfully (no value tags, no GIF, no font selection)
- [ ] `dr-verify` cron completes without error targeting staging branch (check `cron_run_log`)
- [ ] Tenant-isolation Playwright suite passes (synthetic second tenant cannot read AG data)
- [ ] axe-core scan passes with zero violations on `/login`, `/celebrate`, `/book/[id]`

---

### Phase B — Manager Value (Weeks 3–4)

- Team kudos mode in `POST /api/kudos` (fan out one outbox row per active+on_leave member)
- `/admin/roster` — add/edit/deactivate members; on-leave toggle; production gate: ≥2 active admins enforced
- `manager-digest` cron (Mon 09:00 PT, self-gating); `manager_digest` + `manager_quiet_week` email templates
- `overlooked-recipient` cron + email template (opt-out)
- `GET /api/export` — CSV stream; manager scoped to direct reports; admin unrestricted; filters
- `/library` fully wired: New Arrivals shelf + personal/team shelves + leaderboard cards
- `/shelf/[member]`, `/team/[slug]` pages
- `leaderboard-rollover` cron (Mon 00:00 PT + 1st of month); `leaderboard_winner` rows
- Book-hover micro-animation (≤200ms; reduced-motion no transform)

**Phase B verification:** manager digest (both variants); overlooked-recipient nudge + opt-out; CSV export scoping; team kudos fan-out; admin max_admins gate; leaderboard cards correct. axe-core scan passes on `/library`, `/shelf/[member]`, `/team/[slug]`, `/admin/roster`.

---

### Phase C — Recognition + Engagement Loop (Week 5)

- `badge-evaluator` cron fully implemented; 9 badge criteria evaluated post-edit-window
- `badge_milestone` email template (private to awardee; actor-excluded from manager section)
- Soft-delete cascade: recompute badge counts + leaderboard_winner in same transaction; cancel outbox if undelivered; log to `admin_audit_log`
- `top-giver-announcement` cron (Fri) + email template
- `inactive-nudge` cron (daily; 4+ consecutive weeks dry; respects on_leave + opt-out)
- `prompt-of-the-week` cron (Wed); `prompt-admin-reminder` cron (Fri); default rotation (Sun night auto-insert)
- Giphy picker: `rating=g` filter enforced; fallback to text-only kudos if Giphy API unavailable
- `/celebrate` — active featured prompt shown prominently; `pre_tag_value_id` pre-tagged on load (user can toggle it off — it is a default, not forced)
- `/library` — "This week we're noticing" wooden sign shows active featured prompt
- `work-anniversary-reminder` cron (daily; dual opt-out)
- "Your books are being picked up" live counter on `/library` + `/profile`; click → detail view
- `kudos-was-read-digest` cron (Fri; opt-in only, default OFF)
- Pay-it-forward nudge at bottom of `/book/[id]` (shown on all reads except the first-ever read)
- WayfindingSign hidden (`display: none`) until an active featured prompt exists — no blank sign rendered
- Overlooked-recipient email copy reviewed for tone before Phase C ships; opt-out remains default

**Phase C verification:** badge milestone award + email; soft-delete recompute + outbox cancel (no full-table scan); inactive-nudge not firing before 4 weeks; prompt rotation; anniversary dual opt-out; pickup counter live. axe-core scan passes on all Phase C new screens.

---

### Phase D — Admin Config + User Profile (Week 6)

- `/admin/templates` — edit 12 email template subjects + HTML; audit-logged; T&C/Privacy shown read-only
- `/admin/schedules` — all cadence + timing knobs
- `/admin/library-setup` — values, context categories, prompt pool, weekly prompt calendar
- `/admin/quotes` — deactivate toggle only; audit-logged
- `/admin/feedback` — triage list; status updates
- `/profile` — shelf shortcut; badge list; pickup indicator; 8 independent email setting toggles; data export; account delete request; Send Feedback
- `POST /api/feedback`; account delete request flow (admin notification + grace period)

**Phase D verification:** template edit flows through to next cron send; featured prompt pre-tag works; email settings toggle behavior; user data export; production gate still enforced.

---

### Phase E — Marketing Page + Content (Week 7)

- `/` marketing page: Hero · What it is · How it works · What's inside · AG culture statement · Sign in CTA
- `robots.txt` disallow on staging; production hostname not yet live
- Content plan working session — finalize all copy; seed into DB (email_template, static_content, author_quote, prompt_starter)
- ~30 author quotes seeded from `05_author_quotes_starter.md`; `AUTHOR_REVIEW_LOG.md` initialized
- Library microcopy throughout; cat on homepage = decorative SVG illustration, `aria-hidden="true"`, no interaction
- Librarian walk animation (hourly; reduced-motion pauses) — timebox: 1 day max; cut to Phase F polish if behind schedule
- Marketing page screenshots captured from live staging app

**Phase E verification:** all content plan §10 open items resolved; screenshots from functional app (not mockups). Email-to-kudos (v1.0.1) is explicitly out of scope for this plan — tracked separately pending post-launch survey.

---

### Phase F — Accessibility + Launch (Week 8)

- WCAG 2.1 AA formal audit (automated + manual; 5-day timebox)
- Remediation; re-audit; conformance report
- Production launch gate: `GET /api/admin/health` → ≥2 active admins; deployment workflow checks this
- AG team rollout: 60-min live kickoff session + recording; office hours offered next week
- Mural board retired; last meeting-kudos ritual retired
- DNS cutover; Sentry release tag; post-deploy smoke test

**Phase F verification:** WCAG conformance report signed off; all acceptance tests from `16_acceptance_test_spec.md` green; prod smoke test passing; Mural retired confirmed with team lead.

---

### Post-Launch — Witnessing Validation (Weeks 4–6 post-launch)

- Week 4: witnessing-vs-gratitude single-question survey per `13_measurement_validation_plan.md`
- Week 6: code responses; record in `LAUNCH_VALIDATION.md`
- Decision: if gratitude ≥60%, content revision pass within 2 weeks; if witnessing validates, email-to-kudos (v1.0.1) moves to active development

---

## Testing Strategy

**Playwright tenant-isolation suite** (`/playwright/tenant-isolation/`) — runs in CI against AG + synthetic `test_tenant`. Test cases: read AG kudos as test_tenant session → 403; POST kudos with AG recipient_id as test_tenant → 400/403; GET /api/export as test_tenant → test_tenant data only; etc. **Any cross-tenant success fails the build.**

**Core flow tests** (`/playwright/flows/`): `give-kudos`, `receive-kudos`, `edit-window`, `soft-delete`, `admin-roster`, `leaderboard`, `badge`.

**CI pipeline:**
1. Lint (including no-raw-prisma + token hex rules)
2. TypeScript strict check
3. Unit tests (repositories with mocked Prisma)
4. Spin up ephemeral Postgres; run migrations + AG + test_tenant seed
5. Playwright tenant-isolation suite
6. Playwright flow suite
7. Next.js production build
8. → All green: auto-deploy to staging
9. → Manual gate: promote to production

Use `page.clock.install()` for edit-window timing tests (don't actually wait 15 minutes).

**Per-phase axe-core gate** — axe-core integrated into Playwright from Phase B. Each phase verification checklist includes a zero-violation axe-core requirement. Phase F WCAG 2.1 AA formal audit is a confirmation pass, not a first-pass discovery.

---

## Launch Checklist

**Vercel Pro:** 13 cron entries in `vercel.json`; `CRON_SECRET` (≥32 chars, distinct per env); staging HTTP basic auth.

**Env vars (dev / staging / prod):** `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `GIPHY_API_KEY`, `SENTRY_DSN`, `PLAUSIBLE_DOMAIN`, `APP_TIMEZONE=America/Vancouver`, `AG_TENANT_ID`.

**Neon:** PITR enabled (7-day window); pooled connection string; restore-to-staging runbook tested manually before any user data; ≥2 people with Neon access.

**Resend:** Custom domain SPF/DKIM/DMARC submitted **Day 1** (24–72h DNS propagation); test send confirmed before any user receives email.

**Sentry:** `beforeSend` strips `message_text`, `context_text`, emails, magic-link tokens, session cookies, device tokens. Verified PII-free before launch.

**Production launch gate:** `GET /api/admin/health` → `{ admins_ok: true }` in deployment workflow. Blocks deploy when fewer than 2 active admins.

**Mural rollback contingency:** If app fails adoption in weeks 2–6, the emergency fallback is to restore the brief meeting-kudos verbal ritual (≤5 min at the start of the next standup) while the content revision runs. This is not a permanent option — it exists to prevent a kudos vacuum during the dip window.

**Witnessing survey:** Owner = product lead; tool = TypeForm; minimum response threshold = 80% of active team members before results are coded. 60% gratitude threshold applies only to coded (witnessing/gratitude/unclear) responses, not total responses.

**Leaderboard rollover idempotency:** Idempotency key = `(tenant_id, kind, period_start)`. When the 1st of the month falls on Monday, both rollover triggers fire — the second is a no-op because the `leaderboard_winner` row already exists with that key.

---

## Sequencing Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Resend DNS propagation (UBC IT ticket 3–5 days) | HIGH | Submit Day 1; use non-UBC sender temporarily if needed |
| Production hostname UBC IT DNS record | HIGH | Request at start of Phase E to avoid Phase F delay |
| Mural retirement with no fallback | HIGH | Emergency verbal ritual preserved for weeks 2–6 if needed; see Launch Checklist |
| `16_acceptance_test_spec.md` missing at Phase F | HIGH | Confirm file exists at project start; do not reach Phase F without it |
| Composite FK syntax in Prisma | MEDIUM | Write composite FKs as raw SQL; split migration 002 into 002a (team) + 002b (team_member); test early |
| Edit-window render race (edit at min 14, send at min 15) | MEDIUM | Use `page.clock.install()` in Playwright; document as acceptable in ADD §8 |
| WCAG findings requiring component rework | MEDIUM | axe-core gate per phase from Phase B; formal audit in Phase F is confirmation pass |
| Leaderboard double-trigger on Mon-1st | MEDIUM | Idempotency key on `(tenant_id, kind, period_start)` makes second trigger a no-op |
| Vercel plan tier for minutely crons | LOW | Verify Pro plan in dashboard after any Vercel config change; individual route files prevent bundle size issues |
| Content plan §10 open items not resolved | LOW | Calendar block the working session at start of Phase A |
| Design token drift | LOW | CI diff check fails build if `styles/design-tokens.css` diverges from `11_design_tokens.css` |

---

## Critical Source Files

| File | Purpose |
|------|---------|
| `09_ADD_kudos_library.md` | Primary technical spec — schema, flows, repo pattern, outbox, cron, env vars |
| `04_PRD_library_of_kudos.md` | Product spec — screens, constraints, acceptance gates, phase table |
| `11_design_tokens.css` | Copy verbatim into `styles/design-tokens.css` |
| `11_design_system.md` | Visual reference for all component implementation |
| `16_acceptance_test_spec.md` | Phase F gate — all acceptance tests must pass before launch. **Confirm this file exists before Phase F.** |
| `13_measurement_validation_plan.md` | Post-launch witnessing survey protocol — owner, tool, response threshold, coding method |
| `05_author_quotes_starter.md` | Seed source for ~30 author quotes in `author_quote` table |
