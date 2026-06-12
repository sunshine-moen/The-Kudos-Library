# Launch & Adoption Plan — The Kudos Library

**Purpose:** This is the adoption strategy, not a logistics checklist. The Kudos Library's biggest risk is behavioural (will giving stick without prompting?). The strongest mitigation isn't in the email-nudge system or the badge mechanics — it's the decision to **retire the existing ritual (Wednesday team meeting + Mural board) and redirect its trigger to the library**. This doc captures the framing, the comms, the seeding work, and what to watch in the migration window.

**Audience:** Rebekah, in her role as AG unit lead executing the launch.

**Reading order:** read this AFTER the PRD and BEFORE the Measurement Plan (`13_measurement_validation_plan.md`). The measurement targets are recalibrated for the migration scenario described here.

**Status:** New doc, created 2026-06-04 as part of the PRD restructure. Synthesizes prior PRD §15 launch checklist items + new strategic framing about Mural retirement as adoption mechanism.

---

## The migration thesis

The team has a 3-year habit of giving kudos. The habit is anchored to a **scheduled trigger** (the Wednesday team meeting, with Mural as the surface where kudos accumulate). The Kudos Library is asking the team to shift to a different kind of habit — **ad-hoc, asynchronous, witnessing-triggered submission**.

Two paths existed for this transition:

1. **Run both surfaces in parallel.** Keep Mural + the meeting kudos ritual. Add the library as a new option. Hope people gravitate toward the library because it's better. Risk: kudos splinter across two venues; managers lose the complete record; the new trigger never has to form because the old one's still there.

2. **Retire the old; redirect the trigger.** Close Mural, end the meeting kudos ritual, point the existing habit-energy at the new home. Risk: a real adoption dip in weeks 2–6 when meeting-triggered kudos die before witnessing-triggered ones have formed.

**The decision (2026-06-04): path 2.** Mural retired without data migration; the Wednesday meeting kudos ritual ends; the library is announced as the replacement. Recorded in `15_decision_log.md`.

**Why path 2:** path 1 is comfortable but the new trigger likely never forms because the old venue is still there absorbing the habit-energy. Path 2 is harder but it's the only one that actually tests the witnessing hypothesis. The team isn't being asked to *try* a new behavior — they're being asked to relocate an existing behavior to a better home, with a different cadence and a different trigger. That's a smaller ask than building a habit from scratch.

---

## What the old habit proves vs. doesn't

Three years of Mural + meeting kudos validates two things and doesn't validate a third. The launch comms should not conflate these.

**Validated by the existing habit:**

- **The value.** The team wants to recognize peers. There's no doubt about whether kudos matter to AG culture — they do, and they have for years.
- **The cultural fit.** Public recognition of colleagues is something AG does naturally, doesn't bristle at, and protects time for. Other teams might find this performative; AG doesn't.

**NOT validated by the existing habit:**

- **The new trigger.** Witnessing — the moment you see a colleague do something good and feel an urge to mark it — has not been tested as a trigger in this team. The old habit was prompted by the meeting (scheduled, social, with everyone present). The new habit asks people to notice + act in the moment, alone, without a meeting-shaped prompt. This is the unvalidated hypothesis the week-4 survey tests (see `13_measurement_validation_plan.md`).

**Why this distinction matters for launch comms:** the message is not "try this new thing we built." It's *"the celebration ritual you've been doing for three years deserves a better home — here it is."* The first framing puts the burden on the team to validate a new thing. The second framing acknowledges what they've already proven.

---

## Expected adoption curve (and the risk dip)

Cold-start products have a known curve: low at first, then either climb or plateau. The Kudos Library doesn't cold-start. It inherits energy. The curve looks different:

```
Volume
  │
  │      ╱╲                                        
  │     ╱  ╲ ╱╲                                    
  │    ╱    V  ╲                                   
  │   ╱        ╲___ ___ ___ ___                    
  │  ╱             V              ← steady state
  │ ╱                                              
  │╱                                               
  └──────────────────────────────────────── weeks
   1  2  3  4  5  6  7  8  9 10 11 12

  ↑          ↑                ↑
  Migration  THE RISK WINDOW   Recovery + steady state
  energy     (meeting-kudos    (if witnessing has formed)
             dying;
             witnessing not
             yet formed)
```

- **Weeks 1–2: migration spike.** Novelty + retained ritual memory + admin seeding. Volume runs HIGH compared to a cold-start product. **Don't celebrate the spike.** It's migration energy, not formed habit.

- **Weeks 2–6: THE RISK WINDOW.** Meeting-triggered kudos die when the meeting ritual ends. Witnessing-triggered kudos haven't yet formed as habit. Volume dips. This is normal and expected. **Unprompted-giver rate is the metric to watch in this window** — total volume will be down, but if unprompted-giver rate is holding or climbing, the right trigger is forming.

- **Weeks 6–12: recovery.** If witnessing is forming, both volume and unprompted-giver rate climb. If not, the dip persists.

- **Months 4–6: steady state.** Whatever the rate is at month 4 is approximately where it stays. Intervene before month 4 if the trajectory is wrong.

**Who watches the dip:** Rebekah. **Floor before intervening:** unprompted-giver rate < 10% for 3 consecutive weeks after week 6 (see `13_measurement_validation_plan.md` for full contingency rule).

---

## Launch sequence

### Pre-launch (weeks before)

1. **Quiet pre-comms to direct reports** (~2 weeks before launch). Rebekah explains the change in 1:1s: "we're moving the Wednesday kudos to a new tool. Same celebration; better home; less meeting time. I want your help making it land." Gets the layer of people who matter most onboard before the broader announcement.

2. **Admin setup** (in staging). 12 values seeded. 6 context categories. 10 prompts. Roster imported (active team_members in AG). ≥2 admins designated. Featured prompt scheduled for launch week. Marketing page populated. Email templates reviewed.

3. **Author-quote starter set verified** (see `05_author_quotes_starter.md`). Each quote checked against primary source. Anything unverifiable cut.

4. **Email templates reviewed in staging.** All 12 types rendered with sample data. Tone-pass on the badge_milestone email. Author-quote footer rendering correctly.

5. **Marketing page live-rehearsal.** Page renders on staging. Built-for-UBC section includes AG's culture statement (Learning / Connection / Innovation / Agility / Kindness / Get 'er done). Hero copy correct.

6. **Production launch gate verification.** ≥2 admins active in production. App refuses initialization if not.

### Launch week

1. **Announcement email** sent to AG (day before kickoff) from Rebekah's own email account. Sent personally, not by the product — this is adoption comms, not a system email. Voice: plain Rebekah, warm. ~310 words. Beats to hit (in order): acknowledge the existing Wednesday ritual; name the change; the 'why' (meeting time back + real history of who's celebrated who); frame as "same celebration, better home" — not a new ask; trigger reframe (notice in the moment, not waiting for the meeting); what to expect this week (kickoff + opt-outs + first prompt); close in Rebekah's voice.

   **Draft (for Rebekah to edit):**

   **Subject:** `What's changing for our Wednesday kudos`

   **Body:**

   > Hi everyone,
   >
   > For three years, our Wednesday kudos ritual has been one of the best parts of how we work. This week, we're giving it a better home.
   >
   > The Kudos Library is a private web app for AG—a place where the kudos we write each other are kept as books on shelves, instead of stickies on a board that gets cleared.
   >
   > Two reasons for the change.
   >
   > First, we get the Wednesday meeting time back. The kudos agenda item is ending. The celebration isn't.
   >
   > Second, the library keeps a real history of who's been celebrated for what. It accumulates. It's something we build together over time. The Mural board never had that.
   >
   > The library is also built for noticing things in the moment, instead of waiting for Wednesday. If you see a colleague do something good—help out, share what they know, stay steady—you can add to the library right then. You don't need to save it for a meeting.
   >
   > This Wednesday, we'll have a 60-minute kickoff session walking through how it works. Recorded for anyone who can't make it. The library goes live the same day.
   >
   > A few practical things:
   > - You'll get a welcome email with a magic-link login. No password to remember.
   > - Email opt-outs are in your profile. Pick the cadence you want.
   > - The first featured prompt for the week will be ready when you sign in.
   >
   > Same team, same celebration, new home.
   >
   > Looking forward to seeing what we keep together.
   >
   > Rebekah

2. **60-minute kickoff session.** Live walkthrough: the values list, why kudos matter (and why we're keeping the celebration), how to give one, what "your books are being picked up" means, how email digests work, how to opt out of any of them. Recorded for absentees.

3. **First featured prompt published** the morning of kickoff (so demonstrating the product shows a real prompt, not a placeholder).

4. **The last Wednesday meeting kudos.** The Wednesday meeting BEFORE launch is the last one with kudos as a meeting agenda item. Frame it as a handoff moment — Rebekah closes the ritual explicitly: "this was meaningful, it's not ending, it's moving to a place that suits it better." Use the existing meeting time for whatever celebration-of-the-ritual feels right. Don't quietly stop; close it with intention.

5. **Library URL pinned in Teams channel + SharePoint site** (admin action, no engineering required). Visible without requiring people to remember a URL.

6. **First-week seeding.** Rebekah gives 3–5 kudos in launch week so the library isn't empty when people first visit. (Other admins should too, but Rebekah's the one who has to make sure it happens.)

### Week 1 office hours (1 week post-launch)

7. **30-minute office hours session** for follow-up Q&A. Anyone who couldn't make the kickoff, or who hit a question after using it. Lower-pressure than the kickoff; conversational. Recording optional.

### Week 4–6 validation

8. **Witnessing-vs-gratitude survey sent** (see `13_measurement_validation_plan.md`). Anonymous. Single question. ~15 responses expected.

9. **Survey coded and result recorded** in repo as `LAUNCH_VALIDATION.md`. Result drives any v1.0.1 copy revisions.

### Week 8 retro

10. **Internal retro** with Rebekah. Are we tracking toward week-12 targets? Anything to intervene on now? Is the dip recovering, persisting, or deepening?

---

## What to watch (and when to intervene)

| Signal | Window | Response |
|---|---|---|
| Volume below cold-start in weeks 1–2 | Week 1–2 | Launch comms didn't land. Retro: was the announcement compelling? Did the kickoff demo work? Don't pile on emails; address the comms. |
| Unprompted-giver rate < 10% for 3 weeks post-week-6 | Weeks 7–9 onward | Investigation sprint per contingency rule. Don't add more nudges. Diagnose first. |
| Cross-team rate stays flat (in-team-only) | Weeks 4 onward | Witnessing may only be forming within close-collaboration pockets. The Special Collections feature (v1.1 roadmap) may need to be pulled forward to surface cross-team activity. |
| Kudos splinter to Slack / hallway / shadow channels | Anytime | The migration wasn't a clean break. Rebekah asks the team directly + reinforces the library as the canonical channel. If chronic, reopen path-1 (parallel surfaces) as a backup — but only after attempting to fix the migration first. |
| Survey result: gratitude ≥ 60% | Week 4–6 | Trigger hypothesis overturned. Content plan revision (recipient_notify subject, prompts, hero copy) within 2 weeks. Measurement continues with the new framing. |
| Survey result: witnessing ≥ 60% | Week 4–6 | Hypothesis holds. No content revision. |

---

## Open items going into launch

These need to be resolved by Rebekah (or with content partners) before launch week, not during it.

1. **Final context categories list** — collaborative session with product owner (Rebekah).
2. **Marketing page copy** — including AG culture statement in Built-for-UBC section. Lives in `12_content_plan.md` as the canonical source.
3. **Terms of Service copy** — product owner + UBC comms partner.
4. **Privacy Policy copy** — product owner + UBC comms partner. Includes "Your Privacy" section on kudos removal requests.
5. **Author-quote starter set verification** — see `05_author_quotes_starter.md`.
6. **Email template HTML design** — see `06_email_design_brief.md`. 12 templates.
7. **Badge milestone email tone-pass** — lighten the Atwood Accolade and any treacly copy.
8. **Announcement email copy** — draft above in Launch week step 1. Rebekah edits to her voice and sends from her own email account.
9. **Witnessing-vs-gratitude survey draft** — ready to send week 4–6.

---

## What this plan deliberately does NOT include

- **Email-to-kudos** as a v1.0 feature. It's the strongest single candidate for v1.0.1 if the week-4 survey shows witnessing isn't forming on submission-flow timing alone. Build order keeps it in v1.x; this plan flags it as the pull-forward candidate.
- **Special Collections / cross-team browsing surface.** v1.1 roadmap. Mentioned in the watch-table above as a pull-forward candidate if cross-team rate stays flat.
- **Surprise / variable-reward badges.** v1.1 experiment, only if engagement plateaus. See `15_decision_log.md`.
- **Re-running validation in v1.5+.** Each pilot tenant gets its own witnessing-vs-gratitude survey window when they onboard. v1's validation is for AG.

---

## Change log

| Date | Change |
|---|---|
| 2026-06-05 | AG ritual day corrected: Wednesday, not Friday — applied throughout. Launch announcement email draft absorbed from `12_content_plan.md` (it's adoption comms, not product content). |
| 2026-06-04 | New doc. Synthesizes prior PRD §15 launch checklist items (kickoff session, office hours, validation survey) with new strategic framing about Mural retirement as the adoption mechanism. Captures: the migration thesis, what the old habit proves vs doesn't, expected adoption curve with the risk window called out, full launch sequence, what-to-watch table, open items. References `13_measurement_validation_plan.md` (recalibrated targets), `15_decision_log.md` (Mural-retired decision), and `12_content_plan.md` (marketing copy). |
