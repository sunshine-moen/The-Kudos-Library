# Architecture Document — The Kudos Library

**Status:** Draft complete (all 15 sections + foundational questions). Rev 1.5 applies implementation-plan reconciliation (see Change Log at end). **Ready for ADR extraction and implementation handoff.** Pending: ADR review with David's session, integration with implementation plan.
**Last updated:** 2026-06-05 (rev 1.5 — see Change Log at end).
**Companion docs:** `04_PRD_library_of_kudos.md` (the PRD this document implements). `07_v2_strategy.md` (the commercial v2 vision; informs v1 architectural choices). `03_design_intent.md` (visual system).
**Reading order:** read this AFTER the PRD. The PRD answers *what* and *why*; this document answers *how the system works internally* — structure, interfaces, runtime behavior.

---

## Foundational questions

### Binding Constraint: tenant isolation for v1.5-readiness

The single hardest constraint this architecture must solve is **tenant isolation in a system that's single-tenant in production today but committed to multi-tenant production at v1.5**. Get this wrong and the v1.5 pilot phase either becomes a schema rewrite (months of work that v2 commercial timelines can't absorb) or ships with cross-tenant data leakage (an unrecoverable trust failure for an HR-adjacent product in a public-sector institution).

The whole architecture flows from this. Every section asks the same question: *does this preserve tenant isolation as an invariant the v1.5 migration can rely on?* Where the answer would be "no" or "we'd need to retrofit," the architecture spec calls for the right shape now — even though v1's production behavior doesn't yet exercise the constraint.

### Changes from the PRD

The PRD is in strong shape. Architectural review surfaces three deliberate departures, each documented here so future readers (and the agent) know which doc wins where they conflict.

| PRD says | Architecture says | Why |
|---|---|---|
| `email_send_log` tracks every send attempt; `sendEmail` adapter wraps Resend. | Adds an `email_outbox` table. Every email-trigger event writes a row to `email_outbox` *in the same transaction as the originating action* (kudos submission, badge award, anniversary trigger, etc.). A separate poller drains the outbox and calls `sendEmail`. `email_send_log` becomes the delivery-attempt audit; `email_outbox` becomes the durable queue. | Transactional outbox pattern eliminates the failure mode where the originating action commits to DB but the email never sends (or where the email sends but the originating action rolls back). Critical for the witnessing-trigger preservation goal: a recipient_notify that fires for a kudos that doesn't exist would be incoherent; a kudos that exists but never fires a notify would silently break the loop. |
| Cron jobs (digests, anniversaries, prompt-of-week, leaderboard recompute) fire on Vercel Cron schedules. | All cron-triggered email sends use idempotency keys shaped `(template_type, tenant_id, logical_window)` — e.g., `manager_digest:ag:2026-W22`. Outbox entries reject inserts that match an already-completed idempotency key. | Vercel Cron occasionally retries on the platform's own error recovery. Without idempotency keys, a retry causes a duplicate weekly digest to land in every manager's inbox — exactly the warmth-not-spam failure the PRD spent §14 protecting against. |
| v1.5 work item: "enable tenant_id query filtering throughout the app." | In v1, build the data access layer as repository functions that ALREADY take a `TenantContext` parameter as the first argument and inject `tenant_id` into every query. v1 always passes the AG tenant; v1.5 sources it from the auth context. | The PRD framing implies a retrofit at v1.5 ("enable filtering"). Architecturally, the cheaper move is to write the function shape correctly from day one and just hardcode the AG context. v1.5 then becomes a 1-line change per repository function (replace `AG_TENANT_ID` with `ctx.tenantId`) plus the auth-context wiring — not a query-by-query rewrite. Aligns the code shape with the binding constraint from the first commit. |

---

## 1. System Overview

The Kudos Library is a single-tenant Next.js 15 web application backed by a Postgres database (Neon), with synchronous request handling for user actions and asynchronous workers (Vercel Cron + a transactional-outbox poller) for scheduled emails, leaderboard recomputes, and badge evaluations. Authentication is magic-link email via NextAuth (Auth.js); email sends are routed through a thin `sendEmail` adapter (Resend in cloud) consumed from the outbox; all data access goes through a repository layer that takes a `TenantContext` parameter and injects `tenant_id` into every query (single-AG in v1; multi-tenant in v1.5).

The full system runs in a single Vercel project plus a Neon-managed Postgres. No Redis. No message broker. No object storage (GIFs reference Giphy URLs only; no user uploads). No microservices. The deliberate shape is "one app, one database, scheduled workers via the platform's cron primitive" — chosen because v1's scale (10–20 users, ~20 kudos/week) doesn't require anything heavier, and because deferring the complexity of additional infrastructure keeps the architecture defensible for the binding constraint (tenant isolation is easier to verify when the system is small).

---

## 2. Topology

```
┌──────────────┐    ┌─────────────────────────┐    ┌──────────────────┐
│  Browser     │───▶│   Next.js 15 App         │───▶│ Postgres (Neon)  │
│  (desktop)   │    │   (Vercel)               │    │ - all tables     │
│              │    │                          │    │ - PITR 7d        │
└──────────────┘    │  • App Router routes     │    │ - nightly verify │
                    │  • Server components     │    │   restore        │
                    │  • API routes            │    └──────────────────┘
                    │  • Cron handlers         │
                    │                          │    ┌──────────────────┐
                    │                          │───▶│ Resend           │
                    │                          │    │ (transactional   │
                    │                          │    │  email API)      │
                    │                          │    └──────────────────┘
                    └────┬─────────────────────┘
                         │
                         │ (in-browser only)         ┌──────────────────┐
                         │──────────────────────────▶│ Giphy SDK        │
                         │                           │ (no server cache)│
                         │                           └──────────────────┘
                         │
                         │                           ┌──────────────────┐
                         │──────────────────────────▶│ Plausible        │
                         │  (page views + events)    │ (analytics)      │
                         │                           └──────────────────┘
                         │
                         │                           ┌──────────────────┐
                         └──────────────────────────▶│ Sentry           │
                            (errors only;             │ (errors;         │
                             PII stripped)            │  no PII)         │
                                                     └──────────────────┘
        ▲
        │ schedule
        │
┌────────────────────┐
│  Vercel Cron       │
│  (platform-managed)│
│                    │
│  Triggers (14):    │
│  - outbox poller   │
│    (1-min interval)│
│  - badge evaluator │
│    (1-min interval)│
│  - manager digest  │
│    (hourly; gated) │
│  - prompt-of-week  │
│    (hourly; gated) │
│  - admin reminder  │
│    (hourly; gated) │
│  - inactive nudge  │
│    (daily; gated)  │
│  - overlooked      │
│    (hourly; gated) │
│  - anniversaries   │
│    (hourly; gated) │
│  - top-giver       │
│    (hourly; gated) │
│  - kudos-was-read  │
│    digest (hourly; │
│    gated to Fri PM)│
│  - leaderboard     │
│    rollover (hourly│
│    gated to Mon 0) │
│  - account-deletion│
│    processor       │
│    (daily)         │
│  - audit purge     │
│    (nightly)       │
│  - DR verify       │
│    (nightly)       │
└────────────────────┘
```

**Processes:**
- **Next.js app** — stateless serverless functions per route (Vercel handles horizontal scaling automatically; functions cold-start per invocation at v1 scale, which is fine for our latency budget).
- **Vercel Cron jobs** — each is a scheduled HTTP POST from Vercel's cron service back to a dedicated `/api/webhook/cron/[name]` route in the same Next.js app. No separate worker deployment. The "outbox poller" cron runs every minute; all other cron jobs run on their respective schedules and write to the outbox rather than calling Resend directly.

**Data stores:**
- **Postgres (Neon)** is the only data store. Holds all team-scoped tables, the `tenant` registry, the `email_outbox`, the `email_send_log`, the `admin_audit_log`, and session storage (NextAuth session table).

**External services:**
- **Resend** — transactional email (consumed from outbox only)
- **Giphy** — GIF picker, browser-only (no server-side caching)
- **Plausible** — privacy-friendly analytics (no PII; no cookies)
- **Sentry** — error monitoring (PII stripped before send)
- **NextAuth (Auth.js)** — magic-link email provider (uses our Resend for delivery; tokens stored in Postgres)

**No Redis, no S3, no SQS, no separate worker deploy.** All async work goes through the outbox + Vercel Cron polling. This is sufficient at v1's scale (peak ~50 outbox writes/day, ~10 outbox reads/minute by the poller); v1.5 may need to revisit if outbox depth grows past ~1,000 pending rows.

---

## 3. Module / Code Structure

```
/app                              # Next.js App Router (HTTP layer only)
  /(public)                       # Routes accessible without auth
    page.tsx                      # /              (marketing page)
    /login
    /privacy                      # Privacy Policy (modal/page)
    /terms                        # T&C (modal/page)
  /(authed)                       # Routes requiring valid session
    layout.tsx                    # Guards: redirect to /login if no session
    /library                      # /library       (homepage for signed-in users)
    /shelf/[member]               # /shelf/[member]
    /team/[slug]                  # /team/[slug]
    /book/[id]                    # /book/[id] modal route
    /celebrate                    # /celebrate     (submit-a-kudos)
    /profile                      # /profile
  /admin                          # Tabbed admin surface (subroute of /authed; role=admin)
    /roster
    /templates
    /schedules
    /library-setup                # values + context categories + prompts + featured-prompt scheduling
    /quotes                       # tiny deactivate-only view
    /feedback
  /api
    /auth/[...nextauth]           # NextAuth handler routes
    /kudos                        # POST: create; PATCH: edit-during-window; DELETE: admin soft-delete
    /kudos-read                   # POST: record a kudos read event
    /export                       # GET: CSV with filters
    /feedback                     # POST: submit feedback
    /webhook/cron/[name]          # Vercel Cron handlers (one route per job; verifies cron secret)

/lib
  /db
    prisma.ts                     # Prisma client singleton
    /repositories                 # All data access lives here
      kudos.ts                    # findKudosForShelf, createKudos, editKudos, softDeleteKudos
      team-member.ts              # findById, findActive, upsertOnAdminAdd
      featured-prompt.ts          # currentActivePrompt(tenant), scheduleForWeek
      kudos-read.ts               # recordRead, weekReadsForGiver
      leaderboard.ts              # recompute, fetchTopN
      badge.ts                    # evaluate(tenant, giver) -> [{badge, awarded_at?}]
      outbox.ts                   # enqueue, drain, markComplete, markFailed
      audit.ts                    # logAction
      ... (one file per primary table or related cluster)
  /auth
    tenant-context.ts             # extractTenantContext(req) -> { tenantId, userId, role }
    middleware.ts                 # requireSession, requireAdmin
    magic-link.ts                 # token issue + verify (deep-link variant)
  /email
    send.ts                       # sendEmail(to, subject, html, idempotencyKey) — Resend wrapper
    templates/                    # JSX-rendered HTML email templates (one per email_template.type)
      recipient-notify.tsx
      manager-digest.tsx
      manager-quiet-week.tsx
      prompt-of-the-week.tsx
      ...                         # 12 templates total (see §4 Schema definitions → email_template)
    quote-footer.ts               # selectQuote(recipientEmail) — dedup logic
  /outbox
    writer.ts                     # writeOutboxRow(tx, { type, tenantId, payload, idempotencyKey })
    poller.ts                     # called by /api/webhook/cron/outbox-poller every minute
  /cron
    digests.ts                    # manager_digest, manager_quiet_week
    nudges.ts                     # prompt_of_week, inactive_nudge, overlooked_recipient
    anniversaries.ts              # work_anniversary_reminder
    leaderboards.ts               # boundary rollover, top_giver_announcement
    badge-evaluator.ts            # post-edit-window badge eval per kudos
    purge.ts                      # nightly cleanup of email_send_log, expired magic_link_token rows
    dr-verify.ts                  # nightly: trigger Neon restore-to-staging + verify
  /badges
    criteria.ts                   # evaluateCriteria(criteria, giverState) -> bool
    seed.ts                       # 9 hardcoded badge definitions for AG tenant
  /tenant
    context.ts                    # TenantContext type; AG_TENANT_ID constant for v1
  /errors
    app-error.ts                  # AppError base class + HTTP error response helpers
    rate-limit.ts                 # RateLimitError
    not-found.ts                  # NotFoundError
  /content
    hardcoded.ts                  # Product copy that does NOT live in static_content (hero line, recipient onboarding teaching moment, "your books are being picked up" phrasing)
  /analytics
    plausible.ts                  # track(event, props)

/prisma
  schema.prisma                   # Single source of truth for schema
  /migrations
    YYYYMMDD_*/migration.sql      # Forward-only migrations

/scripts
  /seed
    seed-ag-tenant.ts             # Seed AG tenant + sub-teams + values + context categories + prompts + email templates + author quotes + featured-prompt default rotation + badge definitions + icon presets + AG team_member roster (from CSV)

/public                           # Static assets: icons, illustrations, sample images

/playwright                       # End-to-end tests (especially tenant-isolation tests for v1.5)
```

**Module rules (enforced by lint + code review):**

1. **`/app` routes are thin HTTP handlers.** Validate input, call a `/lib/repositories` function (or sometimes a `/lib/cron` function from a cron route), format the response. **No business logic in routes.** No raw Prisma calls.
2. **All data access goes through `/lib/db/repositories`.** Functions take `TenantContext` as the first parameter — even in v1 where it's always AG. No exceptions. Raw `prisma.*` calls from outside `/lib/db/repositories` are forbidden (lint rule).
3. **`/lib/email/send.ts` is the only place that knows about Resend.** Anywhere else that needs to send email writes to the outbox instead. The cron-driven outbox poller is the sole caller of `sendEmail`.
4. **`/lib/cron/*` handlers ALWAYS write to outbox transactionally.** A cron handler must never call `sendEmail` directly. This makes cron retries safe (the outbox idempotency key prevents duplicate sends).
5. **`/lib/badges/seed.ts` is hardcoded badge definitions.** Admin cannot edit badge content in v1. v1.x roadmap may add an admin badge editor; until then, badge content lives in code.
6. **`/lib/content/hardcoded.ts` is the home of locked product copy.** Hero line, recipient-onboarding teaching moment, "your books are being picked up" indicator phrasing. NOT subject to per-tenant editing. NOT in `static_content` table.
7. **No `/lib/*` module imports from `/app`.** Data flows one direction: `/app` → `/lib`. Enables ripping out or replacing the web layer without touching business logic.

**v1.5 readiness in this structure:**
- Tenant context lives in one place (`/lib/auth/tenant-context.ts`). v1.5 multi-tenant work changes this file (and the AG_TENANT_ID hardcoding) but not the call sites.
- Email templates are JSX components rendered server-side. Per-tenant template overrides at v1.5 become a render-time branch, not a template-system rewrite.
- Cron handlers iterate over tenants in v1.5 (currently just AG). Single loop addition per cron file.

---

## 4. Data Architecture

The data layer is small (one Postgres database, no caching tier, no derived stores) but the *authority* classification matters because it drives backup, retention, and regeneration strategy.

| Data | Store | Authority | Notes |
|---|---|---|---|
| `tenant`, `team_member`, `team`, `kudos`, `kudos_value`, `value_tag`, `context_category`, `prompt_starter`, `featured_prompt`, `badge_definition`, `badge_award`, `leaderboard_winner`, `email_template`, `author_quote`, `static_content`, `team_settings`, `work_anniversary_reminder`, `feedback_submission`, `icon_preset`, `admin_audit_log` | Postgres (Neon) | **Authoritative** | PITR 7-day window; nightly automated restore-to-staging verified by `/lib/cron/dr-verify.ts` runbook; failed verifications page on-call. |
| `kudos_read` | Postgres | **Authoritative** | Drives "your books are being picked up" indicator + optional weekly digest. First-read row also drives the recipient onboarding teaching moment. Indexed on `(reader_id, tenant_id)` to keep the first-ever-read count query fast; v1.5+ may add a denormalized `team_member.first_kudos_read_at` column if the count query becomes a hot path. |
| `cron_run_log` | Postgres | **Authoritative** (with retention) | One row per cron invocation (cron_name, tenant_id, started_at, completed_at, rows_processed, outcome). Drives the cron-last-run alert. Rows older than 30 days auto-purged nightly. |
| `email_outbox` | Postgres | **Authoritative** (until delivered) | New row per email-trigger event, written transactionally with originating action. Drained by 1-minute cron poller. Successful sends update the row's `delivered_at` and persist for audit; failed sends update `failure_reason` + `attempts` and retry per backoff schedule. Rows older than 90 days with `delivered_at IS NOT NULL` auto-purged nightly. |
| `email_send_log` | Postgres | **Authoritative** (with retention) | Per-attempt log. Includes `quote_id` used in this send (for the best-effort dedup of the next send to the same recipient). Auto-purged after `team_settings.email_log_retention_days` (default 90). Privacy Policy notes the limit. |
| `magic_link_token` | Postgres | **Authoritative** (with retention) | Login tokens TTL 10min; deep-link tokens TTL 14d. Expired rows purged nightly. |
| `device_confirmation` | Postgres | **Authoritative** (with retention) | 90-day inactivity expiry; purge nightly. |
| Session storage | Postgres (NextAuth's session table) | Authoritative | Session cookie holds session ID; session row holds the validation data. Sessions expire ~30d. |
| Plausible event stream | Plausible (external) | External authoritative | We don't store analytics events ourselves. Plausible holds them. No PII in payloads. |
| Sentry event stream | Sentry (external) | External authoritative | Same. PII stripped before send. |
| Giphy search results | Browser memory only | Cached (ephemeral) | Per-search results live for the browser session. No server-side caching. |

**Data classification:**

- **Tenant-private** (cross-tenant access forbidden): every row in every table that carries `tenant_id`. This is the vast majority of the schema.
- **Cross-tenant or singleton** (no tenant_id): `icon_preset` (shared icon library), `tenant` itself. Both are deliberately small and unchanging.
- **PII**: name + work email + department + job title + UBC hire date + AG join date on `team_member`. No date of birth. No home address. No SIN. No salary. Per the PRD's "business card information" framing.
- **Sensitive content (HR-adjacent)**: kudos `message_text` and (optional) `context_text`. The PRD's "all kudos public to the team" rule scopes visibility to within-tenant; v1.5 multi-tenant must NEVER cross tenant boundaries.

**Cross-tenant rule (HARD invariant):**

Every query against tenant-scoped tables MUST include `tenant_id = <ctx.tenantId>` (in v1, always the AG tenant). Enforced through three layers:

1. **Schema layer.** Composite foreign keys (see §4 Schema definitions below) prevent a row in one table from referencing a row in another table that belongs to a different tenant. Example: `kudos_value(kudos_id, value_tag_id)` has composite FKs to `kudos(id, tenant_id)` and `value_tag(id, tenant_id)`. Postgres rejects cross-tenant linkage at write time.

2. **Repository layer.** All data access goes through `/lib/db/repositories/*` functions that take `TenantContext` as the first parameter and inject `WHERE tenant_id = $1` (or its composite-key equivalent) into every query. No code path bypasses repositories; raw Prisma calls outside `/lib/db/repositories` are lint-banned (see Module Rules in §3).

3. **Test layer.** A dedicated tenant-isolation test suite (Playwright + Postgres seed for a second test tenant) runs in CI. The test suite intentionally tries to read/write cross-tenant data through every API surface; the build fails if any path succeeds. In v1 the second tenant is synthetic (only AG exists in production); in v1.5 the suite gains real importance.

**Exception — cron handlers (system-level workers):** cron handlers are the only place cross-tenant queries are permitted. Three patterns appear:

1. **Queue-drain crons** (outbox poller, badge evaluator): operate without a top-level `TenantContext`; the rows they process carry their originating `tenant_id` in a column on the row. The handler reconstructs a `TenantContext` from that column for each row and uses it for all per-row business logic.
2. **Tenant-iteration crons** (manager digest, prompt of the week, anniversary reminder, all other time-of-day-sensitive crons in Flow 3 and §5's "Other scheduled flows" table): begin with a `SELECT id FROM tenant` to enumerate tenants, then construct a per-tenant `TenantContext` and run all subsequent per-tenant logic under that context. In v1 with a single tenant this can be hardcoded as `AG_TENANT_ID`; v1.5+ uses the real query.
3. **System-wide operational crons** (`dr-verify`, `audit-purge`): no `TenantContext`; operate on infrastructure (Neon restore) or cross-tenant table maintenance (retention-window purges of `email_send_log`, `magic_link_token`, expired `device_confirmation`) and do not exercise per-row business logic. They never read or write tenant-scoped business data — only system-level tables and operational state.

Across all three patterns, the only un-scoped queries are the top-level enumeration / drain / system-table queries themselves, plus `cron_run_log` inserts (which carry their own `tenant_id` for queue-drain and tenant-iteration crons or NULL for system-wide operational crons). Every other query — every business-logic query downstream of the enumeration — runs under a `TenantContext` and must include `tenant_id = ctx.tenantId`.

**Backup, regeneration, and retention:**

- **Backup:** Neon PITR with 7-day recovery window. Nightly automated restore-to-staging verified by `/lib/cron/dr-verify.ts`. RPO ≤ 24h; RTO ≤ 4h. Set up in build step 3 of PRD §15 (before user data accumulates).
- **Regeneration:** nothing is truly derived in v1 (no embeddings, no transcoded media, no LLM-generated content). `leaderboard_winner` is recomputable from `kudos` if ever needed, but is treated as authoritative (snapshot semantics — what the leaderboard SAID at the boundary, not what it would say if recomputed today after edits/deletes).
- **Retention:**
  - `email_send_log`: 90 days (admin-configurable in `team_settings.email_log_retention_days`).
  - `email_outbox`: 90 days post-delivery.
  - `magic_link_token`: purged on expiration.
  - `device_confirmation`: 90-day inactivity expiry.
  - `admin_audit_log`: no expiration in v1 (small volume; retained indefinitely; revisit if it grows past 1M rows).
  - All other tables: no expiration. Soft-deleted kudos retained for audit + recompute logic.

**Privacy Policy notes for users (drives content of `static_content.privacy_policy`):**
- "What emails has the system sent about me?" — answerable only within the email_send_log retention window. Older queries get "send logs are retained for [N] days per system configuration."
- "Delete my account" → triggers admin notification + grace period (see PRD §7) → admin actions hard-delete OR keep-visible-as-former-teammate per deactivation choice.
- "Remove this kudos I gave or received" → admin actions soft-delete with the standard recompute side effects (badge revoke, leaderboard recalc).

---

### Schema definitions (canonical, table-by-table)

Postgres via Prisma. All timestamps `timestamptz`. All team-scoped tables carry `tenant_id` (defaulted to AG tenant in v1; not query-filtered in v1 since there's only one tenant; enables clean v1.5 migration).

**Cross-tenant referential integrity (schema-enforced, not app-enforced).** Every child table that has a foreign key into a tenant-scoped parent uses a **composite foreign key** including `tenant_id` — e.g., `FOREIGN KEY (kudos_id, tenant_id) REFERENCES kudos(id, tenant_id)`. Prevents buggy or malicious write paths from creating cross-tenant linkages. In v1 single-tenant production this is invisible; in v1.5 it is the schema-level guarantee backstopping app-level tenant scoping (the binding constraint).

#### Tables WITHOUT tenant_id (cross-tenant or singleton)

- **`tenant`** — id (uuid PK), name, slug (unique), created_at, updated_at. Seeded with single row at deploy: AG.
- **`icon_preset`** — key (PK), visual_asset, label. Cross-tenant; same icon set available to all tenants.

#### People + teams (tenant-scoped)

##### `team_member`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenant.id; v1 defaulted to AG |
| first_name, last_name | text | |
| email | text | unique WITHIN tenant (composite UNIQUE with tenant_id) |
| department, job_title | text | |
| ubc_hire_date | date | nullable |
| ag_join_date | date | nullable |
| icon | text | FK → icon_preset.key |
| role | enum | user / manager / admin |
| manager_id | uuid | self-FK, nullable |
| sub_team_id | uuid | FK → team.id, nullable |
| digest_cadence | enum | weekly / biweekly (managers/admins only) |
| status | enum | active / on_leave / hidden / former |
| on_leave_from, on_leave_until | timestamptz | nullable |
| tos_accepted_at | timestamptz | nullable until first accept |
| first_kudos_read_at | timestamptz | nullable. Set the first time this team_member reads any kudos. Drives the recipient onboarding teaching moment (rendered ONLY on the read that flips this column from NULL → NOW()). Atomic claim via conditional UPDATE: `UPDATE team_member SET first_kudos_read_at = NOW() WHERE id = $reader AND tenant_id = $tenant AND first_kudos_read_at IS NULL RETURNING id`. Race-free at any isolation level — Postgres serializes UPDATEs to the same row. |
| pending_deletion_at | timestamptz | nullable. Set when user initiates account deletion via `/profile`. Grace period: 30 days. Cancellation: "Restore account" link in the grace-period email sets back to NULL. Processed by `account-deletion-processor` cron (daily): for any row WHERE `pending_deletion_at < NOW() - INTERVAL '30 days'`, execute hard-delete cascade. Indexed: `idx_team_member_pending_deletion (pending_deletion_at) WHERE pending_deletion_at IS NOT NULL` drives the cron's lookup. |
| email_settings | jsonb | per-user opt-out toggles (each independent) |
| created_at, updated_at | timestamptz | auto |

**`email_settings` shape** (despite the field name, this object covers email AND in-app notification preferences; v1.5 could rename to `notification_settings`):
```json
{
  "anniversary_reminders": true,
  "anniversary_about_me": true,
  "overlooked_recipient_nudge": true,
  "inactive_giver_nudge": true,
  "top_giver_thank_you": true,
  "prompt_of_the_week": true,
  "kudos_was_read_digest": false,
  "show_pickup_indicator": true
}
```

`prompt_of_the_week` (default `true`) — receives Wednesday prompt email when they haven't given a kudos that week.
`kudos_was_read_digest` (default `false` — opt-in) — receives optional Friday digest summarizing reads of their given kudos that week.
`show_pickup_indicator` (default `true`) — controls whether the "your books are being picked up" live indicator renders on `/library` and `/profile` for this user.
`anniversary_about_me` (default `true`) — controls whether the system generates anniversary reminder emails *about this team member*. If `false`, no anniversary reminders fire for their UBC or AG anniversaries. Distinct from `anniversary_reminders`, which controls whether THIS user receives reminders about OTHER people's anniversaries.

##### `team`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenant.id |
| name | text | |
| slug | text | unique WITHIN tenant |
| description | text | |
| kind | enum | organization / sub_team |
| visual_asset | text | |
| created_at, updated_at | timestamptz | auto |

Seeded for AG tenant: AG (organization), BB + IF + OPS + SA (sub_team).

##### `device_confirmation`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenant.id |
| email | text | |
| device_token | text | hashed cookie token. If user clears cookies, they re-confirm on next deep-link click. Intended consequence. |
| confirmed_at | timestamptz | |
| last_used_at | timestamptz | drives 90d-inactivity expiry |
| UNIQUE | (tenant_id, email, device_token) | composite |

#### Kudos + admin-editable content (all tenant-scoped)

##### `kudos`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenant.id |
| recipient_id | uuid | nullable FK → team_member.id |
| team_recipient_id | uuid | nullable FK → team.id |
| giver_id | uuid | FK → team_member.id |
| message_text | text | |
| book_design, font_choice | text | preset keys |
| context_category_id | uuid | nullable FK → context_category.id |
| context_text | text | nullable. DB CHECK: length ≤200 chars. |
| giphy_id | text | nullable |
| featured_prompt_id | uuid | nullable FK → featured_prompt.id; set if this kudos was submitted while a featured prompt was active (drives analytics on prompt effectiveness). |
| submitted_at | timestamptz | auto. Functions as `created_at` for this table; name reflects domain meaning. |
| edit_window_expires_at | timestamptz | auto on insert (= `submitted_at + interval '15 minutes'`). Giver can edit message/values/context/GIF until this time; after, edits lock. `recipient_notify` email is queued and fires AT this timestamp (not at `submitted_at`). |
| badge_evaluated_at | timestamptz | nullable. Set by the badge-evaluator cron after it processes this kudos's contribution to giver-side badge thresholds. NULL means "not yet evaluated" — drives the cron's idempotent re-run logic. Evaluator only runs once `edit_window_expires_at <= NOW()` (so badges fire for the FINAL kudos content, not the original). |
| deleted_at | timestamptz | nullable — admin soft-delete (available at any time, including during edit window) |
| updated_at | timestamptz | auto |

**CHECK constraints:**
- Exactly one of (recipient_id, team_recipient_id) non-null.
- If recipient_id non-null: giver_id ≠ recipient_id.
- context_text length ≤ 200.

##### `kudos_read`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenant.id |
| kudos_id | uuid | FK → kudos.id |
| reader_id | uuid | FK → team_member.id |
| read_at | timestamptz | auto |
| UNIQUE | (kudos_id, reader_id) | one row per reader per kudos (first read only; subsequent reads do not create new rows) |

Powers the "Your books are being picked up" in-app indicator (count this-week reads of the user's given kudos) and the optional weekly digest. (First-ever-read detection now uses the `team_member.first_kudos_read_at` denormalized column for race-free atomic claim — see Flow 2.)

##### `value_tag`
id (PK), tenant_id (FK), key, label, group_label (DAE/AG/custom), is_active, display_order, created_at, updated_at. Composite UNIQUE (tenant_id, key). Seeded with 12 values for AG tenant.

##### `kudos_value` (M2M)
(kudos_id, value_tag_id) composite PK. Tenant-scoping inherited through parent rows via composite FKs. **Zero rows for a given kudos is valid** (per the pre-tag-with-skip rule).

##### `context_category`
id (PK), tenant_id, key, label, is_active, display_order, created_at, updated_at. Composite UNIQUE (tenant_id, key). Seeded with 6 for AG tenant.

##### `prompt_starter`
id (PK), tenant_id, label, starter_text, is_active, display_order, created_at, updated_at. Seeded with ~10 for AG tenant. Used for the `/celebrate` picker pool (distinct from `featured_prompt` which is the weekly prominent prompt).

##### `featured_prompt`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenant.id |
| week_start_date | date | **Nullable.** Monday of the target week (in tenant's timezone) for scheduled prompts; NULL for default-rotation prompts (no specific week). |
| prompt_text | text | The prompt itself; witnessing-framed |
| pre_tag_value_id | uuid | nullable FK → value_tag.id; if set, kudos submitted while this prompt is active pre-tag this value on /celebrate |
| scheduled_by | uuid | FK → team_member.id; admin who scheduled, OR null if from default rotation |
| is_default_rotation | boolean | true for system-seeded fallback prompts (used when no admin-scheduled prompt exists for a given week) |
| created_at, updated_at | timestamptz | auto |
| **Partial UNIQUE index** | `(tenant_id, week_start_date) WHERE week_start_date IS NOT NULL` | One scheduled prompt per tenant per week; default-rotation prompts (NULL week_start_date) are unconstrained. |

Composite FKs: `(scheduled_by, tenant_id) → (team_member.id, tenant_id)`; `(pre_tag_value_id, tenant_id) → (value_tag.id, tenant_id)`.

Seeded for AG tenant with ~10 witnessing-framed default prompts (is_default_rotation = true). See `12_content_plan.md` §4 for the seed list.

#### Recognition (tenant-scoped)

##### `badge_definition`
id (PK), tenant_id, key, name, description (story copy), criteria (jsonb), visual_asset. Composite UNIQUE (tenant_id, key). v1: hardcoded seed for AG tenant; admin cannot edit content.

##### `badge_award`
id (PK), tenant_id, badge_id, awarded_to, awarded_at. UNIQUE (tenant_id, badge_id, awarded_to, awarded_at::date).

##### `leaderboard_winner`
id (PK), tenant_id, kind (top_giver_week / top_giver_month), period_start, period_end, winner_id, rank, kudos_count, awarded_at. UNIQUE (tenant_id, kind, period_start, rank).

#### Admin + infrastructure (tenant-scoped)

##### `email_template` (12 types)
id (PK), tenant_id, type enum, subject_line, body_html, created_at, updated_at. Composite UNIQUE (tenant_id, type). The 12 types: recipient_notify, manager_digest, manager_quiet_week, top_giver_announcement, badge_milestone, inactive_nudge, overlooked_recipient_nudge, work_anniversary_reminder, broadcast, prompt_of_the_week, prompt_admin_reminder, kudos_was_read_digest. See `12_content_plan.md` §3 for trigger / recipient / opt-out matrix.

##### `author_quote`
id (PK), tenant_id, author_name, author_country, quote_text (≤300 chars; DB CHECK), source_work (nullable), is_active, last_reviewed_at, created_at, updated_at. v1: product-curated seed of ~30 for AG tenant; admin uses Quotes tab tiny view to deactivate. See `05_author_quotes_starter.md` for seed candidates + verification process.

##### `static_content`
id (PK), tenant_id, key (`terms_of_service` / `privacy_policy` / `marketing_landing`), version (incremental), body_html, effective_at, created_at, updated_at. Composite UNIQUE (tenant_id, key). Three keys seeded at deploy for AG tenant with placeholder copy.

##### `team_settings` (one-per-tenant)
id (PK), **tenant_id (UNIQUE — one settings row per tenant)**, max_admins (default 3; must be ≥2 enforced by app gate), inactive_threshold_weeks (default 4), overlooked_recipient_window_days (30), top_giver_send_local_time ("15:00"), anniversary_lead_time enum ("1_week_before" / "3_days_before" / "day_of"; default "1_week_before"), anniversary_email_local_time ("09:00"), timezone ("America/Vancouver"), email_log_retention_days (90), leaderboard_top_n_week (5), leaderboard_top_n_month (5), prompt_of_week_send_local_day_and_time ("wednesday 09:00"), prompt_admin_reminder_local_day_and_time ("friday 09:00"), kudos_was_read_digest_local_day_and_time ("friday 15:00").

##### `email_outbox`
See §6 outbox row shape (canonical definition lives with the outbox pattern).

##### `email_send_log`
id (PK), tenant_id, template_type, recipient_email, quote_id (FK, nullable), sent_at, failed_at, failure_reason, attempts, created_at. Auto-purge nightly per `team_settings.email_log_retention_days`.

##### `admin_audit_log`
id (PK), tenant_id, actor_id, action, target_type, target_id, metadata (jsonb), occurred_at.

##### `cron_run_log`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| cron_name | text | e.g., "manager_digest", "outbox_poller", "dr_verify" |
| tenant_id | uuid | nullable (some crons are cross-tenant, e.g., outbox_poller) |
| started_at | timestamptz | auto |
| completed_at | timestamptz | nullable until job completes |
| rows_processed | integer | nullable; meaning is per-cron-job |
| outcome | enum | `success` / `partial` / `failure` |
| error_message | text | nullable |

Drives the §11 "cron last-run" alerts. Rows older than 30 days auto-purged nightly.

##### `magic_link_token`
id (PK), tenant_id, token_hash, email, kind enum (login / deep_link), target_kudos_id (nullable), expires_at, used_at. **CHECK:** `(kind = 'deep_link' AND target_kudos_id IS NOT NULL) OR (kind = 'login' AND target_kudos_id IS NULL)`.

##### `work_anniversary_reminder`
id (PK), tenant_id, employee_id (FK), anniversary_kind enum (ubc / ag), anniversary_date date (the upcoming anniversary date with current year applied), sent_at. UNIQUE (tenant_id, employee_id, anniversary_kind, anniversary_date).

##### `feedback_submission`
id (PK), tenant_id, submitted_by (FK), kind enum (feature_request / bug_report), subject, body, status enum (open / acknowledged / closed), created_at, resolved_at (nullable), updated_at.

#### Badge Criteria JSON
```json
{
  "trigger": "kudos_given" | "kudos_received" | "scheduled_check",
  "operator": "count_gte" | "count_in_window_gte" | "streak_weeks_gte" | "first_event",
  "value": 50,
  "window": { "type": "rolling_days", "days": 7 } | { "type": "calendar_week" } | null,
  "filter": null
}
```

#### Soft-delete + badge integrity rule
On soft-delete: recompute giver counts → revoke most recent matching award if below threshold → recompute affected leaderboard winners → log in audit. Tenant-scoped throughout.

#### Relationships at a glance
- `kudos`.tenant_id, recipient_id, team_recipient_id, giver_id, context_category_id, featured_prompt_id, value_tag (via kudos_value).
- `kudos_read`.kudos_id, reader_id.
- `featured_prompt`.tenant_id, pre_tag_value_id, scheduled_by.
- `team_member`.tenant_id, manager_id (self), sub_team_id (→team.id), icon (→icon_preset.key).
- `badge_award`, `leaderboard_winner`, `email_send_log`, `admin_audit_log`, `magic_link_token`, etc. all tenant-scoped with composite FKs where applicable.
- `icon_preset` and `tenant` are cross-tenant.

---

## 5. Request & Event Flows

Three flows exercise the load-bearing parts of the architecture. Each step crossing a process boundary (HTTP, DB transaction, cron tick, email send) is called out.

### Flow 1: Give a kudos (individual; the central flow)

```
Browser ──POST /api/kudos──▶ Next.js
                              │
                              ├── 1. withTenantContext middleware: verify session,
                              │      extract tenantId, userId, role
                              │
                              ├── 2. Rate limit check (30/hr/user): if exceeded → 429
                              │
                              ├── 3. Validate input (recipient_id ≠ giver_id; 
                              │      either recipient_id OR team_recipient_id;
                              │      message_text non-empty; etc.)
                              │
                              ├── 4. Begin Postgres transaction:
                              │      ├─ INSERT kudos row (edit_window_expires_at = NOW() + 15min)
                              │      ├─ INSERT kudos_value rows for any pre-tagged values
                              │      ├─ INSERT email_outbox row:
                              │      │    type = "recipient_notify"
                              │      │    kudos_id = <new>
                              │      │    send_after = NOW() + 15min
                              │      │    idempotency_key = "recipient_notify:k:<kudos_id>:r:<recipient_id>"
                              │      │    payload = {}  (rendered at send time)
                              │      │    (for team kudos: one outbox row per active team member; each row's
                              │      │     idempotency_key includes that team member's recipient_id so the
                              │      │     UNIQUE constraint doesn't collapse them into one row)
                              │      └─ COMMIT transaction
                              │
                              ├── 5. Return { kudos_id, edit_window_expires_at } → modal confirmation
                              │
                              ▼
                         (15 minutes pass; user may edit)

                         Outbox poller cron (every 60s):
                              │
                              ├── 1. SELECT * FROM email_outbox 
                              │      WHERE send_after <= NOW() 
                              │        AND delivered_at IS NULL 
                              │        AND cancelled_at IS NULL
                              │        AND attempts < 3 
                              │      ORDER BY send_after LIMIT 25
                              │      FOR UPDATE SKIP LOCKED;
                              │
                              ├── 2. For each row:
                              │      ├─ Render email template from current DB state
                              │      │    (reads the kudos row LIVE — edits during window
                              │      │     flow through automatically)
                              │      ├─ Select author quote (dedup across last 5 sends to this recipient)
                              │      ├─ Re-check `SELECT deleted_at FROM kudos WHERE id = $kudos_id`
                              │      │    immediately before sendEmail — MVCC sees committed state at
                              │      │    read time; closes most of the soft-delete-during-render window
                              │      │    (the residual is the ~50–500ms before Resend accepts the request).
                              │      │    If deleted_at IS NOT NULL: skip send, UPDATE email_outbox SET
                              │      │      cancelled_at = NOW(),
                              │      │      cancellation_reason = "kudos_soft_deleted_during_render"
                              │      ├─ Call sendEmail(to, subject, html, idempotencyKey)
                              │      ├─ Insert email_send_log row
                              │      └─ On success: UPDATE email_outbox SET delivered_at = NOW()
                              │         On failure: UPDATE email_outbox SET failure_reason, attempts += 1
                              │
                              ▼
                         Recipient receives email
                              │
                              └── (continues in Flow 2)

                         Badge evaluator cron (every 60s):
                              │
                              ├── SELECT distinct giver_id, tenant_id FROM kudos
                              │   WHERE edit_window_expires_at <= NOW()
                              │     AND badge_evaluated_at IS NULL
                              │
                              ├── For each giver: evaluate badge criteria (lib/badges)
                              │      ├─ If any new badge fires:
                              │      │    ├─ INSERT badge_award row
                              │      │    └─ INSERT email_outbox row (type=badge_milestone, send_after=NOW())
                              │      └─ UPDATE kudos.badge_evaluated_at = NOW()
                              │
                              ▼
                         (Outbox poller picks up the badge_milestone email on next pass)
```

**SLA:** kudos submission API returns under 500ms (95th percentile); email arrives within 16 minutes of submission (15-minute edit window + up to 60s outbox polling lag).

**Key invariants:**
- Kudos write + outbox write are in the same DB transaction. Neither one without the other.
- Email rendering happens at send time, not at submit time → edits during the 15-min window flow through automatically.
- Outbox idempotency key prevents duplicate emails on poller retries (rare but possible if the poller crashes mid-render).
- Badge evaluation runs AFTER the edit window closes (badge fires for the FINAL kudos content, not the original).

### Flow 2: Read a kudos (the recipient experience)

```
Recipient ──clicks "Read it here" magic-deep-link in email──▶ Next.js
                              │
                              ├── 1. /api/auth/[...nextauth] verifies token
                              │      ├─ Token valid + first time on this device → confirmation page
                              │      │    "Yes, this is me" → INSERT device_confirmation row
                              │      └─ Token valid + device confirmed → set session cookie
                              │
                              ├── 2. Redirect → /book/[id]
                              │
                              ├── 3. /book/[id] route handler:
                              │      ├─ withTenantContext: extract tenantId, userId
                              │      ├─ Repository: findKudosById(ctx, kudosId)
                              │      ├─ Check: is reader allowed to view? 
                              │      │    (within tenant + kudos not soft-deleted + 
                              │      │     reader is recipient OR member of team_recipient 
                              │      │     OR any team member [all-public rule])
                              │      ├─ BEGIN transaction:
                              │      │  ├─ INSERT kudos_read ... ON CONFLICT (kudos_id, reader_id)
                              │      │  │    DO NOTHING
                              │      │  │    (records the read; UNIQUE on (kudos_id, reader_id)
                              │      │  │     makes re-reads a no-op.)
                              │      │  └─ Atomically claim the "first-ever read" marker via a
                              │      │       denormalized column on team_member (see §4 Schema:
                              │      │       team_member.first_kudos_read_at):
                              │      │         UPDATE team_member
                              │      │           SET first_kudos_read_at = NOW()
                              │      │           WHERE id = ctx.userId
                              │      │             AND tenant_id = ctx.tenantId
                              │      │             AND first_kudos_read_at IS NULL
                              │      │           RETURNING id;
                              │      │       → IF a row was returned: this read IS the reader's
                              │      │         first-ever → render with the onboarding teaching
                              │      │         moment line
                              │      │       → IF no row was returned: not first-ever
                              │      │         → render normal book detail
                              │      └─ COMMIT
                              │      (Both statements MUST be in the same transaction. If the
                              │       handler crashes between them, the kudos_read row would persist
                              │       but first_kudos_read_at would stay NULL — on the user's actual
                              │       second read, the teaching moment would render incorrectly.
                              │       The conditional UPDATE itself is genuinely atomic at any
                              │       isolation level — Postgres serializes UPDATEs to the same row.
                              │       Two concurrent reads by the same brand-new reader: exactly one
                              │       wins the UPDATE; the other gets zero rows back. The teaching
                              │       moment cannot render twice.)
                              │
                              ├── 4. Page renders with page-turn animation (Framer Motion)
                              │      ├─ Values + (optional) context shown under message
                              │      ├─ Admin sees Delete button
                              │      ├─ Pay-it-forward nudge at bottom (carries active prompt if any)
                              │      └─ Recipient onboarding teaching line at top IF first-ever read
                              │
                              ▼
                         Recipient closes the modal
                              │
                              └── Asynchronously: giver's "your books are being picked up" counter
                                  updates when they next visit /library or /profile (counter is a
                                  live query against kudos_read scoped to giver_id + this week)
```

**Key invariants:**
- `kudos_read` is INSERT-on-first-read only (UNIQUE on kudos_id + reader_id). Re-reads don't create new rows. This keeps the indicator showing distinct readers, not view counts.
- The "first-ever read" marker is a denormalized boolean-shaped column on `team_member` (`first_kudos_read_at TIMESTAMPTZ NULL`, set on the reader's first kudos read; see PRD §11). The Flow 2 handler claims first-ever via a conditional UPDATE: `UPDATE team_member SET first_kudos_read_at = NOW() WHERE id = ctx.userId AND tenant_id = ctx.tenantId AND first_kudos_read_at IS NULL RETURNING id`. Postgres serializes UPDATEs to the same row, so this is genuinely atomic at any isolation level — exactly one of two concurrent first-time reads wins, the other returns zero rows. Race-free without isolation-level assumptions. (Prior approaches — `SELECT COUNT(*)` and `xmax + EXISTS` — were both racy at READ COMMITTED, where concurrent transactions can't see each other's uncommitted inserts. The denormalized-column approach sidesteps the entire problem.) **The INSERT into `kudos_read` and the UPDATE to `team_member` MUST run in the same transaction** — without the wrapper, a crash between the two leaves `kudos_read` populated but `first_kudos_read_at` NULL, causing the teaching moment to render incorrectly on what is actually the user's second read. **Semantic note for rejoiners:** if a team_member is hard-deleted and later re-added (new `team_member.id`, same email), the new row's `first_kudos_read_at` is NULL — their first read after rejoining will render the teaching moment again. This is treated as a new relationship; intentional.
- The "your books are being picked up" indicator is a query against `kudos_read` joined to `kudos` where `giver_id = current_user`, scoped to the current week **in tenant-local time**. Concretely (v1): `SELECT COUNT(*) FROM kudos_read kr JOIN kudos k ON kr.kudos_id = k.id AND kr.tenant_id = k.tenant_id WHERE k.giver_id = $current_user AND k.tenant_id = $ctx.tenantId AND kr.read_at >= date_trunc('week', NOW() AT TIME ZONE 'America/Vancouver')`. Live; not cached. Runs on every `/library` and `/profile` page load. **Timezone matters even in v1:** `date_trunc('week', NOW())` (without the `AT TIME ZONE` clause) returns the start of the ISO week in UTC, which for Vancouver users rolls over at Sunday 16:00 PT — a Friday-evening user would see Saturday-PT reads as "next week." For v1.5+ multi-tenant, parameterize on `team_settings.timezone` instead of hardcoding `America/Vancouver`. **Index strategy:** the `(reader_id, tenant_id)` index on `kudos_read` (already in §11) plus PRD §11's index on `kudos(giver_id, tenant_id)` covers the join. At v1 scale (~50 kudos/day, ~250 reads/day) this is comfortably sub-10ms. v1.5+ at multi-tenant scale: re-check; if the join becomes a hot path, denormalize `kudos.giver_id` onto `kudos_read` so the join goes away.

### Flow 3: Manager weekly digest (the scheduled flow)

Demonstrates the cron + outbox + idempotency pattern.

```
Vercel Cron fires every Monday 09:00 PT:
       POST /api/webhook/cron/manager-digest
                              │
                              ├── 1. Verify cron secret (Vercel injects via env var)
                              │
                              ├── 2. For each tenant (v1: just AG):
                              │      └─ For each manager in tenant:
                              │            ├─ Determine the manager's digest window per their cadence
                              │            │  (weekly = last 7d; biweekly = last 14d)
                              │            ├─ Query kudos received by direct reports in window
                              │            ├─ Query badges direct reports earned in window
                              │            ├─ idempotency_key = "manager_digest:<tenant>:<manager>:<week_iso>"
                              │            │
                              │            ├─ Begin transaction:
                              │            │  ├─ INSERT INTO email_outbox (...) 
                              │            │  │    ON CONFLICT (idempotency_key) DO NOTHING
                              │            │  │      (duplicate cron fire is silently no-op'd)
                              │            │  └─ COMMIT
                              │            │
                              │            ├─ If kudos count = 0 in window:
                              │            │  outbox row's payload sets template = "manager_quiet_week"
                              │            └─ Else: template = "manager_digest"
                              │
                              ▼
                         (Outbox poller picks up on next 60s tick, renders, sends)
```

**Key invariants:**
- Cron handlers ONLY write to outbox. They never call sendEmail directly. This makes cron retries safe.
- Idempotency key is shaped per logical window: `manager_digest:<tenant>:<manager>:<week_iso>`. Vercel Cron occasionally retries the same scheduled job; the `ON CONFLICT DO NOTHING` prevents duplicate emails.
- Empty-window check decides which template the outbox row uses; the row is rendered with the LIVE kudos data at send time (not snapshot).

### Other scheduled flows (same pattern, summarized)

| Cron | Cadence | Outbox idempotency key shape | Recipients |
|---|---|---|---|
| `prompt-of-the-week` | Wednesday 09:00 PT | `prompt_of_week:<tenant>:<user>:<week_iso>` | Inactive-this-week givers (per their opt-in) |
| `prompt-admin-reminder` | Friday 09:00 PT | `prompt_admin_reminder:<tenant>:<week_iso+1>` | All admins (if no featured_prompt for next week) |
| `inactive-nudge` | Daily check; fires per-user when 4+ wks dry | `inactive_nudge:<tenant>:<user>:<month>` | The inactive giver (per opt-in) |
| `overlooked-recipient` | Weekly Monday | `overlooked_recipient:<tenant>:<manager>:<week_iso>` | Manager (per opt-in) |
| `anniversary-reminder` | Daily 09:00 PT | `anniversary:<tenant>:<employee>:<ubc\|ag>:<anniversary_year>` | Direct manager + manager's manager (per opt-in). **Cron handler checks two opt-outs per candidate:** (1) `email_settings.anniversary_reminders` for the recipient (manager opts out of receiving), (2) `email_settings.anniversary_about_me` for the subject employee (employee opts out of having reminders sent about them). Subject opt-out short-circuits before recipient evaluation — if the subject opts out, no reminder fires for any potential recipient. |
| `top-giver-announcement` | Weekly Friday at admin time | `top_giver:<tenant>:<week_iso>` | Rank-1 weekly winner |
| `kudos-was-read-digest` | Weekly Friday | `kudos_read_digest:<tenant>:<user>:<week_iso>` | Givers who opted in |
| `leaderboard-rollover` | Mon 00:00 PT + 1st of month 00:00 PT | (no email; computes leaderboard_winner rows) | n/a |
| `outbox-poller` | Every 60s | (no idempotency key — drains the queue) | n/a |
| `dr-verify` | Nightly 03:00 PT | (no email unless verification fails) | On-call alert if fails |
| `audit-purge` | Nightly 03:30 PT | (no email; purges email_send_log + magic_link_token) | n/a |

All cron handlers verify a shared `CRON_SECRET` env var before processing — prevents external callers from triggering scheduled jobs.

---

## 6. Interface Contracts

The contracts that matter most for The Kudos Library: the kudos submission/edit API surface, the outbox row shape, the email-template render contract, the cron webhook contract.

### Internal API contracts

#### `POST /api/kudos` — Submit a kudos

**Request body:**
```json
{
  "mode": "individual" | "team",
  "recipient_id": "uuid" | null,        // present if mode=individual
  "team_recipient_id": "uuid" | null,   // present if mode=team
  "message_text": "string (1..2000 chars)",
  "book_design": "string (preset key)",
  "font_choice": "string (preset key)",
  "value_tag_ids": ["uuid", ...],       // 0 or more — skippable per PRD §6 (pre-tag-with-skip rule)
  "context_category_id": "uuid" | null,
  "context_text": "string (≤200) | null",
  "giphy_id": "string | null",
  "featured_prompt_id": "uuid | null"   // present if user wrote against the week's prompt
}
```

**Response 201:**
```json
{
  "kudos_id": "uuid",
  "edit_window_expires_at": "ISO 8601 timestamp",
  "earned_badges": []                    // always empty on submit; badges fire post-window
}
```

**Errors:** 400 (validation fail; includes specifics), 401 (no session), 403 (giver doesn't belong to team_recipient — admin exemption applies), 429 (rate limit; includes Retry-After header).

#### `PATCH /api/kudos/:id` — Edit during the window

**Request body:** subset of POST body fields except `recipient_id` / `team_recipient_id` / `mode` (those are immutable). All optional; only present fields are updated.

**Response 200:** updated kudos shape.

**Errors:** 400 (validation), 401 (no session), 403 (not the giver; or edit window expired; or kudos was admin-deleted), 404.

#### `DELETE /api/kudos/:id` — Admin soft-delete

**Request:** no body.
**Response 204.**
**Errors:** 401, 403 (not an admin), 404.
**Side effects:** sets `kudos.deleted_at`; cascades into badge_award recompute for the giver; cascades into leaderboard_winner recompute for any affected periods; INSERTs admin_audit_log row.

#### `POST /api/kudos-read` — Record a kudos read event

**Request body:** `{ kudos_id }`.
**Response 200:** `{ is_first_ever_read: boolean }` (drives whether the client renders the recipient onboarding teaching moment).
**Errors:** 401, 403 (reader not in tenant), 404.
**Side effects:** UPSERT into kudos_read (no-op on conflict).

#### `GET /api/export` — Manager CSV export

**Query params:**
```
date_from: ISO date (required)
date_to: ISO date (required)
recipient_id: uuid (optional)
giver_id: uuid (optional)
value_tag_id: uuid (optional)
context_category_id: uuid (optional)
```

**Response 200:** `text/csv` stream with header row + filtered kudos.

**CSV columns:** `id, submitted_at, giver_first_name, giver_last_name, recipient_first_name, recipient_last_name, team_recipient_slug, message_text, values (comma-separated labels), context_category, context_text, book_design`.

**Errors:** 401, 403 (not manager or admin), 400 (invalid date range).

#### `POST /api/feedback` — Submit feedback (feature request / bug report)

**Request body:** `{ kind: "feature_request" | "bug_report", subject, body }`.
**Response 201.**
**Side effects:** INSERT feedback_submission; outbox row for email-to-all-admins.

#### `POST /api/webhook/cron/:name` — Cron handlers

**Headers:** `Authorization: Bearer <CRON_SECRET>` (matches Vercel Cron's actual invocation pattern — Vercel injects this header automatically when the cron is configured with the secret in `vercel.json`).
**Response 200:** `{ processed: number, errors: number }`.
**Errors:** 401 (bad cron secret).

### `email_outbox` row shape

```sql
CREATE TABLE email_outbox (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenant(id),
  template_type   email_template_type NOT NULL,
  -- Pointers to the data to render at send time (not a snapshot):
  kudos_id        UUID NULL REFERENCES kudos(id) ON DELETE CASCADE,
  recipient_user_id UUID NULL REFERENCES team_member(id),
  recipient_email_override TEXT NULL,  -- for cases like badge_milestone where the email isn't a kudos recipient
  badge_award_id  UUID NULL REFERENCES badge_award(id),
  payload         JSONB NULL,           -- template-specific extras (e.g., digest window)
  -- Scheduling:
  send_after      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotency:
  idempotency_key TEXT NOT NULL,        -- unique; see Flow 3 for key shapes
  -- Delivery tracking:
  delivered_at    TIMESTAMPTZ NULL,
  failed_at       TIMESTAMPTZ NULL,
  failure_reason  TEXT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  cancelled_at    TIMESTAMPTZ NULL,   -- set when the originating event is voided (e.g., kudos soft-deleted during edit window before send)
  cancellation_reason TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (idempotency_key)
);

CREATE INDEX idx_outbox_pending ON email_outbox(send_after) 
  WHERE delivered_at IS NULL AND cancelled_at IS NULL AND attempts < 3;
```

**Polling query:**
```sql
SELECT * FROM email_outbox
WHERE delivered_at IS NULL 
  AND cancelled_at IS NULL
  AND attempts < 3
  AND send_after <= NOW()
ORDER BY send_after
LIMIT 25                        -- reduced from 50 (see polling execution-time budget below)
FOR UPDATE SKIP LOCKED;
```

**Note on `FOR UPDATE SKIP LOCKED`:** at v1 scale this is dead code — single Vercel Cron invocation per minute means a single poller instance per polling cycle. The clause is forward-looking only, kept so that if we ever scale to multiple parallel pollers (v2 scale), no code change is needed.

**Note on cancellation vs failure:** `cancelled_at` is set when an event upstream of the email becomes invalid — most commonly when a kudos is soft-deleted during its 15-min edit window before the outbox row's `send_after` fires. The polling query skips cancelled rows the same way it skips delivered or failed rows, but the `failure_reason` column stays NULL for cancellations — ops can distinguish "we cancelled this on purpose" from "Resend rejected this." The §10 stuck-row alert filters out cancellations.

**Polling execution-time budget.** With Vercel Pro, function execution limit is 60 seconds. Each outbox render involves several DB reads (kudos + team_member + value_tags + quote dedup) plus template rendering; cold-start invocations can run 1–3s per row. Batch size capped at 25 (was 50) to keep the per-pass total well under the 60s budget even with cold starts. At v1 scale (~50/day) one pass typically drains the queue in <5s; the 60s ceiling is for occasional bursts (e.g., post-event when many kudos are submitted in a window).

### `sendEmail` adapter contract

```typescript
async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}): Promise<{ delivered: boolean; providerMessageId?: string; error?: string }>;
```

**Implementation (Resend in cloud):**
- Calls Resend's API with the idempotency_key in the request header (Resend supports idempotency keys natively; duplicate calls within their window return the same message_id without re-sending).
- Returns `{ delivered: true, providerMessageId }` on 2xx response.
- Returns `{ delivered: false, error }` on 4xx (won't retry) or 5xx (will retry per outbox poller).

**Resend idempotency key TTL caveat.** Resend's idempotency keys have a 24-hour TTL on their side. Outbox rows can theoretically sit in retry-backoff for longer than 24h (e.g., during an extended Resend outage). After the TTL expires, the same key sent again will produce a fresh send rather than a dedup. For v1 (typical delivery latency under 17 min per the SLO), this is well under 24h and the cap doesn't matter. During an extended Resend outage with retries spanning the boundary, duplicates are possible. Acceptable risk given outage rarity; v1.5+ may consider an app-level dedup layer if Resend outages become a recurring concern.

### Email template render contract

```typescript
interface EmailTemplate<TPayload> {
  type: EmailTemplateType;
  render(ctx: TenantContext, data: { kudos?: Kudos; payload?: TPayload }): Promise<{
    subject: string;
    html: string;
  }>;
}
```

Templates are JSX components rendered server-side via a library like `react-email` or a small in-house renderer. Each template knows what data it needs from the outbox row and queries the DB for it (live) at render time. The footer block (author quote) is composed by a shared helper that handles the dedup logic.

### Cron secret contract

Every `/api/webhook/cron/[name]` route checks `request.headers.get("authorization") === "Bearer " + process.env.CRON_SECRET`. Mismatch → 401. The secret is set once in Vercel project settings; Vercel Cron is configured via `vercel.json` and Vercel injects the `Authorization: Bearer <secret>` header automatically on every scheduled invocation.

### External service contracts (summary; defer to vendor docs for full specs)

- **Resend** — HTTPS API with bearer token; idempotency-key header supported.
- **Giphy** — browser SDK only; no server-to-Giphy traffic.
- **Plausible** — privacy-friendly analytics; events sent via in-page script; no server SDK in v1.
- **Sentry** — error capture via official SDK. `beforeSend` hook strips the following fields from any event payload before transmission to Sentry's infrastructure: `message_text`, `context_text`, plaintext email addresses, magic-link token values, session cookies, `device_token` hashes, Giphy URLs, Resend message IDs. Stripping happens on a recursive object walk by field name; if a future feature adds new PII-bearing fields, they must be added to the strip list (covered in code review checklist).
- **NextAuth Email provider** — uses our `sendEmail` adapter for magic-link delivery. Tokens stored in `magic_link_token` table.

---

## 7. Cross-Cutting Patterns

These patterns touch every feature. Defining them once with a canonical example keeps the codebase consistent and lets the agent inherit invariants automatically.

### Auth wrapper pattern: `withTenantContext`

Every authenticated route uses this wrapper.

```typescript
// /lib/auth/middleware.ts
export function withTenantContext<T>(
  handler: (req: Request, ctx: TenantContext) => Promise<T>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });
    const tenantId = session.user.tenantId;   // v1: always AG; v1.5: sourced from auth
    const userId = session.user.id;
    const role = session.user.role;
    return await handler(req, { tenantId, userId, role });
  };
}

// Usage in a route:
// /app/api/kudos/route.ts
export const POST = withTenantContext(async (req, ctx) => {
  const body = await req.json();
  const kudos = await kudosRepository.create(ctx, body);
  return Response.json({ kudos_id: kudos.id, edit_window_expires_at: kudos.edit_window_expires_at }, { status: 201 });
});
```

**Invariant:** no authenticated route bypasses `withTenantContext`. The wrapper is the only way to get a `TenantContext`, and the `TenantContext` is the only way to call any repository function. This is enforced by the repository signatures requiring `TenantContext` as the first parameter.

### Admin gate: `requireAdmin`

```typescript
export function requireAdmin<T>(handler: (req, ctx) => Promise<T>) {
  return withTenantContext(async (req, ctx) => {
    if (ctx.role !== "admin") return new Response("Forbidden", { status: 403 });
    return await handler(req, ctx);
  });
}

// Usage:
export const DELETE = requireAdmin(async (req, ctx) => { /* admin-only logic */ });
```

### Repository pattern (the binding-constraint enforcement)

```typescript
// /lib/db/repositories/kudos.ts

export async function createKudos(
  ctx: TenantContext,
  input: KudosInput
): Promise<Kudos> {
  return await prisma.$transaction(async (tx) => {
    const kudos = await tx.kudos.create({
      data: {
        tenant_id: ctx.tenantId,         // ALWAYS injected from ctx
        recipient_id: input.recipient_id,
        giver_id: ctx.userId,
        message_text: input.message_text,
        // ... etc
        edit_window_expires_at: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    
    // Insert kudos_value rows
    if (input.value_tag_ids.length > 0) {
      await tx.kudos_value.createMany({
        data: input.value_tag_ids.map(value_tag_id => ({
          kudos_id: kudos.id,
          value_tag_id,
        })),
      });
    }
    
    // Insert outbox row in the same transaction
    await tx.email_outbox.create({
      data: {
        tenant_id: ctx.tenantId,
        template_type: "recipient_notify",
        kudos_id: kudos.id,
        recipient_user_id: input.recipient_id,
        send_after: kudos.edit_window_expires_at,
        // Idempotency key includes :r:<recipient_id> so team-kudos (which fan
        // out to N outbox rows under one kudos_id) don't collapse into one row
        // via the UNIQUE(idempotency_key) constraint. Individual kudos use the
        // same shape — one recipient, one row, key still unique.
        idempotency_key: `recipient_notify:k:${kudos.id}:r:${input.recipient_id}`,
      },
    });

    // Team-kudos branch (not shown): same shape, looped over each team
    // member with status IN ('active', 'on_leave') — per PRD §14, on-leave
    // colleagues still receive team kudos their team gets during their absence.
    // Each iteration sets `recipient_user_id: member.id` and the matching
    // `:r:${member.id}` suffix on the idempotency key. One outbox row per
    // recipient, all under the same kudos.id.
    
    return kudos;
  });
}

export async function findKudosForShelf(
  ctx: TenantContext,
  memberId: string
): Promise<Kudos[]> {
  return await prisma.kudos.findMany({
    where: {
      tenant_id: ctx.tenantId,             // ALWAYS scoped
      recipient_id: memberId,
      deleted_at: null,
    },
    orderBy: { submitted_at: "desc" },
  });
}
```

**Invariants:**
- Every repository function takes `ctx: TenantContext` as the first parameter.
- Every Prisma query in repository functions includes `tenant_id: ctx.tenantId` in the `where` clause.
- No raw `prisma.*` calls anywhere outside `/lib/db/repositories/*`. Enforced by ESLint rule.

### Error pattern: `AppError` + HTTP error responses

```typescript
// /lib/errors/app-error.ts
export class AppError extends Error {
  constructor(public code: string, message: string, public httpStatus: number, public meta?: any) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super("validation", message, 400, fieldErrors);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super("rate_limit", "rate limit exceeded", 429, { retryAfter });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("not_found", `${resource} not found`, 404);
  }
}

// Wrapper in /lib/auth/middleware.ts catches AppError and renders the response:
function appErrorResponse(err: AppError): Response {
  return Response.json({ 
    error: err.code, 
    message: err.message, 
    ...err.meta 
  }, { status: err.httpStatus });
}
```

All thrown errors that should be user-visible are `AppError` subclasses. Everything else bubbles up to the catch-all and becomes a generic 500 (logged to Sentry).

### Secrets

All secrets loaded ONCE at process boot from environment variables. Never read from `process.env` mid-request. Env vars listed in PRD §10. Vercel project settings hold the values; never committed to source control.

### Logging

One structured log line per request, written by the wrapper:

```typescript
log.info({
  request_id: req.headers["x-vercel-id"],
  tenant_id: ctx.tenantId,
  user_id: ctx.userId,
  route: req.url,
  method: req.method,
  latency_ms: Date.now() - startTime,
  status: response.status,
});
```

**Never log:** kudos `message_text`, plaintext email addresses, magic_link_token values, session tokens, the contents of `context_text`, GIF URLs. PII is for the database, not the logs.

**On "hash email addresses" in log payloads.** For v1's user pool of 10–20 known emails, hashing emails before logging is **pseudonymization, not anonymization** — anyone with the roster could rainbow-table the hashes back to identities trivially. The hashing reduces accidental disclosure (a log snippet shared in a Slack DM isn't immediately readable as "Rebekah's email") but doesn't defend against a determined reader. Acceptable at v1 scale; v1.5+ may need stronger handling if logs leave the operational team.

### Content rendering

Hardcoded product copy (hero line, recipient onboarding teaching moment, "your books are being picked up" phrasing) lives in `/lib/content/hardcoded.ts` as exported string constants. NOT in `static_content` table. Code is the source of truth for these.

**Reconciliation with the PRD's marketing page editability:** the marketing page has multiple sections (Hero, What it is, How it works, What's inside, Built for UBC departments, Sign in CTA — per PRD §5's canonical list). The **Hero section's quote line is the hardcoded product copy** (from `PRODUCT_COPY.hero` below); the **surrounding sections are admin-editable** via `static_content.marketing_landing`. The admin Templates tab renders both: the Hero quote shown as read-only / "product copy" with a note explaining why; the other sections shown as editable.

```typescript
// /lib/content/hardcoded.ts
export const PRODUCT_COPY = {
  hero: "A library a team builds together — one kudos at a time, growing into a history.",
  recipientOnboarding: {
    individual: (giverFirstName: string) =>
      `This is what ${giverFirstName} saw. The library keeps things like this.`,
    team: (giverFirstName: string) =>
      `This is what ${giverFirstName} saw your team do. The library keeps things like this.`,
  },
  pickupIndicator: (count: number) =>
    `Your books are being picked up — ${count} ${count === 1 ? "time" : "times"} this week.`,
} as const;
```

### Plausible event tracking

```typescript
// /lib/analytics/plausible.ts
export function track(event: string, props?: Record<string, string | number>) {
  // Called from client components; props never include PII.
}

// Events:
// - "page_view" (auto)
// - "kudos_submitted" { kind: "individual" | "team" }
// - "kudos_read" { is_first_ever: boolean }
// - "manager_digest_link_clicked" (Plausible tracks outbound link clicks in emails, not opens — naming reflects what the data actually means)
// - "overlooked_recipient_nudge_link_clicked"
// - "prompt_of_week_link_clicked"
// - "badge_earned" { badge_key }
```

---

## 8. State & Consistency Model

The Kudos Library's consistency picture is small (single Postgres) but has a few important things to nail.

### Transactional (single DB transaction)

- **Kudos write + outbox row write** — together. Either both commit or both roll back. Prevents orphan kudos (no email) or phantom email (no kudos).
- **Kudos edit during window + (if values changed) kudos_value updates** — together.
- **Kudos soft-delete + admin_audit_log row + badge_award revoke (if applicable) + leaderboard_winner recompute (if applicable)** — together.
- **Team kudos submission + outbox rows for every active team member** — together. Either all team members get the email or none do (within the 15-min delay).
- **Featured prompt scheduling + admin_audit_log row** — together.

### Eventually consistent

- **Kudos submission → recipient_notify email** — up to 16 minutes (15-min edit window + 60s outbox polling lag). UI shows "Thanks for celebrating Jamie!" immediately; recipient doesn't know yet. This is intentional.
- **Badge eligibility crossing → badge_milestone email** — within ~60s of edit window expiration. The badge_award row is created in the badge evaluator cron pass; the outbox row immediately after.
- **Kudos read → giver's "your books are being picked up" counter** — instant on next page load by giver. Not pushed; pulled on visit.
- **Soft-delete → recipient_notify suppression** — if a kudos is soft-deleted BEFORE the 15-min `send_after` fires, the outbox row's `cancelled_at` is set to NOW() in the same transaction as the soft-delete. The polling query excludes cancelled rows; no email fires. `failure_reason` stays NULL — ops can distinguish "we cancelled this on purpose" from "Resend rejected this."
- **Soft-delete mid-render race** — the window from "outbox row pickup → render → sendEmail returns" includes the Resend API call (typically 500ms–3s; longer during Resend incidents), NOT sub-second. The render function checks `deleted_at IS NULL` once before generating the email body — closes most of the window, but not all of it. **Closing the rest:** immediately before calling `sendEmail`, run a fresh `SELECT deleted_at FROM kudos WHERE id = $kudos_id` (Postgres MVCC means each SELECT sees committed state at the moment of read — exactly what we want; we deliberately do NOT hold a transaction across the Resend HTTP call, which would tie up a DB connection for seconds). If still null, send; if not null, abort the send and mark the outbox row `cancelled_at = NOW()` with `cancellation_reason = "kudos_soft_deleted_during_render"`. Final residual: the ~50–500ms between the second deleted_at check and Resend actually accepting the request. We accept this residual; the alternative (locking the kudos row for the full send duration) would block edits. Ops note: a soft-deleted kudos's recipient_notify firing occasionally is documented as a known acceptable edge case.

### Idempotent operations

- **Cron-triggered emails** — every outbox insertion uses `ON CONFLICT (idempotency_key) DO NOTHING`. Vercel Cron retries on platform errors are safe.
- **NextAuth magic-link verification** — single-use tokens (consumed on click).
- **kudos_read insert** — UPSERT-on-conflict via the UNIQUE (kudos_id, reader_id). Re-reads don't create new rows.
- **`sendEmail`** — passes idempotency key to Resend; Resend dedups within its window.

### Known races (documented; not bugs)

- **Giver edits the kudos at minute 14 while the outbox poller is rendering the email at minute 15.** Race window: ~1 second. Outcome: the email may render with the pre-edit version OR the post-edit version, depending on timing. This is acceptable because both versions are "the giver's intent" — the edit was inside their window. The recipient sees a coherent message either way.
- **Two cron jobs fire near-simultaneously and both try to write to the same idempotency key.** Outcome: `ON CONFLICT DO NOTHING` makes one succeed and one no-op. No duplicate emails.
- **Recipient reads the kudos at minute 16 (the outbox just sent the email, the recipient clicks before the page-turn animation completes).** Outcome: the kudos_read row gets written; the giver's indicator updates on next visit. No issue.

### Not-races (by design)

- **Two givers submit kudos to the same recipient at the same time.** No conflict. Each insert is independent. The recipient gets two emails.
- **Admin soft-deletes a kudos while the giver is editing it.** Edit endpoint checks `deleted_at IS NULL` before applying the update. If admin won the race, edit returns 403; giver sees an error.
- **Outbox poller is mid-render when the kudos's underlying value tags change.** Email reads from the DB at render time. Whatever the current state is when the render query fires is what goes in the email. No snapshot; no inconsistency.

---

## 9. Security Architecture

The PRD's hard rules say WHAT must be true (no self-kudos, all kudos public to team, etc.). This section says HOW it's enforced and WHAT we're defending against.

### Trust boundaries

| Boundary | Direction | Trust level | Enforcement |
|---|---|---|---|
| Public internet ↔ Next.js app | inbound | Untrusted | NextAuth session check on every authenticated route; rate limits per PRD §6 |
| Vercel Cron ↔ Next.js app | inbound | Trusted (shared secret) | `Authorization: Bearer <CRON_SECRET>` header verification on every `/api/webhook/cron/*` route |
| Next.js app ↔ Neon Postgres | outbound | Trusted (connection string with credentials) | Connection via Neon's pooled connection string; TLS in transit |
| Next.js app ↔ Resend | outbound | Trusted (API key) | TLS; API key in env var |
| Next.js app ↔ Sentry | outbound | Trusted (DSN) | TLS; PII stripped via `beforeSend` hook |
| Next.js app ↔ Plausible | outbound | Trusted (domain key) | TLS; no PII in events |
| Browser ↔ Giphy SDK | client-only | Untrusted but limited | Browser-only; no server-side Giphy traffic; only `giphy_id` strings stored |
| Browser ↔ Next.js app | inbound | Untrusted | All authenticated routes require valid session cookie |

### Authentication (authn)

- **Mechanism:** NextAuth (Auth.js) magic-link email provider, delivered via our Resend adapter.
- **Login token TTL:** 10 minutes; single-use.
- **Deep-link token TTL:** 14 days; single-use; carries target_kudos_id for redirect after auth.
- **Session lifetime:** 30 days; rolling expiration on use. Session cookie is HttpOnly, Secure, SameSite=Lax.
- **Device confirmation:** first deep-link click on a new device requires "Yes, this is me" confirmation page. Confirmed devices skip on subsequent uses. Confirmation expires after 90 days of inactivity per (email, device_token).
- **Rate limits:** `/login` magic-link request — 5 attempts per 15min per IP. Resend magic-link — 1 per 5min per email.

### Authorization (authz)

Three roles per tenant, hierarchical:
- **user** — give kudos, view team library, see own profile, send feedback.
- **manager** — all of user, plus: see digest of direct reports' kudos, browse direct reports' shelves, export CSV scoped to direct reports.
- **admin** — all of manager, plus: roster management, template editing, schedules, library setup, quotes (deactivate-only), feedback triage, soft-delete any kudos, schedule featured prompts.

Enforced in middleware: `requireAdmin` wrapper on admin-only routes; per-resource checks in business logic for manager-vs-user distinctions (e.g., CSV export query is scoped to "your direct reports" for managers, "all" for admins).

### Tenant isolation (the binding constraint)

Three layers of enforcement, each independently sufficient:

1. **Schema (Postgres composite FKs)** — every team-scoped table has `tenant_id`. Child tables FK back to parents via composite keys (`(child_col, tenant_id) REFERENCES parent(id, tenant_id)`). Postgres rejects cross-tenant linkages at write time. Even a bug in app code can't create cross-tenant data.

2. **Application (repository pattern)** — every data access call takes `TenantContext` as the first parameter and injects `tenant_id` into every query. Enforced by:
   - ESLint rule: no `prisma.*` calls outside `/lib/db/repositories/*`.
   - TypeScript: repository function signatures require `TenantContext` as the first parameter.
   - Code review: any PR touching a repository function gets a tenant-scoping check.

3. **Tests (tenant-isolation suite)** — Playwright suite in `/playwright/tenant-isolation/` intentionally attempts cross-tenant reads/writes via every API surface. Seed creates two tenants (AG + a synthetic "test_tenant"); test cases try to read AG data via test_tenant credentials, write test_tenant data referencing AG IDs, etc. Build fails if any attempt succeeds. In v1, this test runs against a synthetic second tenant (production has only AG); in v1.5, this becomes the load-bearing test.

### Secret management

- Loaded at process boot from environment variables (Vercel project settings).
- Never read from env mid-request. Never logged.
- Rotated as part of standard operational hygiene (no formal schedule in v1; v1.5 may need a quarterly rotation discipline).
- `CRON_SECRET`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `DATABASE_URL`, `SENTRY_DSN`, `GIPHY_API_KEY`, `PLAUSIBLE_DOMAIN` per §12 Environment variables.

### Content Security Policy (CSP)

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://plausible.io; 
  img-src 'self' data: https://media.giphy.com https://i.giphy.com; 
  style-src 'self' 'unsafe-inline'; 
  font-src 'self'; 
  connect-src 'self' https://plausible.io https://*.ingest.sentry.io;
  frame-ancestors 'none';
```

`style-src 'unsafe-inline'` is a known concession driven by Next.js + Tailwind's runtime style injection pattern. It's bounded — no untrusted style sources can inject styles because `default-src 'self'` and no external `style-src` URLs are allowed. The risk is style-based XSS via app-controlled style injection (low at v1 given no user-generated CSS). Worth revisiting in v2 if hardening becomes a priority.

### CSRF protection

All state-changing requests (POST, PATCH, DELETE) require a CSRF token. NextAuth's `getCsrfToken()` handles this for auth routes; the app middleware verifies it for other routes.

### Threat model

| Threat | Mitigation |
|---|---|
| **Cross-tenant data leakage** | Three-layer enforcement (schema composite FKs + repository pattern + tenant-isolation test suite). |
| **Magic-link forwarding** (a user forwards an email; recipient gets session) | Single-use tokens + 14-day TTL + first-device confirmation. Honest framing in PRD: this is forwarding-friction, not account protection. A determined forwardee with the click-through can still get in. |
| **Session hijacking** (cookie theft) | HttpOnly + Secure + SameSite=Lax cookies. 30-day max age. No token in URL. |
| **Email enumeration via `/login`** (attacker tests which emails are valid) | `/login` always returns "If that email is in our system, we sent you a link" regardless of whether the email exists. 5/15min/IP rate limit prevents brute force. |
| **SQL injection** | Prisma generates parameterized queries. No raw SQL outside Prisma-generated code. |
| **XSS in kudos messages** | HTML-escape all `message_text` and `context_text` when rendering in browser. Email templates use safe templating (no string concatenation of user content). |
| **Self-kudos via API tampering** | DB CHECK `giver_id ≠ recipient_id` enforces. UI excludes; API rejects with 400; DB rejects with constraint error. |
| **Cron-trigger abuse** (external attacker hits `/api/webhook/cron/*`) | `Authorization: Bearer <CRON_SECRET>` header verification. Mismatched secret → 401. |
| **Email spoofing** (an attacker sends emails appearing to come from us) | Resend handles DKIM + SPF + DMARC. EMAIL_FROM domain has DNS records configured per Resend's setup. |
| **Rate-limit bypass** (attacker rotates IPs to evade per-IP limits) | Per-user rate limits on authenticated actions (kudos submit: 30/hr/user). Per-IP limits on unauthenticated actions (login: 5/15min/IP). Acknowledged: a determined attacker with many accounts could still cause volume; v1 accepts this risk given the closed user pool. |
| **Soft-delete bypass** (non-admin tries to delete a kudos) | `requireAdmin` wrapper on the DELETE route. UI doesn't render the button for non-admins. |
| **Vercel Cron failure** (cron stops firing; emails stop sending) | Sentry alert on `dr-verify` cron failures (proxy for cron-system health). Manual ops fallback: admin can trigger any cron endpoint manually with the cron secret. |
| **Outbox poller stuck** (a single bad outbox row keeps failing and blocks others) | `attempts < 3` clause in the polling query means failed rows are skipped after 3 attempts. Sentry alert when any outbox row hits `attempts = 3` so ops can investigate. |
| **Unauthorized data export** (a manager exports kudos for users not in their reports) | CSV export query is scoped to the manager's direct reports in the where clause. Admins get unrestricted scope. Test coverage in tenant-isolation suite. |
| **DOS via expensive queries** (manager exports a date range with 100k kudos) | Year-1 record count is ~1500 per AG; pagination + LIMIT clauses on exports defer this risk to v1.5+. v1 doesn't enforce hard pagination on exports — acceptable at scale. |

### What we're NOT defending against in v1 (explicit non-goals)

- **A malicious insider with admin credentials.** An admin can soft-delete any kudos, edit templates, see audit logs. We trust the admin role. (Mitigations: audit log of all admin actions; ≥2 admins required at launch; v1.5+ may add a separate "super-admin" role.)
- **State-level adversaries.** v1 is for AG; FIPPA-light. We're not designing for nation-state threats.
- **Compromised Vercel / Neon / Resend infrastructure.** We rely on these vendors' security posture; documented in §6 vendor breach rule.

---

## 10. Failure Modes

For each external dependency and shared internal resource: what happens when it fails, how the system handles it, what the user sees, and when ops gets paged.

### External dependencies

| Dependency | Failure mode | Handling | User-visible | Alert threshold |
|---|---|---|---|---|
| **Neon Postgres** | Connection error / timeout | Fail fast → return 503 to the request | Generic "service unavailable; try again in a minute" page | Page on-call immediately (any DB error is a high-severity event) |
| **Neon Postgres** | Slow query (>2s) | Log slow query; let it complete | Page may feel slow (no specific signal) | Warn if p95 latency >2s over 5 min |
| **Resend** | 5xx response | Update outbox row: attempts += 1, failure_reason set; retry on next poller pass (60s) | None (delayed delivery; eventually arrives) | Warn if outbox row hits attempts = 3 (stuck; ops investigates) |
| **Resend** | 4xx response (e.g., bad recipient address) | Update outbox row: attempts = 3 (max), failure_reason set; will NOT retry | None at v1; admin dashboard shows failures (v1.x) | Warn on any 4xx (likely bad email in roster) |
| **Resend** | Rate-limited | Outbox poller respects retry-after; queues up additional polling cycles | None (delayed delivery) | Warn if outbox depth >50 pending for >10 min |
| **Resend** | Total outage | Outbox accumulates; sends resume when service returns | Delays in recipient_notify emails (could be minutes to hours) | Page on-call if outage detected via Sentry (Resend SDK throws on connection failure) |
| **Vercel platform** | Function cold start (no failure; just latency) | First request after idle is slower (~500–1000ms vs <100ms warm) | First-request-of-the-day may feel slow | Not alerted (expected behavior at v1 scale) |
| **Vercel Cron** | Scheduled invocation doesn't fire (Vercel platform issue) | Idempotency keys prevent duplicates on Vercel's retry; if Vercel skips entirely, the cron job's effect doesn't happen for that period | Manager doesn't get this week's digest (if manager_digest skipped); no other user-visible impact | Page on-call if `dr-verify` cron hasn't fired in >25h (proxy for cron-system health) |
| **NextAuth (token verification)** | Token signature invalid | Reject with 401; redirect to /login | "Sign-in link is invalid or expired" | Warn if rate >2% over 5 min (could indicate spoofing attempt) |
| **NextAuth (email delivery)** | Magic-link email fails (Resend down) | NextAuth retries via Resend; if persistent → 500 response | "Couldn't send sign-in email; try again in a few minutes" | Page on-call (sign-in broken) |
| **Sentry** | Sentry SDK can't deliver an event | SDK queues locally; retries; eventually drops if persistent | None (errors still log to Vercel function logs as fallback) | None (degraded observability, not user-impacting) |
| **Plausible** | Analytics script blocked / Plausible down | Events not recorded; page still renders | None (analytics is non-blocking) | None |
| **Giphy** | API down / browser blocks Giphy CDN | GIF picker shows "GIF search temporarily unavailable" message; user can still submit kudos without a GIF | "GIF search is temporarily unavailable" inline in the picker | None |
| **Identity provider (NextAuth itself)** | NextAuth library bug or misconfiguration | Sign-in fails; all auth-required routes return 401 | Cannot sign in | Page on-call immediately (auth broken = product broken) |

### Internal failure modes

| Mode | Cause | Handling | Alert |
|---|---|---|---|
| **Outbox row stuck** (attempts = 3 AND failure_reason IS NOT NULL AND cancelled_at IS NULL) | Resend 4xx (bad recipient), DB constraint violation during render, render template throws | Excluded from polling query; persists in DB for ops investigation | Warn on any single stuck row (filter explicitly excludes cancelled rows so legitimate cancellations don't trigger false alerts) |
| **Outbox depth growing** | Resend slow / down, poller can't keep up with insert rate | Polling query returns rows in send_after order; backlog drains when conditions improve | Warn if depth >50 for >10 min; page if depth >500 for >30 min |
| **Badge evaluator falling behind** | Many kudos crossing edit-window simultaneously, eval logic slow | Cron re-runs every 60s, picks up where it left off (idempotent via `badge_evaluated_at` timestamp) | Warn if any kudos has `edit_window_expires_at` <NOW() - 10min AND `badge_evaluated_at IS NULL` |
| **Leaderboard recompute fails mid-rollover** | DB transaction rolled back at boundary | Next cron tick retries; `leaderboard_winner` UNIQUE constraint prevents duplicates | Warn if any tenant's `leaderboard_winner` for current period is missing >1h after boundary |
| **Magic-link tokens not purged** | `audit-purge` cron skipped or failing | Tokens accumulate (expired ones still excluded from auth logic; just storage growth) | Warn if `magic_link_token` row count >100k (way above v1 expected) |
| **DR restore-to-staging fails** | Neon snapshot corrupt, staging DB unreachable, runbook bug | `dr-verify` cron job reports failure | Page on-call (backup integrity is critical) |
| **Repository function called without TenantContext** | Programmer error; new code skips the wrapper | TypeScript compile error (function signature requires `TenantContext` as first arg); won't reach runtime | Build fails |
| **Raw `prisma.*` call outside `/lib/db/repositories/*`** | Programmer error | ESLint error; build fails | Build fails |
| **Cross-tenant data leak in v1.5** | Bug in repository scoping despite all three layers | Tenant-isolation test suite in CI catches before deploy | Build fails (in v1, test runs against synthetic tenant; in v1.5, runs against real tenants) |

### Degraded modes

- **Resend down + outbox accumulating** → kudos submission still works; recipient_notify queues; the library is still browsable. The cost is delayed notifications, not lost ones. Outbox drains when Resend returns. User-facing impact: recipient finds out about their kudos via the in-app indicator next time they visit, instead of via email.
- **Postgres degraded but reachable (slow queries)** → site is slow; doesn't error. Sentry will capture slow-query traces.
- **Postgres unreachable** → entire app returns 503. Maintenance banner served at the edge (Vercel rewrite to a static error page if Vercel can detect DB unreachable; otherwise the function fails with a clean 503).
- **Vercel platform incident** → no graceful degradation possible; the whole app is down until Vercel resolves. Status page references vercel-status.com.

---

## 11. Observability

### Logs (structured JSON, written by every request)

One log line per request via the `withTenantContext` wrapper:

```json
{
  "level": "info",
  "timestamp": "2026-06-02T18:42:13.211Z",
  "request_id": "iad1::a1b2c3-...",
  "tenant_id": "ag",
  "user_id": "rebekah_uuid",
  "user_role": "admin",
  "route": "POST /api/kudos",
  "status": 201,
  "latency_ms": 142,
  "outbox_writes": 1
}
```

Plus per-domain log lines:
- **Cron jobs:** `{ cron_name, tenant_id, rows_processed, latency_ms, outcome }`.
- **Outbox poller:** `{ rows_polled, rows_sent, rows_failed, rows_retried, latency_ms }`.
- **Email sends:** `{ template_type, recipient_email_hash, idempotency_key, provider_message_id?, error? }` (recipient email hashed; never logged in plaintext).

**Never logged anywhere:**
- Kudos `message_text` / `context_text`
- Plaintext email addresses
- Magic link token values
- Session cookie values

Log volume at v1 scale: ~1k–5k log lines per day. Vercel's default log retention (1 day on Hobby, longer on Pro) is sufficient; if longer retention is needed, ship logs to a sink later (v1.x consideration).

### Metrics (Vercel built-ins + Sentry performance + custom)

| Metric | Source | Dashboard purpose |
|---|---|---|
| HTTP request count | Vercel | Traffic baseline |
| HTTP request latency p50 / p95 / p99 | Vercel + Sentry performance | Latency SLO tracking |
| HTTP status code distribution | Vercel | Error rate |
| Function cold-start rate | Vercel | Cost / latency understanding |
| Outbox depth (pending rows) | Custom DB query → exported via `/api/admin/metrics` (admin-only) | Backlog visibility |
| Outbox processing latency (insert → send) | Computed from `email_outbox.created_at` to `email_send_log.sent_at` | Delivery SLO tracking |
| Cron job last-run timestamp per job | DB table `cron_run_log` (one row per invocation) | Cron health |
| Email send success rate | Computed from `email_send_log.failed_at IS NULL` over last 24h | Resend health |
| Kudos submission rate | Plausible event count | Product engagement |
| Active-giver rate (rolling 2w) | DB query | Product behavioral metric |
| Unprompted-giver rate (rolling 2w) | DB query | Hook Model habit-formation metric |

Sentry handles error rate / performance traces automatically.

### Alerts

| Alert | Threshold | Action |
|---|---|---|
| 5xx rate | >2% over 5 min | Page on-call |
| p95 request latency | >2s over 10 min | Warn |
| Outbox depth | >50 pending for >10 min | Warn |
| Outbox depth | >500 pending for >30 min | Page |
| Outbox stuck row | attempts = 3 AND cancelled_at IS NULL on any row | Warn (ops investigates; cancellations don't trigger) |
| Cron `dr-verify` last completion | `MAX(completed_at) < NOW() - 25h` OR (any row with `completed_at IS NULL AND started_at < NOW() - 25h AND started_at > NOW() - 49h`) | Page (backup didn't complete OR run hung). The 49h lookback caps the hung-row clause so a single ancient stuck row doesn't page forever. |
| Cron `outbox-poller` last completion | `MAX(completed_at) < NOW() - 5min` OR (any row with `completed_at IS NULL AND started_at < NOW() - 5min AND started_at > NOW() - 30min`) | Page (delivery system stopped OR poller hung). The 30min lookback caps the hung-row clause — a single slow invocation can't leave a row that pages indefinitely after subsequent invocations succeed. **Trade-off:** any uncompleted row that ages past 30min stops triggering the alert. A weekly review job (or runbook step) checks `cron_run_log` for rows where `completed_at IS NULL AND started_at < NOW() - 24h` to surface long-lived dead-letter rows that escaped the live alert window. |
| Email send 4xx rate | >5% of attempts over 1h | Warn (likely bad email in roster) |
| Email send 5xx rate | >2% of attempts over 5 min | Page (Resend issue) |
| Auth signin failure rate | >5% of attempts over 10 min | Warn (could indicate Resend issue OR spoofing attempt) |
| Sentry unhandled error spike | >10/min sustained | Warn |
| Postgres connection error | Any single occurrence | Page |

### SLOs

| SLO | Target |
|---|---|
| Kudos submission API success rate | 99.5% over rolling 30d |
| Kudos submission API p95 latency | <500ms |
| Recipient notify email delivery time (submission → delivered) | <17 min for 99% (15 min edit window + 2 min outbox cycle) |
| Manager digest delivery time (cron fire → delivered) | <5 min for 99% |
| App uptime | 99.5% over rolling 30d (matches Vercel free-tier SLA) |
| DR RPO | ≤24h |
| DR RTO | ≤4h |

### Debugging runbook (per major alert)

Each alert gets a one-pager runbook stored in repo `/docs/runbooks/`:
- Symptom (what triggered the alert)
- Likely causes (in priority order)
- First diagnostic queries (SQL snippets, log filters, Vercel dashboard URLs)
- Escalation path (when to wake someone, who)

Examples:
- `outbox-stuck-row.md` — "Likely Resend rejected the email (bad recipient address). Diagnostic: query `SELECT * FROM email_outbox WHERE attempts >= 3 ORDER BY updated_at DESC LIMIT 20`. Inspect `failure_reason`. Fix: usually correct the recipient's email in roster + manually requeue."
- `dr-verify-failed.md` — "Last night's automated restore-to-staging didn't succeed. Run the verify manually via `npm run dr:verify-now`. If still failing, check Neon dashboard for snapshot status. Escalate to Rebekah within 1h if cause unclear."
- `cross-tenant-test-fail-in-ci.md` — "Tenant isolation test caught a query that returned cross-tenant data. DO NOT MERGE the PR. Diagnostic: read the failing test's assertion to find which API surface leaked. Trace back to the repository function and add the missing tenant_id scope. Re-run tests until green."

---

## 12. Deployment & Environments

### Environments

| Environment | URL | Purpose | Auth | Data |
|---|---|---|---|---|
| **dev** | localhost | Engineer's local box | Fake session (NextAuth dev mode) | Local Postgres OR Neon dev branch |
| **staging** | `staging-kudos.ag.ubc.ca` (or similar) | Pre-launch testing; placeholder data | HTTP basic auth (shared password rotated post-launch) + standard session auth inside | Neon staging branch (separate database from prod) |
| **prod** | `kudos.ag.ubc.ca` (final URL TBD) | Live AG team | Standard session auth | Neon prod database |

### Pipeline

```
git push origin main
  │
  ├─▶ GitHub Actions:
  │     ├─ Lint (ESLint)
  │     ├─ Type check (TypeScript)
  │     ├─ Unit tests
  │     ├─ Tenant-isolation test suite (Playwright; runs against ephemeral test DB)
  │     └─ Build
  │
  ├─▶ All passing → Vercel auto-deploys to staging
  │     └─ Smoke test runs against staging
  │
  └─▶ Manual GitHub Actions workflow → promote to prod
        ├─ Verify ≥2 admins exist in prod DB (app-gate per §6 hard rules)
        ├─ Confirm migration is backwards-compatible with current prod app version
        ├─ Vercel deploys new function bundle
        ├─ Health check: GET / returns 200 with the right hero copy
        └─ Notify Sentry of new deploy (release tag)
```

### Migrations

- Prisma migrations in `/prisma/migrations/`, forward-only.
- Each migration must be backwards-compatible with the previous app version (so we can roll back the app without rolling back the DB).
  - Example: adding a column → safe (old app ignores new column).
  - Example: removing a column → two-step deploy (old app first updated to not reference the column; then migration drops it). **Note:** Vercel's atomic deploy swap technically makes single-step removal safe within a single deploy. We keep the two-step rule deliberately for two reasons: (1) it preserves rollback safety — reverting the deploy after a single-step removal would leave the running code expecting a dropped column, causing 500s; (2) it generalizes to v1.5+ where additional services (a separate worker, mobile-app backends, integrations) might lag the web deploy by minutes or hours. Worth the modest velocity cost.
  - Example: renaming a column → two-step: add new column + dual-write, then deprecate old column.
- Migrations run automatically on deploy via Vercel's build step (`prisma migrate deploy`).
- Schema changes go through code review with explicit attention to backwards-compatibility.

### Rollback

- **App rollback:** Vercel maintains previous deployments. Rollback via Vercel dashboard or CLI (`vercel rollback`). Takes ~30 seconds. Use case: bug introduced in the latest deploy that's not migration-related.
- **DB rollback:** Forward-only migrations mean no automatic rollback. If a bad migration ships, the fix is a forward migration that corrects it. Worst case: restore from PITR (Neon's 7-day PITR). DR runbook in `/docs/runbooks/restore-from-pitr.md`.
- **Hotfix flow:** for security-critical issues, push directly to a `hotfix` branch; CI runs; one-approval merge; auto-deploys to staging; manual promote to prod after smoke test.

### Vercel tier requirement (REVISED in this rev)

**Vercel Pro is required for v1**, not Hobby. Vercel Hobby Cron has restrictive limits (historically 2 cron jobs, ≥24h minimum interval) that v1's cron architecture (11+ jobs at minute / daily / weekly cadences) exceeds. Pro lifts both limits.

Cost implication: ~$20/mo for Vercel Pro on top of the previously-tallied free-tier services. Updated PRD §2 cost tally: ~$29/mo (was ~$9/mo). Still comfortably under the $50/mo ceiling.

### Cron scheduling and timezone handling

Vercel Cron schedules are specified in UTC. PT crosses daylight-savings twice yearly (PST = UTC-8 winter; PDT = UTC-7 summer). The naive approach (schedule "13:00 UTC for 09:00 PT" then update twice a year manually) is fragile and forgettable.

**Approach used here:** schedule crons **hourly in UTC** and have the handler **self-gate based on `team_settings.timezone` + current local time**. Concretely, each cron handler:

1. Queries the tenant's `team_settings.timezone` (defaults to `America/Vancouver`).
2. Computes the current local time in that timezone.
3. Checks whether the local time matches the cron's intended trigger window (e.g., for the prompt-of-the-week Wednesday email, "is it Wednesday between 09:00 and 09:59 local time AND has this not already fired today?").
4. Idempotency check via the outbox + the cron-specific window key prevents duplicate fires within the window.

This pattern adds modest cron-handler complexity but eliminates two recurring operational bugs: missed sends after DST shifts, and double-sends during DST overlap. It also generalizes cleanly to multi-tenant v1.5 (each tenant's local time is checked against its own `team_settings.timezone`).

**Exemption — frequency-driven crons:** the hourly-self-gate pattern applies only to **time-of-day-sensitive** crons (manager_digest at Mon 09:00 local, prompt_of_the_week at Wed 09:00 local, etc.). **Frequency-driven** crons run at their native cadence with no self-gating: outbox-poller (every 60s), badge-evaluator (every 60s). These don't care about local time — they just want to be drained promptly. They're scheduled at their native cadence in UTC and the handler runs every invocation.

### Infrastructure as code

- **Minimal IaC needed.** Vercel and Neon are both managed; their config lives in their dashboards.
- The few things that could be in code:
  - Vercel Cron schedules → defined in `vercel.json` in the repo.
  - DNS records (custom domain) → handled outside the repo (UBC IT manages DNS for `*.ubc.ca` subdomains).
  - Vercel environment variables → set in Vercel dashboard; documented in `/docs/env-vars.md`.
- v1 does NOT use Terraform / Pulumi / similar. Manual configuration is acceptable given how few resources exist.

### Environment variables

Full list (all set per-environment in Vercel; secrets marked S):

```
DATABASE_URL                  (S)  Postgres connection string (Neon)
NEXTAUTH_URL                       Base URL of the app (e.g. https://kudos.ag.ubc.ca)
NEXTAUTH_SECRET               (S)  Session signing secret
CRON_SECRET                   (S)  Vercel Cron bearer token (Authorization: Bearer <CRON_SECRET>)
RESEND_API_KEY                (S)  Resend API key
EMAIL_FROM                         Sender address used by sendEmail (e.g. library@ag.ubc.ca)
GIPHY_API_KEY                 (S)  Giphy SDK key (browser-side; restricted by referer)
SENTRY_DSN                    (S)  Sentry project DSN
PLAUSIBLE_DOMAIN                   Plausible site identifier
APP_TIMEZONE=America/Vancouver     v1 default; v1.5+ moves to team_settings.timezone
LOG_LEVEL=info                     Structured log threshold (debug / info / warn / error)
AG_TENANT_ID                       Hardcoded AG tenant uuid (v1 single-tenant)
```

### Secrets handling at deploy time

- All secrets set in Vercel environment variables (separated by environment: dev / staging / prod).
- New secret added: developer adds to Vercel; documents in `/docs/env-vars.md`; pushes the code change in the same PR.
- Secret rotation: ad-hoc in v1 (no formal schedule). v1.5+ should establish a quarterly rotation discipline.

---

## 13. Architecture Decision Records (ADRs)

Significant decisions made in this architecture. Each row: ID, decision, rationale, alternatives rejected. Read alongside the PRD's Appendix A (Decision Log) — the PRD captures product decisions; this table captures architectural decisions. Some overlap is expected.

| # | Decision | Rationale | Rejected alternatives |
|---|---|---|---|
| ADR-001 | Single Postgres datastore. No Redis, no S3, no separate cache. | v1 scale (~20 kudos/week) doesn't justify additional infrastructure. Fewer moving parts = easier to verify tenant isolation invariants. Postgres handles queue (outbox), audit log, session storage, and primary data with ease. | Redis for queue + cache; S3 for kudos attachments; sharded Postgres |
| ADR-002 | Transactional outbox pattern for all outbound emails. | Eliminates orphan-notification and phantom-notification bug classes. Kudos write + outbox row write in the same transaction means they're atomically consistent. | Direct `sendEmail` calls inline (risks DB/email divergence); event sourcing (overkill); message broker (overkill at v1 scale) |
| ADR-003 | Repository pattern with `TenantContext` parameter from day one. | Binding constraint is tenant isolation for v1.5-readiness. Writing the function shape correctly in v1 (always passing AG tenant) means v1.5 migration is a 1-line change per repo function, not a query-by-query rewrite. | Defer tenant scoping to v1.5 (would require finding 50+ query sites at migration time); raw Prisma calls everywhere (no scoping enforcement) |
| ADR-004 | Schema composite foreign keys for cross-tenant referential integrity. | Schema-level enforcement that bugs in app code can't override. Composite FK like `FOREIGN KEY (kudos_id, tenant_id) REFERENCES kudos(id, tenant_id)` makes cross-tenant linkage impossible at Postgres level. | Single-column FKs with app-only enforcement (vulnerable to app bugs); Postgres Row-Level Security policies (more complex; deferred to v1.5+ if needed) |
| ADR-005 | Vercel Cron + outbox-poller pattern. No separate worker deploy. | v1 scale (~50 outbox writes/day, ~10 poller reads/min) sufficient via Vercel Cron + Postgres. Avoids the operational complexity of a separate worker service. | Separate Node worker process on a different platform; cloud functions on a schedule (e.g., AWS Lambda + EventBridge); long-polling DB triggers |
| ADR-006 (refs PRD Appendix A "Authentication") | NextAuth magic-link only (no passwords) in v1; credentials provider addable in v1.x with a small schema migration. | No password storage / reset / complexity-rule burden in v1. Industry standard for casual-use B2B tools. Architectural slant: NextAuth's session table holds verification data and is queried per request; adding the credentials provider in v1.x adds a `password_hash` column to the user model + the NextAuth credentials provider wiring (~1 day total — not "no schema change" as previously stated, but a single-column migration, not a rework). | Passwords from day one; SAML SSO (overkill for AG); OAuth with Google/Microsoft (requires identity provider integration v1 doesn't have) |
| ADR-007 | JSX-rendered HTML email templates, render-at-send-time (not snapshot at submit-time). | Edit-during-window flows through to recipient email automatically — no need to update outbox rows when kudos changes. Templates are React components; reusable styling; type-safe. | MJML / Handlebars / Liquid (separate templating language; less integrated); snapshot-at-submit (would require outbox update on every edit) |
| ADR-008 | Hardcoded product copy in `/lib/content/hardcoded.ts`. NOT in `static_content`. | Hero line, recipient-onboarding teaching moment, "your books are being picked up" indicator are product voice — shared across all tenants by design. Hardcoding in code (not DB) means: cannot be accidentally edited away by an admin; lives with version control; reflects product owner authority. | All copy in `static_content` (would allow per-tenant override of product voice; not what we want); inline strings in components (spreads copy across many files; harder to maintain) |
| ADR-009 (refs PRD Appendix A "Plausible analytics, not Google Analytics") | Plausible analytics, not Google Analytics. | Per PRD decision; architecturally — Plausible's privacy-friendly script loads from `plausible.io`; CSP `script-src` allows that domain; no cookies means no consent banner means simpler CSP + simpler page header. | Per PRD: Google Analytics (heavy PII; cookie banners); PostHog (more capable but more surface) |
| ADR-010 | Sentry for error monitoring, with `beforeSend` hook stripping PII. | Standard error monitoring tool. PII stripping prevents accidental disclosure of kudos message text, email addresses, or magic link tokens to Sentry's infrastructure. | Datadog (more capable, more expensive, overkill at v1); LogRocket (session replay — privacy concerns); no error monitoring (debugging impossible) |
| ADR-011 (refs PRD Appendix A "Framer Motion not Three.js") | Framer Motion for book-open animation + book-hover micro-animations. No Three.js / WebGPU. | Per PRD decision; architecturally — Framer Motion is a small bundle add to the Next.js app; integrates with React's component model; no separate canvas / WebGL context to manage. | Per PRD |
| ADR-012 | Single Vercel project. No separate deploys for cron or worker. | Cron handlers are routes in the same Next.js app. Outbox poller is one of those cron handlers. Simpler deployment, simpler ops, single source of truth for code. | Separate worker process / deploy unit (adds operational complexity v1 doesn't need); separate Vercel project for cron (split-brain risk) |
| ADR-013 | Three-layer tenant isolation (schema composite FKs + repository pattern + tenant-isolation test suite in CI). | The binding constraint demands defense in depth. Each layer is independently sufficient; together they provide overlapping protection. CI test suite catches gaps the other two layers miss. | Single-layer enforcement (any one layer alone leaves a gap); Postgres Row-Level Security only (more complex; can be bypassed by superuser queries); test-only enforcement (catches at deploy, not at write — too late for v1.5+ data leak) |

---

## 14. Architectural Non-Goals

What this architecture deliberately refuses to build. Each "no" prevents a class of work and a class of operational complexity. The PRD's §8 is product non-goals (features we won't ship); this section is architectural non-goals (structural shapes we won't adopt).

- **No multi-region deployment.** Single Vercel region (likely `iad1` — US-East). Single Neon region (matching Vercel for latency). Acceptable cost: regional outage = full app outage; mitigated by Vercel/Neon's own SLAs.
- **No read replicas in v1.** Single primary Postgres. Read-heavy queries (CSV exports) run against the primary. Acceptable at v1's scale; revisit if export latency becomes a problem.
- **No microservices.** Single Next.js app. All routes, all crons, all rendering in one deployable unit. Splitting is a v2-scale problem.
- **No event sourcing.** Audit log is append-only Postgres rows, not an event log. State is derived from current row values, not from replaying events.
- **No GraphQL.** REST + JSON. Sufficient at this scale; one fewer abstraction to maintain.
- **No real-time updates (WebSockets / Server-Sent Events).** Pages are server-rendered on navigation; "your books are being picked up" indicator updates on page visit, not pushed live. Real-time would add infrastructure complexity (long-lived connections) that v1's interaction patterns don't need.
- **No SAML SSO in v1.** NextAuth magic-link only. SAML defer to v1.x if a UBC department requires it.
- **No on-prem deployment.** Cloud-only (Vercel + Neon). On-prem deferred per `07_v2_strategy.md` roadmap.

*(Two items previously listed here — "No tenant-defined badge or quote content" and "No mobile app" — are product non-goals already covered in PRD §8 items 1 + 39 + 40 and have been removed from this architectural list to avoid duplication.)*
- **No client-side state library (Redux, Zustand, etc.).** Server components hold state; client components are lean. v1's interaction model doesn't justify a state library.
- **No user file uploads.** GIFs come from Giphy via URL reference; no S3, no user-uploaded images. PRD §6 hard rule.
- **No external queue system.** Outbox-via-Postgres is the queue. No Redis, no SQS, no RabbitMQ in v1.
- **No external cache.** No Redis cache. No memoization layer. Database queries are fast enough at v1 scale; caching would be premature optimization.
- **No CDN beyond Vercel's default.** Static assets served from Vercel's edge. No CloudFlare in front. No custom edge logic.
- **No service mesh / sidecar pattern.** Single app; nothing to mesh.
- **No multi-tenant production in v1.** Single-tenant (AG) production. Schema is multi-tenant-ready; behavior is single-tenant. v1.5 enables multi-tenant production.
- **No client-defined webhooks in v1.** No "send me a webhook when a kudos is submitted" feature. v1.x consideration; would require an external-integration architectural layer not built today.
- **No API access for third-party tools in v1.** No public API. All access via the web UI.
- **No tenant-defined custom domains in v1.** All tenants would share the v1.5 subdomain pattern (`<tenant>.kudos.ubc.ca` or similar). Custom domains per tenant would require additional DNS + cert management; defer to v2.

---

## 15. Future Evolution Hooks

Pre-thought paths for likely growth. Differs from PRD §9 (which is feature roadmap); this section is *structural* extensions — how would the architecture change to support X, and what tiny choices today preserve that path?

### v1.5 multi-tenant production (the big one)

Architectural preparation already in place:
- `tenant_id` columns on every team-scoped table (defaulted to AG in v1).
- Composite foreign keys for cross-tenant referential integrity.
- Repository pattern with `TenantContext` as first parameter on every data-access function.
- `AG_TENANT_ID` constant in `/lib/tenant/context.ts` — v1.5 changes this from a hardcoded constant to a value read from the auth session.
- Tenant-isolation test suite in CI — runs against a synthetic second tenant in v1; runs against real pilot tenants in v1.5.
- `static_content` table keyed by `(tenant_id, key)` — already supports per-tenant T&C, Privacy, Marketing copy.

What v1.5 still needs (work not done in v1):
- Multi-tenant magic-link login design (per-tenant subdomain? Tenant picker after email entry? Auto-route?) — open question flagged in PRD §9.
- AG super-admin interface (lightweight tenant management: list, create, pause, archive).
- Per-tenant admin UI scope (each pilot tenant's admin sees only their tenant's roster, kudos, settings).
- Pilot tenant provisioning runbook.
- Tenant-isolation test suite expanded to cover real cross-tenant scenarios.

Estimated effort: 6–10 weeks engineering + 1–2 weeks isolation testing + 4+ weeks pilot onboarding (per `07_v2_strategy.md`).

### v2 commercial billing + Librarian impact updates

Following successful v1.5 pilot. Architectural hooks:
- Email adapter pattern (ADR-007 / current `sendEmail` interface) accommodates new template types without changes — `librarian_impact_update` would be a new email_template.type, rendered by a new JSX template, scheduled by a new cron job, queued via outbox. No architectural rebuild needed.
- Billing integration would add `tenant_billing` table + `fund_option` table; outbox-style billing-event log for auditability; Stripe webhook handler at `/api/webhook/stripe` (new route, fits existing patterns).
- Customer onboarding flow would be a new sub-app at `/onboard/[tenant_slug]` reusing existing auth + tenant infrastructure.
- AG super-admin dashboard (from v1.5) extends with billing dashboards.

Architectural effort: ~8 weeks engineering when greenlit.

### Read replicas for export-heavy workloads

If CSV export latency becomes a problem (likely at v1.5+ with many tenants):
- Neon supports read replicas.
- Repository functions for read-heavy queries (`findKudosForExport`, `findLeaderboardHistory`) could route to a read replica via Prisma client wrapper.
- Schema unchanged; only the client connection routing changes.
- Estimated effort: 1 week.

### Self-hosted email (SMTP swap)

If a future tenant requires on-prem (or UBC IT requires Canadian-region email):
- `sendEmail` adapter (ADR-007) is the swap point.
- New implementation: `sendEmailSMTP` using nodemailer or similar; reads SMTP config from env vars.
- Outbox poller picks the implementation based on `DEPLOYMENT_MODE` env var (cloud vs on-prem).
- Estimated effort: 2–3 days.

### Slack / Teams integration

If UBC IT later permits a Library of Kudos Teams/Slack app:
- The cron + outbox pattern is symmetric for this: Slack/Teams events trigger the same outbox writes that a web submission does.
- `/api/webhook/slack` and `/api/webhook/teams` would be new routes following the cron-webhook pattern (secret-verified incoming).
- The kudos-submission logic itself is unchanged; the input channel is what's new.
- Estimated effort: 2–4 weeks per platform.

### Webhook delivery to external systems

If tenants want to receive outbound webhooks (e.g., "post a Teams message when a badge is earned"):
- The outbox pattern generalizes naturally — add a new outbox row type for webhook deliveries.
- New table `webhook_subscription` per tenant; new cron poller drains webhook outbox.
- Same idempotency + retry semantics as email.
- Estimated effort: 2 weeks.

### Splitting outbox poller into a separate worker service

If outbox depth grows past ~1,000 pending rows sustained (v1.5+ scale):
- The outbox poller is already a discrete cron handler (`/lib/cron/outbox-poller.ts`).
- Splitting into a separate deploy unit is a CI/CD change (deploy to a separate Vercel project or a different runtime like Fly.io / Railway), not a code change.
- The poller can then run at higher frequency (every 10s instead of every 60s) without consuming Vercel function invocations from the main app.
- Estimated effort: 1 week.

### Adding Redis (or Postgres-as-queue replacement)

If outbox-via-Postgres ever becomes a bottleneck — v1 is ~50 sends/day; this would be a ~100× scale-out, likely several years out and only at v2 commercial scale across many customer tenants — the migration path exists: outbox write-side interface stays unchanged; polling layer swaps from `SELECT FROM email_outbox` to a Redis Streams consumer; `email_outbox` becomes audit-only. Flagged here so the path is known; not actively planned for v1.x.

### Mobile (responsive web first; native later)

- Responsive web: ~2 weeks to add mobile-friendly CSS / breakpoints to all surfaces. No backend changes.
- Native app (iOS / Android): would consume the existing API surface (which would need to be hardened as a public contract, including auth via mobile-friendly OAuth or similar). Estimated 8–12 weeks per platform.

### Custom tenant branding (logo, colors)

- `tenant` table gains `branding_config` JSONB column.
- A theme provider component reads tenant branding at render time and applies CSS variables.
- `static_content.marketing_landing` already supports per-tenant marketing copy.
- Estimated effort: 1–2 weeks.

### Per-tenant subdomain routing

If multi-tenant requires per-tenant subdomains (`ag.kudos.ubc.ca`, `dae.kudos.ubc.ca`):
- Vercel supports custom domain wildcards.
- Auth session tenant_id binds to subdomain at sign-in.
- Tenant resolution in middleware reads subdomain → tenant_id from a lookup.
- Estimated effort: 1–2 weeks.

---

## Document complete

All 15 sections + foundational questions drafted. Status: Draft (rev 1.4) — **ready for ADR extraction and implementation handoff**, pending final review with David's session and integration with the implementation plan.

**Next steps in David's sequence:**
1. PRD review + sign-off (PRD rev 7.5.4 stable).
2. **ADD review + sign-off** (this document — pending your review).
3. Implementation plan (expansion of PRD §15 + ADD §15 into task-level detail).
4. Agentic handoff to Claude Code (or equivalent) with PRD + ADD + Implementation Plan as the working set.

When you've reviewed this batch and we've resolved any pushback, I'll move on.

---

## Change Log

| Rev | Date | Summary |
|---|---|---|
| 1.0 | 2026-06-02 | Initial draft. All 15 sections + foundational questions. Authored in three batches (Batch 1: §1–§4 + foundational; Batch 2: §5–§9; Batch 3: §10–§15). |
| 1.5 | 2026-06-05 | Implementation-plan reconciliation (driven by `17_implementation_plan.md` v1.2 critic batch). **Schema changes:** §4 Schema definitions — `featured_prompt.week_start_date` is now nullable (default-rotation prompts have NULL); UNIQUE constraint replaced with partial UNIQUE index `(tenant_id, week_start_date) WHERE week_start_date IS NOT NULL` so default-rotation prompts are unconstrained. Without this, the seed of 10 default-rotation prompts would fail at migration time. §4 Schema — `team_member` adds `pending_deletion_at` column to support the 30-day account-deletion grace period (specified end-to-end in implementation plan Phase D: column → `account-deletion-processor` cron → "Restore account" cancellation path). **Topology fix:** §2 cron list updated from 11 triggers to 14 — added `badge-evaluator` (was missing — runs every 60s alongside outbox-poller per §5), `kudos-was-read-digest` (was missing — Friday-PM digest per `15_decision_log.md`), and `account-deletion-processor` (new per implementation plan v1.2). All other crons relabeled to reflect the hourly-self-gate pattern documented in §12. No other behavioral changes; pure reconciliation. |
| 1.4 | 2026-06-02 | Final critic batch. **Bug:** §5 Flow 2's `kudos_read` INSERT and `team_member.first_kudos_read_at` UPDATE are now wrapped in a single transaction. Without this wrapper, a handler crash between the two statements would leave `kudos_read` populated but `first_kudos_read_at` NULL — causing the teaching moment to render incorrectly on the user's actual second read. **Correctness:** §5 Flow 2's "your books are being picked up" SQL now uses `date_trunc('week', NOW() AT TIME ZONE 'America/Vancouver')` instead of UTC week truncation — Vancouver users' "this week" rolls over at Monday 0:00 PT, not Sunday 16:00 PT (the UTC-week boundary in PT). v1.5+ parameterizes on `team_settings.timezone`. §7 `createKudos` team-kudos branch comment now says "team members with status IN ('active', 'on_leave')" — per PRD §14, on-leave colleagues still receive team kudos their team gets during their absence. **Clarity:** §4 cross-tenant rule restructured — the three-layer enforcement list now precedes the exception block (prior layout placed the exception between the heading and the numbered list, reading as if it were the first layer); the exception now enumerates three patterns (queue-drain, tenant-iteration, **and system-wide operational** — `dr-verify` and `audit-purge` previously fit none). §5 Flow 1 inline rev annotations dropped (`(rev 1.1)`, `(rev 1.2)`) — change log captures history; in-diagram annotations read as TODO markers. §5 Flow 2 first-ever-read invariant note adds the rejoiner semantic — hard-deleted-and-rejoined team_members get a new row with `first_kudos_read_at = NULL`, so the teaching moment renders again on their first post-rejoin read (intentional; treats rejoining as a new relationship). §11 outbox-poller alert documents the 30min-lookback trade-off — rows aging past the live alert window are caught by a weekly cron_run_log dead-letter review. **Front-matter + closing section now read "ready for ADR extraction and implementation handoff."** No companion PRD changes in this rev. |
| 1.3 | 2026-06-02 | Critic batch-3 fixes (after PRD-aware re-review). **Bugs:** §5 Flow 2 "first-ever read" race-freeness claim was wrong — `xmax + EXISTS` pattern was still racy at READ COMMITTED for inter-transaction races (two concurrent reads by the same brand-new reader could both see "no other row" and both render the teaching moment). Replaced with a denormalized `team_member.first_kudos_read_at` column and atomic conditional UPDATE (`UPDATE … WHERE first_kudos_read_at IS NULL RETURNING id`) — Postgres serializes UPDATEs to the same row, so exactly one of two concurrent first-time reads wins; the other returns zero rows. Genuinely race-free at any isolation level. Companion PRD schema add: `team_member.first_kudos_read_at`. §5 Flow 1 outbox-poller pseudocode synced with §6/§8 (LIMIT 25 not 50; added `AND cancelled_at IS NULL` filter; added the second `deleted_at` re-check immediately before sendEmail). Without this sync, the Flow 1 diagram and §6/§8 disagreed; an implementer reading Flow 1 would have written the original broken poller. **Polish:** §8 soft-delete-mid-render second check now describes the correct mechanism — a fresh `SELECT` relying on Postgres MVCC, NOT "same transaction context" (you can't hold a Postgres transaction across a Resend HTTP call without burning a DB connection for seconds); §11 `dr-verify` and `outbox-poller` alerts restructured to `MAX(completed_at)`-based logic with bounded hung-row lookback (49h for dr-verify, 30min for outbox-poller) — prior AND clause for dr-verify was logically redundant; prior outbox-poller second clause could leave a single slow invocation paging indefinitely; §6 cross-reference fixed (polling execution-time budget lives in §6, not §10); §4 system-worker carve-out reframed to cover both queue-drain crons (outbox poller, badge evaluator) AND tenant-iteration crons (Flow 3 manager digest enumerates tenants) — previously only the queue-drain pattern was named, leaving Flow 3's `SELECT id FROM tenant` un-covered. Closing-section version corrected from 1.1 to 1.3 (rev 1.2 had drifted). Companion PRD reconciliation in 7.5.4: PRD §11 adds `team_member.first_kudos_read_at` column. |
| 1.2 | 2026-06-02 | Critic batch-2 fixes (after PRD-aware re-review). **Bugs:** §7 `createKudos` code example now uses the correct `recipient_notify:k:<kudos_id>:r:<recipient_id>` idempotency key shape (the §5 diagram had been corrected in rev 1.1 but the code example had not — same shape now in both, plus a team-kudos branch comment so the pattern is unambiguous); §5 Flow 2 "first-ever read" detection rewritten from racy `SELECT COUNT(*)` to `RETURNING (xmax = 0)` on the UPSERT + same-transaction `EXISTS` check (race-free at READ COMMITTED); §8 soft-delete mid-render race window correctly framed as inclusive of the 500ms–3s Resend API call (not sub-second) + added second `deleted_at` re-check immediately before `sendEmail`; §5 anniversary-reminder cron now documents the dual opt-out check (`email_settings.anniversary_about_me` for the subject + `email_settings.anniversary_reminders` for the recipient); §11 cron `last run` alerts disambiguated to specify started_at vs completed_at semantics — outbox-poller alerts on stale started_at OR hung (started but not completed within window). **Polish:** §4 tenant-isolation HARD invariant now states an explicit system-level-worker carve-out for the outbox poller, badge evaluator, and cron_run_log inserts; §6 POST /api/kudos request body comment for `value_tag_ids` cites PRD §6 (pre-tag-with-skip rule) instead of the rev 7.3 footnote; §12 "your books are being picked up" query — added concrete SQL + index strategy + v1.5+ denormalization note; §12 timezone-handling section now distinguishes time-of-day-sensitive crons (self-gate) from frequency-driven crons (outbox-poller and badge-evaluator — native cadence, no self-gate); §12 migration two-step removal rule now documents WHY it's deliberately kept conservative (rollback safety + future multi-service deploy lag) despite Vercel's atomic-swap making single-step safe within a single deploy. Companion PRD reconciliation in 7.5.3: NextAuth credentials-provider statements aligned across PRD §6, §6 sub-bullet, §9 readiness checklist, §15 milestone 4, and Appendix A — all now honestly state "single-column migration (`password_hash`) + provider wiring (~1 day)" instead of the misleading "no schema migration." Out of scope: tenant-isolation test suite specification deepening — kept as-is for ADD; full mechanism (API surface generator, CI enforcement) defers to implementation plan. |
| 1.1 | 2026-06-02 | Critic-driven targeted fixes. **Bugs:** §5 Flow 1 team-kudos idempotency key now includes `:r:<recipient_id>` (prior shape would have violated UNIQUE constraint for team kudos that fan out N recipient_notify rows under one key); §6 outbox cancellation moved from "set attempts=3" hack to proper `cancelled_at` + `cancellation_reason` columns; §6 polling query now filters `cancelled_at IS NULL`; §6 polling LIMIT reduced from 50 → 25 to fit Vercel function execution budget; §10 stuck-row alert filter now excludes cancellations (`attempts = 3 AND cancelled_at IS NULL`); §5/§9/§12 Vercel Cron auth header corrected from custom `X-Cron-Secret` to Vercel's actual `Authorization: Bearer <CRON_SECRET>` (prior spec would have 401'd every cron invocation). **Polish:** §6 added Resend 24h idempotency TTL caveat; §7 PRODUCT_COPY clarified (hero hardcoded; other marketing sections admin-editable); §7 Sentry beforeSend PII redaction list enumerated (message_text, context_text, plaintext emails, magic-link tokens, session cookies, device_token hashes, Giphy URLs, Resend message IDs); §7 hashed-email caveat reframed as "pseudonymization, not anonymization"; §7 Plausible events renamed `_opened` → `_link_clicked` (email open tracking is unreliable; clicks are real); §7 CSP `unsafe-inline` acknowledged as v1 tradeoff; §11 added kudos_read index `(reader_id, tenant_id)`; §11 added `cron_run_log` table to schema reference; §12 added Vercel Pro requirement section + timezone handling spec (hourly UTC crons, handler self-gates on tenant timezone); §13 ADRs 006/009/011 cross-references to PRD Appendix A sharpened; §14 removed product-non-goals duplicated from PRD §8; §15 Redis migration section condensed from elaborate planning to brief "path exists, not actively planned for v1.x." Companion PRD reconciliation: PRD §2 cost tally updated to ~$29/mo (Vercel Pro); PRD §11 schema adds `kudos.badge_evaluated_at` + new `cron_run_log` table. |