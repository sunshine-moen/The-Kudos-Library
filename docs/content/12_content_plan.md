Do# Content Plan — The Kudos Library

**Purpose:** Single home for all user-facing language in the Kudos Library: locked product copy, marketing-page sections, email templates, prompt pool, badge content, author quotes, T&C disclosures.

**Audience:** Claude Code (build), Rebekah + UBC comms partner (copy review).

**Companion files:** `05_author_quotes_starter.md` · `06_email_design_brief.md`.

**Decision rationale:** lives in `15_decision_log.md`, not here. This doc is the spec, not the audit trail.

---

## Editorial conventions

Apply across all copy in this doc and any admin edits.

- Canadian spellings: colour, centre, organize, programme→program, focussed, fulfill, wellbeing, acknowledgement, travelling.
- No serial commas: "your shelf, your kudos given and your badges" — not "..., your kudos given, and your badges".
- Em-dashes without spaces: "library—one kudos" — not "library — one kudos".
- Sentence-case subjects and headlines.
- `am` / `pm` lowercase, no periods.
- Lowercase seasons.
- `per cent` (two words) in body text.
- `they/their` as the default singular pronoun.
- No exclamation marks except the modal confirmation in §1.
- No FULL CAPS for emphasis. Italics reserved for quoted text + email prompt strings.
- "Impact" only as a noun meaning physical blow.

---

## 1. Locked product copy

Lives in `/lib/content/hardcoded.ts` per ADD §3. Not admin-editable. Changing these strings is a product decision.

### Hero line

> *A library a team builds together—one kudos at a time, growing into a history.*

Surfaces: `/library` header (quote-style), `/` marketing page Hero (with sign-in CTA), PRD §1.

### Recipient onboarding teaching moment

Renders above the kudos on the recipient's first-ever read (the read that flips `team_member.first_kudos_read_at` NULL → NOW()).

- **Individual:** *This is what [giver_first_name] saw. The library keeps things like this.*
- **Team:** *This is what [giver_first_name] saw your team do. The library keeps things like this.*

Variable: `giver_first_name`. Everything else locked. Does not render on subsequent reads.

### "Your books are being picked up" indicator

In-app on `/library` and `/profile`:

> *Your books are being picked up—N times this week.*

`N` = live count query (ADD §5 Flow 2). Click → detail view: *This week, your books were picked up by:* + list.

### Pay-it-forward nudge

Bottom of `/book/[id]`. Hidden on the recipient's first-ever read (teaching moment takes precedence).

- **No active prompt:** *What did you notice this week? Add to the library →*
- **Active prompt:** *This week we're noticing: [prompt_text]. Add to the library →*

### "This week we're noticing" sign

Passive surface on `/library`:

> *This week we're noticing: [prompt_text]*

Hidden when no active prompt exists.

### Wayfinding signage

> *Your shelf | AG | BB | IF | OPS | SA*

Special Collections sign returns when v1.1 ships.

### Recent-activity shelf name

**New Arrivals.**

### Modal confirmation on submit

- **Individual:** *Thanks for celebrating [recipient_first_name]!*
- **Team:** *Thanks for celebrating [team_short_name]!*

Buttons: "Recognize another teammate" (form reset, stays on `/celebrate`) and "Back to library" (navigates).

Exclamation mark intentional. Do not remove on editorial pass.

### Locked witnessing-framed verb cluster

These verbs carry trigger work. Do not substitute synonyms in any locked copy:

- **noticing / noticed**
- **saw**
- **watched**
- **add to the library** (the locked CTA; never "submit," "create," or "send")

Avoid in locked copy: "appreciated," "thanked," "celebrated for."

### `/login` page

Initial state (sign-in form):

> # Sign in to The Kudos Library
>
> Type your work email and we'll send you a sign-in link.
>
> [Email field — placeholder: `you@ag.ubc.ca`]
>
> [Send me a sign-in link]

Post-submit state (after the form is submitted):

> # Check your email
>
> We sent a sign-in link to [email_address]. It works once and expires in 10 minutes.
>
> Don't see it? Wait a moment, then check your spam folder. If it still hasn't arrived, you can ask for a new link in five minutes.
>
> [Ask for a new link] *(disabled until 5 min elapsed; respects the 1-per-5-min rate limit per PRD §6)*

Variable: `email_address`.

### Device confirmation page ("Yes, this is me")

Renders when a magic deep-link is clicked from a device the system hasn't seen before.

> # Confirm this device
>
> Welcome to The Kudos Library.
>
> This is the first time we've seen you sign in from this device. Click below to confirm it's you—then we'll remember this device for 90 days.
>
> If you didn't expect this, close this page. Whoever forwarded the email can't read your kudos without confirming.
>
> [Yes, this is me]

The button label *"Yes, this is me"* is locked (per PRD §6 hard rules — forwarding-friction framing).

### Edit window countdown

Renders on the giver's view of their own kudos during the 15-minute edit window.

- More than 1 minute remaining: *Edit window: [N] minutes remaining*
- Exactly 1 minute remaining: *Edit window: 1 minute remaining*
- Less than 1 minute remaining: *Edit window: less than a minute remaining*

Optional tooltip near the countdown: *You can edit the message, values, context or GIF until the timer runs out. The recipient won't see the kudos until then.*

After expiration: the edit UI is hidden. The kudos appears as a normal book on shelves; the recipient_notify email queues per the outbox pattern (ADD §5).

### Empty states

| Surface | When | Copy |
|---|---|---|
| `/library` New Arrivals shelf | Zero kudos total in the tenant | *The library is brand new. Be the first to add a kudos.* + CTA *[Add to the library]* |
| `/shelf/[member]` (someone else's shelf) | Zero kudos received yet | *[first_name]'s shelf is waiting for its first book.* (no CTA on someone else's shelf) |
| `/shelf/[your_id]` (your own shelf, accessed via `/profile` shortcut) | Zero kudos received yet | *Your shelf is waiting for its first book.* |
| `/team/[slug]` | Zero team-recipient kudos yet | *[team_name]'s shelf is waiting for its first book.* |
| `/profile` badges section | No badges earned yet | *No badges yet. Add your first kudos to earn First Chapter.* + CTA *[Add to the library]* |
| Pickup indicator | N = 0 reads this week | **Hide the component entirely.** No copy renders. |
| Leaderboard cards (Week / Month) | Period has zero kudos | **Hide the component entirely.** No copy renders. |

Variables: `first_name`, `team_name`.

### Account deletion confirmation modal

Renders when user clicks "Delete my account" on `/profile`.

> # Delete your account?
>
> Your account will enter a 30-day grace period. During that time, you can restore it from any email we send you.
>
> After 30 days, everything is permanently removed:
>
> - Your shelf
> - Kudos you've given
> - Kudos you've received
> - Your badges
> - Your email settings
>
> This cannot be undone.
>
> If you didn't mean to do this, close this window. Otherwise, click below to start the 30-day grace period.
>
> [Cancel] [Yes, start the 30-day grace period]

Locked. The list of what gets deleted matches the `account_deletion_grace_period` email (§3.13) for consistency.

### Restore account confirmation page

Renders when user clicks the Restore link from the grace-period email.

> # Welcome back
>
> Your account is restored. Your shelf, your kudos and your badges are all where you left them.
>
> [Open the library]

### `/celebrate` form validation messages

Sample copy — admin can adjust. Voice should respect the witnessing-framed verb cluster.

| Error condition | Message |
|---|---|
| Recipient required (neither person nor team selected) | *Pick a person or team to celebrate.* |
| Self-kudos blocked (recipient == giver) | *You can't write a kudos about yourself. Notice someone else?* |
| Message text required (empty `message_text`) | *Add a message—even a sentence or two.* |
| Context text length exceeded (>200 chars) | *Context is 200 characters or fewer.* |
| General submit error (5xx / network) | *Something went wrong. Try again in a moment.* |

### First-login orientation

**Out of scope for v1.** The launch kickoff session per `14_launch_adoption_plan.md` handles orientation live (60-minute walkthrough + recording for absentees). The library page itself serves as the in-product introduction; no separate orientation overlay needed.

PRD §4 walkthrough mentions an "orientation overlay" — that reference predates the explicit kickoff session decision and is now redundant. The PRD's mention can be left as-is (no rework needed) or trimmed in a future editorial pass.

---

## 2. Marketing page sections (`/`)

Single scrollable with anchor top-nav. Admin can edit copy within sections; cannot remove required sections.

| Section | Source of copy | Status |
|---|---|---|
| Hero | Hardcoded (locked) | Final |
| What it is | Admin-editable | Drafted |
| How it works | Admin-editable | Drafted |
| What's inside | Admin uploads + captions | Caption framing drafted |
| Built for UBC departments | Admin-editable | Drafted |
| Sign in CTA (bottom) | Admin-editable | Drafted |
| Footer | Hardcoded (Terms · Privacy links) | Final |

No Roadmap section.

### Hero section

Renders the hardcoded hero line (§1) + a sign-in CTA button.

> *A library a team builds together—one kudos at a time, growing into a history.*

[Sign in to the library]

### What it is

> The Kudos Library is where team members recognize each other in a way that celebrates the small and big moments. With each kudos, the team builds a collective library that forms its history. It's built for teams that value recognition as part of their culture—and know that taking time to notice each other's efforts leads to stronger, more resilient workplaces.

### How it works

Three steps. Renders as numbered sections with short paragraphs.

**1. Notice.**
> Someone on your team does something good — covers for a colleague, shares what they know, shows up when it matters. You see it.

**2. Add it to the library.**
> Write a short kudos on `/celebrate`. Pick a value, a book design, even a GIF if you want. It takes a minute.

**3. It lands on their shelf.**
> Your teammate gets an email. The kudos appears as a book on their shelf, where everyone can see it. Managers receive a weekly digest of what their team noticed.

### What's inside

4–6 screenshots from the live staging app (captured in Phase E per implementation plan). Caption framing:

| Screenshot | Caption |
|---|---|
| `/library` homepage | The library, with everyone's shelves |
| `/celebrate` form | Adding a kudos |
| `/book/[id]` detail | A kudos on the shelf |
| `/shelf/[member]` | A teammate's personal shelf |
| `/admin/library-setup` | Library Setup (admin view) |
| Email preview | An email from the library |

### Built for UBC departments

Renders three pieces: positioning intro + Rebekah's personal note + AG culture statement.

**Positioning intro:**

> The Kudos Library was built specifically for UBC departments. A private, lightweight tool that fits inside your own walls—for teams that treat recognition as part of their culture, not an afterthought.

**Why I built this — Rebekah's personal note** (~140 words):

> At AG, we've had a Wednesday kudos ritual for three years. Written on a Mural board and shared in a meeting. It felt great. We all saw things worth stopping to acknowledge. But after the meeting, the board would be empty and we'd start over.
>
> I wanted to give these moments a better home—one that holds the history of who's celebrated who, not a board that resets or messages lost in email and Teams. One that lets us notice things in the moment and make them part of our team's story.
>
> That's the home The Kudos Library creates for our stories.
>
> I built this for AG. I hope you enjoy the read.

**AG culture statement:**

> Annual Giving's culture: Learning, Connection, Innovation, Agility, Kindness and Get 'er done.

For canonical/longer framing (if a section wants context):

> In addition to UBC's DAE values of Excellence, Integrity, Respect, Accountability, Communications and Collaboration, Annual Giving has a team culture that embodies: Learning, Connection, Innovation, Agility, Kindness and Get 'er done.

### Sign in CTA (bottom of page)

> Notice something worth keeping? Sign in to add it to your team's library.

[Sign in to the library]

---

## 3. Email templates

All 13 templates are HTML with the library-themed header + author-quote footer per `06_email_design_brief.md`. Subjects and bodies are admin-editable in `/admin/templates` except for the locked phrases marked in the trigger matrix.

### Voice rules (all templates)

- Greeting: `Hi [first_name],`
- No explicit sign-off; author-quote footer closes the email.
- Opt-outable templates include: `You can quiet these in your email settings.`
- CTAs use the locked verb cluster from §1.

### Trigger matrix

| Template | Trigger | Recipient | Opt-out | Locked phrases |
|---|---|---|---|---|
| `recipient_notify` | Kudos submission (fires at edit-window expiration) | Recipient (or each team member for team kudos) | No | "added a kudos for you"; "waiting on your shelf" |
| `manager_digest` | Per cadence, non-empty week | Manager | Cadence per-manager | "what your team noticed about each other" |
| `manager_quiet_week` | Per cadence, empty week | Manager | Cadence per-manager | "the library has slow weeks too" |
| `top_giver_announcement` | Friday boundary, rank-1 winner | Top giver | Yes (`top_giver_thank_you`) | "Thank you for noticing" |
| `badge_milestone` | Badge threshold crossed (post-edit-window) | Awardee (private) | No (rare) | Per-badge story (§5) |
| `inactive_nudge` | 4+ consecutive weeks zero kudos; on_leave suppressed | Inactive giver | Yes (`inactive_giver_nudge`) | "We miss your voice in the library" |
| `overlooked_recipient_nudge` | Weekly; ≥1 overlooked direct report | Manager | Yes (`overlooked_recipient_nudge`) | "A quiet check from the library" |
| `work_anniversary_reminder` | Daily; lead-time match; subject opt-in required | Direct manager + manager's manager (or admins) | Yes (recipient + subject independent) | "Worth noticing" |
| `prompt_of_the_week` | Wednesday; user zero kudos this week + opt-in | Giver | Yes (`prompt_of_the_week`) | "The library's prompt for the week" |
| `prompt_admin_reminder` | Friday; no `featured_prompt` for upcoming week | All admins | No (operational) | "fall back to the default rotation" |
| `kudos_was_read_digest` | Friday; opt-in + ≥1 read this week | Giver | Yes (`kudos_was_read_digest`, default OFF) | "Your books were picked up" |
| `broadcast` | Manual admin send | Selected audience | No | Composed at send time |
| `account_deletion_grace_period` | User-initiated deletion | The user requesting deletion | No (transactional) | "Your account will be permanently deleted on" |

---

### 3.1 `recipient_notify`

**Subject (individual):** `[giver_first_name] wrote you a kudos`
**Subject (team):** `[giver_first_name] wrote a kudos for [team_short_name]`

**Body (individual):**
```
Hi [recipient_first_name],

[giver_first_name] added a kudos for you to the library. It's waiting on your shelf.

[Read it here]
```

**Body (team):**
```
Hi [recipient_first_name],

[giver_first_name] added a kudos for [team_short_name] to the library. Your team's shelf has a new arrival.

[Read it here]
```

**Variables:** `giver_first_name`, `recipient_first_name`, `team_short_name` (team only), `deep_link_url` (button).

**Behaviour:** teaser only — never include `message_text`. Deep-link opens `/book/[id]` after device confirmation.

---

### 3.2 `manager_digest`

**Subject:** `This week on your team's shelf`

**Body:**
```
Hi [manager_first_name],

Here's what your team noticed about each other this week.

KUDOS RECEIVED BY YOUR DIRECT REPORTS
- [recipient_first_name] [last_initial].: [N] kudos
- [recipient_first_name] [last_initial].: [N] kudos
[...one row per direct report with ≥1 kudos received]

[Open your team's shelf]

[IF team_earned_badges_count > 0:]
BADGES YOUR TEAM EARNED
- [recipient_first_name] [last_initial]. earned the [badge_name]
[...one row per badge earned this week by direct reports; actor excluded]

If you noticed someone this week, the library is open.

[Add to the library]
```

**Variables:** `manager_first_name`, direct-report kudos counts, team slug, optional direct-report badge list.

**Behaviour:** the manager's own badges do NOT appear in their own digest, even if they're a direct report of a higher manager. Cadence: weekly Mon 09:00 PT default; per-manager configurable via `team_member.digest_cadence`.

---

### 3.3 `manager_quiet_week`

**Subject:** `A quiet week on your team's shelf`

**Body:**
```
Hi [manager_first_name],

No new kudos for your direct reports this week. That happens sometimes—the library has slow weeks too.

If you noticed something worth keeping, your team's shelf is open.

[Add to the library]
```

**Variables:** `manager_first_name`.

**Behaviour:** sends only when `manager_digest` would have been empty for the cadence period. Replaces, doesn't supplement.

---

### 3.4 `top_giver_announcement`

**Subject:** `This week, you celebrated the most`

**Body:**
```
Hi [giver_first_name],

You added the most kudos to the library this week. [N] in total.

Thank you for noticing. The library wouldn't be much without you.

[Open your shelf]

You can quiet these in your email settings.
```

**Variables:** `giver_first_name`, `N`, member slug.

**Behaviour:** rank-1 weekly winner only. No empty-period email. Default send time Friday 15:00 PT via `team_settings.top_giver_send_local_time`.

---

### 3.5 `badge_milestone`

**Subject:** `A new chapter on your shelf—the [badge_name]`

**Body:**
```
Hi [giver_first_name],

[badge_story_copy — see §5 for the 9 per-badge stories]

[Open your shelf]
```

**Variables:** `giver_first_name`, `badge_name`, `badge_story_copy`, member slug.

**Behaviour:** private to awardee only. Actor-excluded from any manager digest "Badges your team earned" section. Per-badge story bodies in §5.

---

### 3.6 `inactive_nudge`

**Subject:** `We miss your voice in the library`

**Body:**
```
Hi [first_name],

It's been a few weeks since you added a kudos. No pressure—just a quiet reminder that you're part of this.

If you've noticed something worth keeping recently, your shelf is open.

[Add to the library]

You can quiet these in your email settings.
```

**Variables:** `first_name`.

**Behaviour:** fires only after 4+ consecutive weeks of zero kudos. Suppressed by `team_member.status = 'on_leave'` AND by `email_settings.inactive_giver_nudge = false`.

---

### 3.7 `overlooked_recipient_nudge`

**Subject:** `A few teammates haven't been celebrated lately`

**Body:**
```
Hi [manager_first_name],

A quiet check from the library. These teammates on your team haven't received a kudos in the last [window_days] days:

- [first_name] [last_initial].
- [first_name] [last_initial].
[...one row per overlooked direct report]

If you've noticed them doing good work this week, the library is open.

[Add to the library]

You can quiet these in your email settings.
```

**Variables:** `manager_first_name`, `window_days` (default 30; 14/30/60 via `team_settings.overlooked_recipient_window_days`), overlooked-report list.

---

### 3.8 `work_anniversary_reminder`

**Subject (1 week before — default):** `[subject_first_name]'s [N]-year anniversary is in a week`
**Subject (3 days before):** `[subject_first_name]'s [N]-year anniversary is in three days`
**Subject (day of):** `Today is [subject_first_name]'s [N]-year anniversary`

**Body (1 week before):**
```
Hi [recipient_first_name],

[subject_first_name]'s [N]-year [UBC|Annual Giving] anniversary is one week from today, on [anniversary_date].

Worth noticing.

[Add to the library]

You can quiet these in your email settings.
```

**Body (3 days before):** as above with `is in three days, on [anniversary_date]`.

**Body (day of):** as above with `Today is [subject_first_name]'s [N]-year [UBC|Annual Giving] anniversary.`

**Variables:** `recipient_first_name`, `subject_first_name`, `N`, `UBC|Annual Giving`, `anniversary_date` (formatted "June 14, 2026").

**Behaviour:**
- Subject opt-out (`email_settings.anniversary_about_me = false` on the subject) short-circuits before recipient evaluation — no reminders fire about that subject for any potential recipient.
- Recipient opt-out (`email_settings.anniversary_reminders = false`) suppresses individual recipients.
- Actor exclusion: subject doesn't receive their own anniversary email.
- If no manager's manager, fires to direct manager + all admins.
- Lead time via `team_settings.anniversary_lead_time` (`1_week_before` default / `3_days_before` / `day_of`).

---

### 3.9 `prompt_of_the_week`

**Subject:** `What we're noticing this week`

**Body:**
```
Hi [first_name],

The library's prompt for the week:

"[prompt_text]"

If you've seen something this week, add it to the library.

[Add to the library]

You can quiet these in your email settings.
```

**Variables:** `first_name`, `prompt_text` (italicized, from active `featured_prompt` or default rotation).

**Behaviour:** Wednesday 09:00 PT default. Only sends to users with zero kudos this calendar week (Mon-Sun in tenant timezone) AND `email_settings.prompt_of_the_week = true`.

---

### 3.10 `prompt_admin_reminder`

**Subject:** `No prompt scheduled for next week`

**Body:**
```
Hi [admin_first_name],

Next week (starting Monday [next_monday_date]) doesn't have a featured prompt scheduled yet. If nothing is added before Sunday night, the library will fall back to the default rotation.

[Schedule next week's prompt]
```

**Variables:** `admin_first_name`, `next_monday_date` (formatted "June 23, 2026").

**Behaviour:** Friday 09:00 PT default. Sends to all admins for the tenant. Goes silent if a prompt is already scheduled for next week.

---

### 3.11 `kudos_was_read_digest`

**Subject:** `Your books were picked up this week`

**Body:**
```
Hi [first_name],

A few teammates opened the kudos you added to the library this week:

- [day_of_week, date]: [reader_first_name] [reader_last_initial]. read your kudos for [kudos_subject_name]
[...one row per kudos_read event this week, chronological]

Quiet reminder: someone always reads them.

[Open your shelf]

You opted into this digest. You can quiet it in your email settings.
```

**Variables:** `first_name`, read-event list. `kudos_subject_name` = recipient's first name for individual kudos OR team short name for team kudos.

**Behaviour:** opt-in only (`email_settings.kudos_was_read_digest = true`; default OFF). Friday 15:00 PT default. Only fires if user has ≥1 read event this week.

---

### 3.12 `broadcast`

**Subject:** `[admin_composed_subject]`

**Body shell:**
```
Hi [first_name],

[admin_composed_body]

[optional CTA button with custom text + URL]

— [admin_first_name], [admin_role]
```

**Variables:** `first_name`, admin-composed content, optional CTA, signature auto-populated from sender's profile.

**Behaviour:** manual send only. Audience selected at send time. Audit-logged.

---

### 3.13 `account_deletion_grace_period`

**Subject:** `Your Kudos Library account will be deleted on [deletion_date]`

**Body:**
```
Hi [first_name],

We've received your request to delete your Kudos Library account.

Your account will be permanently deleted on [deletion_date]. Between now and then, you can change your mind.

[Restore my account]

If you don't restore your account before [deletion_date], everything will be removed: your shelf, your kudos given, your kudos received, your badges and your email settings. This cannot be undone after that date.

If you didn't request this, restore your account immediately and contact your admin.
```

**Variables:** `first_name`, `deletion_date` (NOW() + 30 days, formatted "July 5, 2026"), `restore_token` (button → `/restore-account/[token]`).

**Behaviour:** fires immediately when user initiates deletion on `/profile`. Restore link sets `team_member.pending_deletion_at = NULL` and notifies admin. After 30 days, `account-deletion-processor` cron executes hard-delete cascade (implementation plan §D).

---

### 3.14 `magic_link_login` (NextAuth-managed; not in `email_template` table)

Sent when a user requests a sign-in link from `/login` OR when an admin adds a new team member to the roster (admin-add auto-triggers the same template).

**Where this lives:** NextAuth's email provider config in `lib/auth/magic-link.ts` (per ADD §3). NOT a row in the `email_template` table. NOT admin-editable via `/admin/templates`. Changes require a code deploy.

**Subject:** `Your sign-in link for The Kudos Library`

**Body:**
```
Hi,

Here's your sign-in link for The Kudos Library:

[Sign in]

This link works once and expires in 10 minutes. If you didn't ask to sign in, you can safely ignore this email.

Welcome to the library.
```

**Variables:** magic-link URL (rendered as the "Sign in" button).

**Behaviour:**
- Single template serves both first-time sign-in and returning sign-in.
- Rate limit per PRD §6: 1 send per 5 min per email address.
- Token TTL: 10 minutes.
- This is the "welcome email" referenced in `14_launch_adoption_plan.md` launch announcement — the same email serves welcome + sign-in roles.

### Template editing rules

- T&C + Privacy Policy live in `static_content`, product-curated, legal review required to edit.
- All admin edits to `email_template` rows logged in `admin_audit_log`.
- Locked phrases in the trigger matrix are protected — admin UI flags them and prevents removal.
- The `magic_link_login` email (§3.14) is NextAuth-managed code, not admin-editable.
- Volume modelling: ~7–11 emails/week worst-case for a popular manager who is also a top giver. Pre-launch dry run recommended (`14_launch_adoption_plan.md`).

---

## 4. Prompt pool

### `prompt_starter` pool (`/celebrate` picker)

TBD by Rebekah. ~10 entries. Admin-editable.

### `featured_prompt` default rotation pool

Seeded with 8 witnessing-framed prompts (`is_default_rotation = true`, `week_start_date = NULL` per ADD §4 partial UNIQUE index):

1. "Who covered for someone without being asked?"
2. "Whose quiet effort do you want to celebrate?"
3. "Whose kindness made your week easier?"
4. "Who shared what they knew when you needed it?"
5. "Who stayed steady when things were chaotic?"
6. "What did you watch a teammate handle well this week?"
7. "Whose work this week should be recognized by the team?"
8. "Who showed up for someone—and how?"

**Surfaces** (routing per ADD §5):
- Top of `/celebrate`
- `prompt_of_the_week` Wednesday email
- "This week we're noticing" sign on `/library`
- Pay-it-forward nudge at bottom of `/book/[id]`

---

## 5. Badge content

### Badge roster (9 badges, giver-focused, Canadian-author themed)

| Badge | Trigger | Re-earnable | Author tie-in |
|---|---|---|---|
| First Chapter | First kudos given (lifetime) | No | Universal debut moment |
| Robinson Roll | 10 kudos given | No | Eden Robinson (Haisla/Heiltsuk, BC) |
| Montgomery Medal | 25 kudos given | No | L.M. Montgomery |
| Atwood Accolade | 50 kudos given | No | Margaret Atwood |
| Ondaatje Order | 100 kudos given | No | Michael Ondaatje |
| Shields Standard | 4-week streak | Yes | Carol Shields |
| Wagamese Way | 8-week streak | Yes | Richard Wagamese (Ojibwe) |
| Campbell Continuum | 12-week streak | Yes | Maria Campbell (Métis) |
| Hill Honour | 16-week streak | Yes | Lawrence Hill |

### Badge story copy

Each badge's story lives in `badge_definition.description` and forms the body of the milestone email (§3.5). Voice: library-voiced, ~3–4 sentences, author named once lightly without biography.

**First Chapter** (first kudos given)
> Every shelf starts with one. You added your first kudos to the library—the first chapter on your shelf.
>
> What you noticed mattered enough to write down. That's all the library asks.
>
> The library keeps it.

**Robinson Roll** (10 kudos given)
> Ten kudos. The Robinson Roll joins your shelf.
>
> Eden Robinson writes about paying attention to a place. You've been paying attention to a team—ten times now.
>
> The library is starting to know you.

**Montgomery Medal** (25 kudos given)
> Twenty-five kudos. The Montgomery Medal joins your shelf.
>
> L.M. Montgomery wrote about kindred spirits—people who notice each other across a room. You've noticed yours twenty-five times.
>
> The library keeps every one of them.

**Atwood Accolade** (50 kudos given)
> Fifty kudos. The Atwood Accolade joins your shelf.
>
> Margaret Atwood writes about persistence—about showing up to the same kind of work, again and again. You've been doing that here. Fifty times now.
>
> The library has noticed.

**Ondaatje Order** (100 kudos given)
> One hundred kudos. The Ondaatje Order joins your shelf.
>
> Michael Ondaatje writes whole books out of fragments—small moments held together until they mean something. That's what you've been doing here. One hundred fragments, all on the shelf.
>
> The library is grateful.

**Shields Standard** (4-week streak)
> Four weeks running. The Shields Standard joins your shelf.
>
> Carol Shields built a body of work on the dignity of ordinary lives—the kind of attention you've been paying to your team, week after week.
>
> The library is steady when you are.

**Wagamese Way** (8-week streak)
> Eight weeks running. The Wagamese Way joins your shelf.
>
> Richard Wagamese wrote that we are all our relations. You've been holding to that—week after week, noticing the people around you.
>
> The library is grateful for the rhythm.

**Campbell Continuum** (12-week streak)
> Twelve weeks running. The Campbell Continuum joins your shelf.
>
> Maria Campbell's work is about what gets passed forward—stories that hold a community together across time. You've been doing your small version of that, twelve weeks straight.
>
> The library is full of what you've kept.

**Hill Honour** (16-week streak)
> Sixteen weeks running. The Hill Honour joins your shelf.
>
> Lawrence Hill writes about witnessing as an act of generosity—the kind of work that asks something of the witness. You've been doing it for sixteen weeks.
>
> The library knows you well now.

### Author governance

- Annual review every fiscal year; cross-check authors against current public record. Log in `AUTHOR_REVIEW_LOG.md`.
- Ad-hoc triggers: news, controversy, identity-claim challenge, user feedback.
- v1: badges product-controlled, not admin-editable. Product owner responsible for choices, copy, review.
- v1.x: admin badge-deactivate. v1.5: per-tenant badge selection from vetted library.
- v2 fallback: non-named alternatives (Page Turner, Bookbinder, etc.) if UBC Legal disallows named authors at commercialization. Realistic fallback cost ~1 week.

---

## 6. Author quotes

**Production criteria:**
- ~30 quotes at deploy after verification.
- Canadian-author-weighted: ~half Canadian (Indigenous + diverse representation), ~half international.
- Squeaky-clean legacy bar (same as badges).
- ≤300 characters.
- Attributed to author + source work where known.

**Dedup at send time:** random active quote NOT in last 5 sent to this recipient. Fallback: drop dedup constraint if no candidates pass (silent, no alert).

**Admin Quotes tab:** list + deactivate toggle per row. No add-quote in v1. Audit-logged.

**Working set:** the verification working log lives in `05_author_quotes_starter.md` (starter set with per-quote confidence ratings, source-checking guidance). Once Rebekah has verified ~30 quotes against primary sources, the final approved list moves here as the canonical seed for the `author_quote` table; `05` archives.

---

## 7. Terms of Service + Privacy Policy

Both documents live in `static_content`, product-curated, legal review to edit. Rendered at `/terms` and `/privacy`. Drafted by Rebekah with UBC comms partner; the comms partner brings legal voice and structure conventions, this doc specifies required content + suggested section structure.

### 7.1 Required disclosures (must appear in T&C)

- **Author-name disclaimer:** *Badge names reference Canadian authors as cultural homage; no affiliation, endorsement or commercial use is implied. v1 is a non-commercial UBC internal tool.*
- **FIPPA prototype-posture:** v1 is a single-unit prototype; data hosted on US cloud providers (Vercel, Neon, Resend); no formal UBC PIA filed for v1; PIA conversation slated for v1.5 prep. Pointer to Privacy Policy's "Your Privacy" section for kudos-removal / account-deletion requests.
- **Public-to-team:** all kudos visible to every team member; managers receive digests of direct reports' kudos.
- **Vendor list:** Vercel, Neon, Resend, Giphy, Plausible, Sentry — and what data each touches.

### 7.2 T&C section structure (suggested)

| # | Section | Required content |
|---|---|---|
| 1 | What this service is | 1–2 sentences. Internal UBC department peer-recognition tool. |
| 2 | Who can use it | Team members of the tenant. Account managed by admins. |
| 3 | What you agree to | Use the library to recognize colleagues; do not post harassment, harm, or inappropriate content; admin may soft-delete any kudos. |
| 4 | What we agree to | Reasonable uptime (best effort; v1 prototype). Data retention windows per Privacy Policy. Notification of significant terms changes. |
| 5 | Required disclosures | The 4 from §7.1 above. |
| 6 | Your data rights | Request data export; request kudos removal (yours or about you); request account deletion (30-day grace per `17_implementation_plan.md` §D). Cross-reference Privacy Policy "Your Privacy" section. |
| 7 | Changes to these terms | How users are notified; effective date conventions. |
| 8 | Contact | Email for questions. |

### 7.3 Privacy Policy section structure (suggested)

| # | Section | Required content |
|---|---|---|
| 1 | What we collect | PII (name, email, department, job title, ubc_hire_date, ag_join_date). Content (`kudos.message_text`, `kudos.context_text`). Read events (`kudos_read`). Analytics (Plausible, no PII). Per ADD §4 schema. |
| 2 | How we use it | Display kudos in the library; send emails per user opt-ins; manager digests of direct reports' kudos; internal analytics. |
| 3 | Who can see what | Team members see all kudos within the tenant (public-to-team). Managers see digests of direct reports. Admins see roster + audit log. |
| 4 | How long we keep it | `email_send_log`: 90 days (admin-configurable). `magic_link_token`: TTL-bound. `device_confirmation`: 90-day inactivity. Soft-deleted kudos: retained for audit (no expiration in v1). Neon PITR backup: 7 days. Per ADD §4. |
| 5 | Your privacy | How to request data export; how to request kudos removal; how to delete your account (30-day grace + restore path); how to update email settings. |
| 6 | Third-party vendors | The vendor list from §7.1 with what data each touches. Per `15_decision_log.md` vendor-breach rule, vendors are reviewed annually. |
| 7 | FIPPA prototype-posture | The disclosure from §7.1 in plain language. |
| 8 | Cookies | Only the session cookie (HttpOnly, Secure, SameSite=Lax). No analytics cookies (Plausible is cookieless). |
| 9 | Updates to this policy | How users are notified; effective date conventions. |
| 10 | Contact | Email for questions; pointer to UBC privacy office for FIPPA-related concerns. |

### 7.4 Drafting notes for UBC comms partner

- Plain language throughout; this is a v1 prototype for AG team members, not a public commercial product.
- Avoid commercial-SaaS boilerplate (no arbitration clauses, no aggressive liability disclaimers).
- The 4 required disclosures in §7.1 must appear verbatim (or with edits that preserve all key facts) — they're load-bearing for FIPPA prototype-posture defensibility.
- T&C acceptance is a hard gate on first login (PRD §6 hard rule). Copy should be readable in 2–3 minutes.
- Privacy Policy is referenced from the FIPPA disclosure in T&C; both docs should be internally consistent.

### 7.5 Placeholder copy (until UBC comms partner final)

These placeholders seed `static_content` at deploy so the product can ship with valid T&C + Privacy Policy that meet the §7.1 required-disclosure bar. UBC comms partner replaces both with legal-reviewed versions before public-tenant rollout. Variables to fill at seed: `[DATE TBD]`, `[contact-email-TBD]`.

#### Placeholder — Terms of Service

> # Terms of Service — The Kudos Library
>
> Last updated: [DATE TBD]
>
> ## What this is
>
> The Kudos Library is a private peer-recognition tool for the UBC Annual Giving (AG) team. You leave each other written kudos that appear as books on personal bookshelves, and the library keeps that history over time.
>
> ## Who can use it
>
> You can use the Kudos Library if your AG admin has added you to the team roster. Accounts are managed by admins, not by self-signup.
>
> ## What you agree to
>
> When you use the Kudos Library, you agree to:
>
> - Use it to recognize colleagues for things you've noticed.
> - Not post content that harasses, harms or is inappropriate for a workplace.
> - Accept that admins can soft-delete any kudos they consider problematic.
>
> You also agree to keep your account secure. Your admin will help if you need to recover access.
>
> ## What we agree to
>
> We do our best to:
>
> - Keep the library running reliably (best effort; this is a v1 prototype).
> - Hold on to your data for the windows described in the Privacy Policy and no longer.
> - Tell you when these terms change in any meaningful way.
>
> ## Required disclosures
>
> **Author names.** Badge names reference Canadian authors as cultural homage. No affiliation, endorsement or commercial use is implied. v1 is a non-commercial UBC internal tool.
>
> **FIPPA posture.** v1 is a single-unit prototype. Data is hosted on US cloud providers (Vercel, Neon, Resend). No formal UBC Privacy Impact Assessment has been filed for v1. The PIA conversation begins as part of v1.5 prep. See the Privacy Policy "Your privacy" section for how to request kudos removal or account deletion.
>
> **Public to your team.** Every kudos in the library is visible to every other team member in your tenant. Managers also receive weekly digests of kudos given to their direct reports.
>
> **Vendors.** We use Vercel (hosting), Neon (database), Resend (email), Giphy (GIF picker, browser-only), Plausible (analytics, no PII) and Sentry (error monitoring, PII stripped). See the Privacy Policy for what each vendor touches.
>
> ## Your data rights
>
> You can:
>
> - Export all your data from your profile page.
> - Ask an admin to remove any kudos you gave or received.
> - Delete your account from your profile page. Your account stays in a 30-day grace period after the request—you can restore it any time in that window. After 30 days, everything is removed and cannot be undone.
>
> ## Changes to these terms
>
> If we change these terms in a meaningful way, you'll see a notice when you next sign in. Small changes (typos, clarifications) won't trigger a notice.
>
> ## Contact
>
> Questions? Email [contact-email-TBD].

#### Placeholder — Privacy Policy

> # Privacy Policy — The Kudos Library
>
> Last updated: [DATE TBD]
>
> ## What we collect
>
> About you:
>
> - Your name, work email, department and job title.
> - Your UBC hire date and Annual Giving join date (used for work-anniversary reminders).
>
> About what you do in the library:
>
> - The kudos you write—message text, any context you add, the values you tag, optional GIF.
> - The kudos you read—which ones, and when.
> - Your email-setting preferences.
>
> About how the app is used overall:
>
> - Page views and event counts via Plausible. Plausible does not collect PII or use cookies.
>
> ## How we use it
>
> - Display kudos in the library so your team can see them.
> - Send emails per your opt-in choices (digests, prompts, anniversary reminders, etc.).
> - Generate weekly manager digests of direct reports' kudos.
> - Internal analytics to understand how the library is being used.
>
> ## Who can see what
>
> - **Every team member** in your tenant can see every kudos in the library.
> - **Managers** receive weekly digests of kudos given to their direct reports.
> - **Admins** can see the full roster, the audit log of admin actions, and can soft-delete any kudos.
>
> ## How long we keep it
>
> - Email-send logs: 90 days (admin-configurable per tenant).
> - Magic-link login tokens: expire 10 minutes after issue.
> - Magic deep-link tokens (from emails): expire 14 days after issue.
> - Device confirmations: expire 90 days after last use.
> - Soft-deleted kudos: kept indefinitely in v1 for audit and recompute logic.
> - Backups (Neon point-in-time recovery): rolling 7-day window.
>
> ## Your privacy
>
> You can:
>
> - **Export your data** from your profile page. You'll receive a JSON file with everything we have about you.
> - **Request kudos removal** for any kudos you gave or received. Ask an admin; it's a soft-delete (the kudos stops being visible and is removed from your shelf and any digests).
> - **Delete your account** from your profile page. Your account enters a 30-day grace period—you can restore it from any email we send in that window. After 30 days, your account, your shelf, your kudos given, your kudos received, your badges and your email settings are all permanently removed.
> - **Update your email settings** any time on your profile page. Each setting is independent—quiet what you don't want and keep what you do.
>
> ## Third-party vendors
>
> The Kudos Library uses these vendors. We review them annually for breaches and changes.
>
> | Vendor | What they touch |
> |---|---|
> | Vercel | Hosting; sees all HTTP traffic between you and the app. |
> | Neon | Postgres database; stores everything in "What we collect" above. |
> | Resend | Email delivery; sees recipient emails, subjects and bodies. |
> | Giphy | GIF picker; runs in your browser only. Your search queries go to Giphy. |
> | Plausible | Analytics; no PII, no cookies, no IP storage. |
> | Sentry | Error monitoring; PII is stripped before any event leaves the app. |
>
> ## FIPPA posture
>
> v1 is a single-unit prototype for the UBC Annual Giving team. Data lives with US cloud providers (Vercel, Neon, Resend) under those vendors' standard data-processing terms. No formal UBC Privacy Impact Assessment has been filed for v1. The PIA conversation begins as part of v1.5 prep.
>
> For FIPPA-related concerns, contact the UBC privacy office.
>
> ## Cookies
>
> We use one cookie: a session cookie that keeps you signed in. It's HttpOnly, Secure and SameSite=Lax. We don't use analytics cookies (Plausible is cookieless).
>
> ## Updates to this policy
>
> If we change this policy in a meaningful way, you'll see a notice when you next sign in. Small changes won't trigger a notice.
>
> ## Contact
>
> Questions about your data or this policy? Email [contact-email-TBD].
>
> For FIPPA-related questions, contact the UBC privacy office.

---

## 8. Locked vs flexible copy

Claude Code and any admin editor must respect this distinction.

**Locked** (change them and you change product behaviour):
- Hero line (§1)
- Recipient onboarding teaching moment (§1)
- "Your books are being picked up" phrasing (§1)
- Pay-it-forward nudge phrasing (§1)
- "This week we're noticing" sign phrasing (§1)
- "New Arrivals" shelf name (§1)
- "Add to the library" CTA verb (never "submit," "create," "send")
- Witnessing-framed verb cluster (§1)
- Modal confirmation phrasing (§1)
- Email template locked phrases (§3 trigger matrix)

**Flexible** (admin can edit; tone-pass can adjust):
- Email subject lines and body text (except locked phrases)
- Marketing page section copy (except hero)
- Badge story bodies until tone-pass complete
- Most admin UI labels

When ambiguous, default to treating as locked and flag for content owner.

---

## 9. Open items

- Marketing page final copy review — Rebekah (drafts in place; she edits to her voice)
- "Why I built this" personal note — Rebekah edits draft (in §2)
- 9 badge milestone story bodies — Rebekah reviews drafts (in §5)
- `prompt_starter` picker pool (~10) — Rebekah
- T&C copy drafted to §7.2 structure — Rebekah + UBC comms partner (placeholder in §7.5 ready to seed; replace before public-tenant rollout)
- Privacy Policy copy drafted to §7.3 structure — Rebekah + UBC comms partner (placeholder in §7.5 ready to seed; replace before public-tenant rollout)
- Author-quote verification: ~30 production-ready quotes — Rebekah (`05_author_quotes_starter.md` is the working log; final list moves to §6 after verification, then `05` archives)
- Email template HTML implementation per `06_email_design_brief.md` — Claude Code

**Out of scope for this doc (lives elsewhere):**
- Launch announcement email — Rebekah sends from her own email post-build; full draft in `14_launch_adoption_plan.md`. Not a product feature.
- First-login orientation overlay — covered live by the kickoff session in `14_launch_adoption_plan.md`; no in-product overlay in v1 (§1 documents the decision).
- Admin UI labels (button text, tab labels, settings field names) — sensible defaults are fine; per §9 these are flexible.
- 404 / generic error pages — friendly defaults are fine; not load-bearing.
- Witnessing-vs-gratitude survey question — correctly lives in `13_measurement_validation_plan.md` (it's a TypeForm survey, not product copy).

---

## Change log

| Date | Change |
|---|---|
| 2026-06-05 | Chunk 4 — auxiliary product copy filled in. §1 added: `/login` page (initial + post-submit states), device confirmation page ("Yes, this is me"), edit window countdown (3 variants + tooltip), empty states across 7 surfaces (library / personal shelf / team shelf / badges / pickup indicator / leaderboard cards), account deletion confirmation modal, restore account confirmation page, `/celebrate` form validation messages (5 sample variants). First-login orientation explicitly decided as out of scope for v1 (kickoff session covers it). §3.14 added: `magic_link_login` email (NextAuth-managed, not in `email_template` table) — serves as both first-time-welcome and returning sign-in. §9 "Out of scope" list expanded with admin UI labels, 404/error pages, survey question. |
| 2026-06-05 | §7.5 added: placeholder T&C + Privacy Policy drafts written to §7.2 / §7.3 structures. Both include the 4 required disclosures from §7.1, use plain language, follow UBC editorial style, and are ready to seed into `static_content` at deploy. UBC comms partner replaces both with legal-reviewed versions before public-tenant rollout. Variables to fill at seed: `[DATE TBD]`, `[contact-email-TBD]`. |
| 2026-06-05 | Chunk 3: §7 expanded with T&C section structure (§7.2), Privacy Policy section structure (§7.3), and drafting notes for UBC comms partner (§7.4). Required disclosures preserved in §7.1. Sync tasks complete: ADD §4 `email_template` enum updated to 13 types (added `account_deletion_grace_period`); ADD §7 `PRODUCT_COPY` code example em-dashes corrected to unspaced form (matches §1 canonical strings). ADD bumped to rev 1.6. |
| 2026-06-05 | Pruned §8 Launch announcement — not product content (Rebekah sends from her own email post-build, no system row, no admin UI). Draft moved to `14_launch_adoption_plan.md`. Renumbered §9 → §8 and §10 → §9. Added "Out of scope" note in §9 to make the doc boundary explicit. |
| 2026-06-05 | UBC editorial style applied throughout. §1 locked copy + §3 email templates (13 types) + §4 prompt rotation pool (8 prompts) + §7 T&C disclosures complete. §2 marketing copy + §5 nine badge stories drafted. §6 author quotes architecture noted: `05` is the verification working log; final list moves into §6 post-verification. Spec-mode cleanup applied: stripped chunked-update annotations and decision rationale (the latter lives in `15_decision_log.md`). Tone-pass on Rebekah's edits: "What it is" + "Why I built this" rewritten by Rebekah; tone extended to positioning intro + Sign in CTA. **AG ritual is Wednesday, not Friday — factual correction propagated through §2.** Cascade complete: `14_launch_adoption_plan.md`, `13_measurement_validation_plan.md`, and PRD exec summary + change log all corrected. `15_decision_log.md` already day-agnostic ("meeting-time kudos"). All remaining Friday mentions across the doc set are system cron schedules (top-giver, prompt-admin-reminder, kudos-was-read-digest) and remain unchanged. |
| 2026-06-04 | Initial extraction from PRD §14 / §5 / scattered Decision Log entries during restructure pass. |
