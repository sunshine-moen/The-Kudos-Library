# Email Design Brief — The Kudos Library

**Audience for this brief:** Rebekah (you), leading the creative.
**Purpose:** define what the email templates need to do, so you can design the HTML in your voice.
**Builds on:** PRD §14 (email rules), `03_design_intent.md` (visual system), `05_author_quotes_starter.md` (footer content).

This document covers three things:
1. **Design spec** — constraints, structure, brand alignment, technical rules of HTML email
2. **Per-template brief** — purpose, recipient, trigger, variables, starter copy (revise freely)
3. **Variable enumeration** — formal list per template (for the build phase)

---

## Part 1 — Design Spec

### Brand alignment

Every email reads as "a letter from the Library." It should feel:
- **Warm** — like opening a card, not a SaaS notification
- **Library-themed** — cozy British library palette (maroons, greens, navy, browns + cream/warm off-white background)
- **Illustrated, not photographic** — header art is illustration; matches the style direction in `03_design_intent.md`
- **Quietly literary** — typography evokes a beautifully-set page; footer quote treats the author with respect

Avoid: generic SaaS gradients, overly clean sans-serif, "growth tool" energy.

### Anatomy (consistent across all 7 templates)

```
┌──────────────────────────────────────┐
│  HEADER (illustration + title)       │  ~600 × 200px illustration
├──────────────────────────────────────┤
│                                      │
│  GREETING                            │  "Hi {{recipient_first_name}},"
│                                      │
│  BODY                                │  Template-specific copy
│                                      │
│  PRIMARY CTA BUTTON                  │  Styled link/button
│                                      │
│  CLOSING                             │  "— The Kudos Library"
│                                      │
├──────────────────────────────────────┤
│  AUTHOR QUOTE BLOCK                  │  Italicized quote
│  "..." — Author Name                 │  + attribution + (optionally) source
├──────────────────────────────────────┤
│  FOOTER                              │  Tiny: app name, link to library, FIPPA note
└──────────────────────────────────────┘
```

### Variable header art (one per template type)

Each of the 7 templates gets its own header illustration so emails feel distinct at a glance. Suggested motifs:

| Template | Header art motif |
|---|---|
| recipient_notify | A glowing new book on a shelf — "fresh from the bindery" |
| manager_digest | A reading desk with a stack of opened books |
| manager_quiet_week | A quiet shelf with the cat napping in the window |
| top_giver_announcement | A library card with name + date stamps, gilded |
| badge_milestone | The specific badge's book spine (Atwood, Robinson, etc. — each badge has its own visual asset per §11) |
| inactive_nudge | An open book on an empty chair, light through window |
| broadcast | Library scene — wide, generic, suited to any announcement |

These can ship as inline-embedded or hosted images. Recommend hosting (smaller email size; reusable).

### Technical rules of HTML email (please respect these or the templates will break)

- **Use HTML tables for layout.** Modern CSS Grid/Flexbox doesn't work reliably in email clients. This feels archaic but is the only path that works in Outlook, Gmail, Apple Mail, etc.
- **Inline CSS only** in production. (Tools like MJML compile from a cleaner syntax to inline CSS; that's fine to draft in.) No external stylesheets.
- **Web-safe fonts** in the body (system stack). For the headline/serif look, use a font stack like `Georgia, 'Times New Roman', serif` — actual custom fonts won't render in most clients.
- **Images need fallbacks.** Always set `alt` text on every image (accessibility AND for clients that block images by default). Use background colors for any area where an image might fail to load.
- **Dark mode considerations.** Some clients (Apple Mail, Outlook) auto-invert light backgrounds. Test that the maroon/cream palette survives. May need `@media (prefers-color-scheme: dark)` overrides for hero images.
- **Mobile responsive.** Even though the app is desktop-only, emails get read on phones. Use a single-column layout under 480px. Buttons need to be tap-target sized (≥44px tall).
- **Width:** 600px outer table. 540px content width. Standard.
- **Author quote block** should be visually distinct from the body — italic, slightly indented, perhaps with a left-border accent in maroon.
- **Footer:** tiny gray text. Library logo + link + a single line of FIPPA-required notice ("You're receiving this because you're a member of the [team] library. Reply or visit your profile to change your preferences.").

### Tooling suggestion

If you don't already have an email template tool you love:
- **MJML** (free, open-source) — compiles cleaner JSX-like syntax into bulletproof HTML email. Designer-friendly.
- **Maizzle** — Tailwind for email; nice if you want a more design-system-aligned workflow.
- **Stripo** or **Beefree** — drag-and-drop builders; lower control but very fast.

Whatever you produce becomes the seed for `email_template.body_html` per row in the DB. Variables use `{{double_braces}}` (see Part 3).

---

## Part 2 — Per-Template Brief + Starter Copy

Each template here lists: **purpose**, **recipient**, **trigger**, **tone notes**, and **starter copy** (revise to your voice). Variables in `{{double_braces}}`.

### 1. `recipient_notify` — "Someone thinks you're great"

**Recipient:** the person who just received a kudos (individual or team).
**Trigger:** kudos submission (fires immediately).
**Tone:** warm, intriguing, NOT containing the kudos text itself (drives clicks).

**Subject line:** Someone thinks you're great
**Header art:** "a glowing new book on a shelf"

**Body copy (starter):**
```
Hi {{recipient_first_name}},

A new book just landed on your shelf in the Kudos Library.
Come see who's been celebrating you.

[ Read it here → ]      ← {{deep_link_url}}, magic deep-link auto-signs in

— The Kudos Library
```

**Variant for team kudos** (`team_recipient_id` was set instead of `recipient_id`):
```
Hi {{recipient_first_name}},

A new book just landed on the {{team_name}} team shelf in the
The Kudos Library. Someone is celebrating the whole team —
come see what they wrote.

[ Read it here → ]
```

---

### 2. `manager_digest` — Weekly/biweekly digest (non-empty)

**Recipient:** the manager.
**Trigger:** scheduled per manager's `digest_cadence`, when ≥1 direct-report kudos in the window.
**Tone:** celebratory, skimmable, links each kudos to its book.

**Subject line:** {{kudos_count}} new books on your team's shelves this {{period_label}}
**Header art:** "a reading desk with a stack of opened books"

**Body copy (starter):**
```
Hi {{manager_first_name}},

Your team has been busy celebrating each other. Here's what
landed on their shelves between {{period_start}} and {{period_end}}:

{{#kudos_list}}
  ┌──────────────────────────────────────────┐
  │ For: {{recipient_name}}                  │
  │ From: {{giver_name}}                     │
  │                                          │
  │ "{{message_text}}"                       │
  │                                          │
  │ [ Open this book → ]    ← {{deep_link_url}} │
  └──────────────────────────────────────────┘
{{/kudos_list}}

That's {{kudos_count}} celebration{{#plural}}s{{/plural}} this {{period_label}}.

Want to add your own? [ Go to the library → ]   ← {{app_url}}

— The Kudos Library
```

---

### 3. `manager_quiet_week` — Empty-period digest

**Recipient:** the manager.
**Trigger:** scheduled per manager's `digest_cadence`, when zero direct-report kudos in the window.
**Tone:** gentle nudge, not guilt-inducing. Models leadership behavior.

**Subject line:** A quiet {{period_label}} in your team's library
**Header art:** "a quiet shelf with the cat napping in the window"

**Body copy (starter):**
```
Hi {{manager_first_name}},

The team library is a little quiet between {{period_start}} and
{{period_end}} — no new books on the shelves.

Get things moving by submitting some kudos of your own. Even one
celebration tends to bring more.

[ Open the library → ]    ← {{app_url}}

— The Kudos Library
```

---

### 4. `top_giver_announcement` — Weekly leaderboard winner notification

**Recipient:** the Rank-1 giver for the just-completed week.
**Trigger:** weekly cron at the admin-configured send time (default Fridays 15:00 PT).
**Tone:** delighted, library-card-vintage feel; celebrates THE behavior of giving.

**Subject line:** You're this week's Top Giver in the library
**Header art:** "a library card stamped with name + date"

**Body copy (starter):**
```
Hi {{winner_first_name}},

This week — {{period_start}} to {{period_end}} — you topped the
library's giving leaderboard with {{kudos_count}} kudos
submitted. That's {{kudos_count}} moments where you took time
out of your week to celebrate someone else.

Thank you for keeping the library full and the team feeling seen.

[ Open the library → ]    ← {{app_url}}

— The Kudos Library
```

---

### 5. `badge_milestone` — Private badge celebration

**Recipient:** the awardee only.
**Trigger:** crossing a badge threshold (count milestone OR streak).
**Tone:** sincere, story-rich. The body is the badge's `description` from the badge_definition table — already written per §14.

**Subject line:** A milestone in the Kudos Library — the {{badge_name}}
**Header art:** the specific badge's `visual_asset` (the badge's book spine)

**Body copy (starter — for the Atwood Accolade as example; each badge has its own story stored in `badge_definition.description`):**
```
Hi {{awardee_first_name}},

You've just given your {{milestone_count}} kudos.

That's {{milestone_count}} moments where you took the time to
celebrate someone on your team.

You've earned the {{badge_name}}.

{{badge_story}}

— The Kudos Library
```

The `{{badge_story}}` variable pulls the full narrative (Atwood's sustained-discipline story, Robinson's BC-community story, etc.) from `badge_definition.description`.

---

### 6. `inactive_nudge` — Pay-it-forward reminder

**Recipient:** users who have given zero kudos in the admin-configured threshold window (default 14 days), and are NOT marked `on_leave`.
**Trigger:** scheduled per admin threshold.
**Tone:** gentle, non-shaming, framed as "your turn to add to the library."

**Subject line:** The library misses your voice
**Header art:** "an open book on an empty chair, light through window"

**Body copy (starter):**
```
Hi {{user_first_name}},

It's been {{days_inactive}} days since you last added a book to
the library.

Someone on your team probably did something great in that time
that's worth celebrating. Take a minute to recognize them.

[ Give a kudos → ]    ← {{app_url}}/give

— The Kudos Library
```

---

### 7. `broadcast` — Manual admin/manager/unit-leader announcement

**Recipient:** custom audience (selected at send time).
**Trigger:** manual.
**Tone:** depends on context — admin authors per send.

**Subject line:** {{custom_subject}}
**Header art:** "library scene — wide, generic"

**Body copy (starter):**
```
Hi {{recipient_first_name}},

{{custom_body_html}}

— {{sender_first_name}}, on behalf of the Kudos Library
```

The admin types the body in the Templates tab editor at send time. Author quote still appears in footer.

---

## Part 3 — Variable Enumeration (for the build phase)

This is the canonical list of `{{variables}}` available per template. The build (PRD §15 step 7) implements these as Mustache-style substitutions resolved at send time.

### Variables available in EVERY template

| Variable | Source | Notes |
|---|---|---|
| `{{recipient_first_name}}` | team_member.first_name | The email recipient's first name |
| `{{author_quote.text}}` | author_quote.quote_text | Footer quote, selected per send |
| `{{author_quote.author}}` | author_quote.author_name | Quote attribution |
| `{{author_quote.source}}` | author_quote.source_work | Nullable; rendered if present |
| `{{app_url}}` | env config | The library's base URL |
| `{{current_year}}` | computed | For footer copyright if used |
| `{{library_logo_url}}` | static asset | Header/footer logo |

### Template-specific variables

| Template | Variables (in addition to common) |
|---|---|
| `recipient_notify` (individual) | `{{deep_link_url}}` (single-use magic deep-link to the book) |
| `recipient_notify` (team) | `{{team_name}}`, `{{deep_link_url}}` |
| `manager_digest` | `{{manager_first_name}}`, `{{period_start}}`, `{{period_end}}`, `{{period_label}}` ("week"/"two weeks"), `{{kudos_count}}`, `{{kudos_list}}` (iterable: `{recipient_name, giver_name, message_text, deep_link_url, book_design, font_choice}` per item) |
| `manager_quiet_week` | `{{manager_first_name}}`, `{{period_start}}`, `{{period_end}}`, `{{period_label}}` |
| `top_giver_announcement` | `{{winner_first_name}}`, `{{period_start}}`, `{{period_end}}`, `{{period_label}}` ("week"), `{{kudos_count}}` |
| `badge_milestone` | `{{awardee_first_name}}`, `{{badge_name}}`, `{{badge_story}}` (from badge_definition.description), `{{badge_visual_url}}` (from badge_definition.visual_asset), `{{milestone_count}}` (e.g., "50th") |
| `inactive_nudge` | `{{user_first_name}}`, `{{days_inactive}}` |
| `broadcast` | `{{custom_subject}}`, `{{custom_body_html}}`, `{{sender_first_name}}` |

### Variable conventions

- Variables resolved server-side at send time, NOT in the email client.
- Plain-text fallback rendered for accessibility (Resend handles automatically from HTML).
- All user-input fields (e.g., `message_text` in the digest) HTML-escaped to prevent XSS.
- All `{{variables}}` must resolve; missing variables fail loudly during template editing (Templates tab editor validates and shows the variable list).
- Date/time variables rendered in `America/Vancouver`, in a friendly format ("May 22 – May 28" not "2026-05-22T00:00:00Z").

---

## What "done" looks like for this brief

1. You produce **7 HTML email designs** (one per template type) reflecting the library aesthetic and respecting the technical rules in Part 1.
2. Each design carries the variables in Part 3 as `{{double_braces}}`.
3. Each design uses the starter copy in Part 2 as a baseline (revise in your voice).
4. Designs delivered as `.html` or `.mjml` files, one per template.
5. Header art (7 illustrations) delivered as hosted image URLs or embedded base64.
6. Designs land in PRD §15 step 7 (build phase), seeded into `email_template` rows at deploy.

When you're ready to start designing, ping me and I can help with: validating variables resolve correctly against the schema, drafting a single example HTML for a chosen template to anchor the style, or recommending specific tooling once you tell me what you usually work in.
