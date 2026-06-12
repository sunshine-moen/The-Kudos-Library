# Measurement & Validation Plan — The Kudos Library

**Purpose:** Defines what success looks like, how it's measured, what counts as failure to intervene, the witnessing-trigger validation survey, and the contingency rule for if engagement doesn't form.

**Audience:** Rebekah (week-4 / week-8 / week-12 check-ins) + the v1.5 pilot lead.

**Status:** Extracted from PRD §7 (behavioural criteria + contingency) on 2026-06-04 as part of the PRD restructure. **Targets recalibrated for the Mural-migration scenario** (the curve changes when an existing habit is hijacked rather than built from scratch — see §14 Launch & Adoption Plan).

---

## What we're validating

The product makes two distinct bets:

1. **Value bet (already validated):** the team wants to recognize peers. Three years of Mural + meeting kudos is the evidence. Migrating that habit to the library doesn't re-test this bet; it carries it forward.

2. **Trigger bet (the unvalidated hypothesis):** kudos can shift from a *scheduled, meeting-triggered ritual* to an *ad-hoc, witnessing-triggered habit*. This is what the Kudos Library is actually testing. If this bet fails, the team still gets a record-keeping system (better than Mural for export, search, and history), but loses the celebration moments that happen between meetings — which is the whole point of moving off Mural.

Every metric below is in service of distinguishing these two bets. Compliance (people use the tool because it replaced the old tool) is not the same as habit formation (people give kudos because they noticed something).

---

## Primary metric: unprompted-giver rate

**Definition:** % of kudos given more than 24 hours after the giver's most recent product-initiated email touch (digest, nudge, prompt-of-the-week, anniversary reminder, top-giver, badge milestone, broadcast). If a kudos arrives within 24h of any of those, count as externally triggered; otherwise unprompted.

### Migration-scenario recalibration (REVISED 2026-06-04)

The original PRD targets were modeled for a cold-start product (no prior habit). The Kudos Library doesn't cold-start — it inherits a 3-year-old habit anchored to a scheduled trigger (the Wednesday team meeting + Mural). When that trigger is retired (see `14_launch_adoption_plan.md`), the curve changes:

- **Weeks 1–2: HIGHER than cold-start.** Migration energy + novelty + retained ritual memory. Expect total kudos volume to run above what a cold-start product would see.
- **Weeks 2–6: THE RISK WINDOW.** Meeting-triggered kudos die when the meeting ritual ends. Witnessing-triggered kudos haven't yet formed as a habit. This is when a real dip can show. Watch this window most carefully — it's the test.
- **Weeks 6–12: RECOVERY.** If witnessing is forming, unprompted-giver rate rises here. If not, the dip persists or deepens.
- **Months 4–6: STEADY STATE.** Whatever the rate is at month 4 is likely where it stays. Major surgery (re-evaluate via the contingency rule) is the response at this point, not minor tuning.

### Targets (recalibrated for migration scenario)

| Period | Target unprompted-giver rate | Watch for |
|---|---|---|
| Weeks 1–2 | 10–20% (mostly migration-driven; many givers acting on residual meeting habit) | Total volume should run high. If it doesn't, the migration messaging didn't land — see Launch Plan retro. |
| Weeks 3–6 | **15–30% (the risk window)** | Total volume should dip; that's expected. Unprompted-giver rate should hold or slowly climb. A SHARP drop in unprompted-giver rate (below 10%) here = witnessing isn't forming and the ritual is dying. |
| Weeks 7–12 | 35–55% | The recovery climb. If unprompted-giver rate isn't climbing by week 8, intervene before week 12. |
| Months 4–6 | 55%+ sustained | Steady-state. Below 50% sustained = the contingency rule reopens the no-points decision. |

**Floor (any week, after week 6): unprompted-giver rate < 10% → intervene.** Don't wait for the quarter to end. Three consecutive weeks below 10% triggers the contingency investigation.

### What counts as "unprompted" — the team-meeting question (RESOLVED 2026-06-04; v1/v1.5 split clarified 2026-06-05)

The original 24-hour rule was designed around product-initiated email touches. With the Mural ritual retired, a real question surfaces: **does a kudos given during or right after the AG Wednesday team meeting count as unprompted?**

**Resolution: no — treat the team meeting as an external trigger, equivalent to a nudge email.** A kudos written during the meeting is, in the relevant sense, a meeting-triggered kudos — same as the Mural-era pattern. Counting it as unprompted would inflate the rate and hide the real adoption story.

**Implementation — v1 (AG only):** *manual analytics adjustment.* Rebekah computes unprompted-giver rate two ways when reviewing weekly metrics:
1. **Email-touch exclusion only** (the system-computed version) — kudos given >24h after any product-initiated email touch.
2. **Email-touch + meeting-window exclusion** (the manual adjustment) — additionally subtract kudos submitted Wed 09:00 PT through Thu 09:00 PT (the 24-hour window around AG's Wednesday meeting end time).

Both versions get logged in the reporting cadence. The manual version is the metric of record for week-12 contingency decisions; the system version is the floor (still useful as a coarse signal).

**v1.5 readiness:** when multi-tenant ships, each pilot tenant will have its own meeting day. Implementing the meeting-window exclusion in code requires a `team_settings.team_meeting_day` (enum: Mon/Tue/Wed/Thu/Fri or NULL) + `team_settings.team_meeting_end_local_time` field. Add to ADD §4 schema as part of v1.5 prep, not v1. (See open items below.)

---

## Secondary metrics

- **Time-of-day distribution of submissions.** Externally triggered kudos cluster around digest/email send times AND around Wednesday-meeting time. Internally triggered kudos spread across the workday. The distribution should *flatten* over time. A persistent spike at digest+30min or at meeting+30min at month 3 = trigger hasn't internalized.
- **Cross-team rate.** Witnessing happens across team boundaries more than within. Rising BB→OPS / IF→SA / etc. = witnessing trigger forming. A flat or in-team-dominated rate = gratitude still doing most of the work, OR the witnessing trigger is forming only within close-collaboration pockets.
- **Nudge conversion rate over time.** Should DECREASE — counterintuitive but right. If the prompt-of-the-week stops converting because people are giving on their own before Wednesday, that is a success signal.
- **Top-giver volume distribution.** Long tail of 3–5 kudos/week per habitual giver = real habit. Flat distribution where everyone gives ~0.5/week = compliance, not habit.
- **Manager digest open rate.** ≥60% by week 4 (manager habit; separate from giver habit).
- **Kudos-read rate.** % of recipient_notify emails that result in a `kudos_read` row within 7 days. Target ≥60% by week 4. A persistently low read-rate (≤30%) signals the recipient_notify subject or magic-link UX isn't working.

## Anti-metrics — things that would look like success but aren't

- Total kudos volume during a nudge-heavy week (compliance, not habit).
- Active-giver rate measured the same week as a campaign push.
- Manager digest open rate alone (manager habit ≠ giver habit).
- High volume in weeks 1–2 (migration energy, not formed habit).
- High volume from a small number of habitual givers (looks healthy in aggregate; masks a thin tail).

---

## Witnessing-vs-gratitude validation survey

**When:** weeks 4–6 post-launch. Single window; don't repeat in v1 (the validation either resolves it or it doesn't).

**Audience:** the full AG team. Anonymous response (the question type is sensitive enough that named responses would bias toward giving the "right" answer).

**Single question:**
> Think about the last kudos you wrote — what had just happened?

Free-text response, ≤300 chars. The team is small enough that ~10–15 responses are achievable.

**Coding rubric** (Rebekah + one other reader, independent coding then reconcile):
- **Witnessing-coded** language: "I saw," "I noticed," "I watched [X] do," "happened to overhear," "was on a call when," "caught a moment."
- **Gratitude-coded** language: "they helped me," "I appreciated," "thanks to them I," "saved me from," "without them I."
- **Mixed / unclear:** anything that combines or doesn't clearly map.

**Decision rule:**
- **Witnessing ≥ 60% of clear-coded responses** → the trigger hypothesis holds. No content revision.
- **Witnessing 40–60%** → mixed signal. Watch the cross-team rate and time-of-day distribution; revisit at week 8 with a follow-up question.
- **Gratitude ≥ 60% of clear-coded responses** → trigger hypothesis overturned. Content plan kicks off a copy revision pass (recipient_notify subject, prompt-of-the-week language, recipient onboarding moment, hero copy) within 2 weeks. The measurement framework continues regardless.

**Note on bias:** the team will be aware that the product was framed around witnessing. Some respondents will say what they think Rebekah wants to hear. The anonymity helps, but interpret narrowly — if gratitude language wins even given the bias toward witnessing answers, the signal is real.

---

## Contingency rule (REVISED — investigate, don't add nudges)

**Trigger conditions** (any of):
- Unprompted-giver rate is flat or declining after week 12.
- Average kudos-per-member-per-week falls below 0.3.
- Nudge dependence persists at month 3 (nudge conversion rate hasn't decreased).

**Response: don't add more nudges. Investigate first.** Specific diagnostic questions:

1. **Is the prompt language wrong (witnessing vs gratitude framing)?** Check against the week-4 survey results.
2. **Is the submit flow too slow to catch a witnessed moment before it evaporates?** Consider moving email-to-kudos (currently v1.1 roadmap) into v1.0.1.
3. **Is the cross-team witnessing pattern actually present in AG culture or did we assume it?** Look at cross-team rate vs in-team rate.
4. **Did the week-4 survey validate witnessing as the trigger, or did gratitude win?** If gratitude won, reframing of recipient_notify subject + prompts may be needed.
5. **Is the recipient-onboarding teaching moment landing or being skipped** (low first-kudos-read engagement)?
6. **Did the Mural migration go through cleanly, or did people keep giving meeting kudos in informal channels** (Slack, Teams, hallway)? If kudos splintered to other surfaces, the library competes with shadow channels instead of replacing the dead ritual.

Then act on the answer (likely: copy revision, surface placement changes, or pulling email-to-kudos forward — NOT more nudges). 2-week sprint owned by product owner.

**If not recovered above 50% within 4 weeks of intervention → reopen the no-points decision** (see `15_decision_log.md`).

---

## Reporting cadence

| When | What | Audience |
|---|---|---|
| Week 1 (post-launch) | Volume + active-giver rate + manager digest open rate | Rebekah only (sanity check) |
| Week 2 | Same + watch-for risk-window onset | Rebekah only |
| Week 4 | Full metric set + week-4 survey distribution + initial trigger-codings | Rebekah |
| Week 6 | Survey results coded + risk-window review (did the dip happen? recover yet?) | Rebekah |
| Week 8 | Full retro: are we tracking toward week-12 targets? Anything to intervene on now? | Rebekah + (informally) AG team via library culture moment |
| Week 12 | Quarter retro: contingency rule evaluation. Either keep going OR open the investigation sprint. | Rebekah; if investigation triggers, broader |
| Month 6 | Steady-state assessment. Does v1 graduate to v1.5 prep? | Rebekah; informs v1.5 timing |

Live dashboard (Plausible + custom queries) accessible to Rebekah at any time, but the structured review cadence above is what drives decisions.

---

## Open items

- **`team_settings.team_meeting_day` + `team_meeting_end_local_time` schema fields (v1.5 readiness).** v1 uses manual analytics adjustment for the meeting-window exclusion in unprompted-giver rate (see "What counts as 'unprompted'" above). v1.5 multi-tenant needs these fields so each pilot tenant's analytics pipeline can compute the meeting-window exclusion automatically. Add to ADD §4 schema as part of v1.5 prep. Owner: product lead (Rebekah) to confirm + Claude Code to implement.

---

## Change log

| Date | Change |
|---|---|
| 2026-06-05 | "What counts as unprompted" v1/v1.5 split clarified: v1 uses manual analytics adjustment for the meeting-window exclusion; v1.5 needs `team_settings.team_meeting_day` + `team_meeting_end_local_time` schema fields. Open item added. |
| 2026-06-04 | Extracted from PRD §7 (behavioural success criteria + contingency rule). **Targets recalibrated for the Mural-migration scenario** — original targets assumed cold-start; the actual launch hijacks an existing habit. New targets account for the expected weeks 1–2 high → weeks 2–6 risk window → weeks 7–12 recovery curve. **Resolved:** kudos given during/within 24h of the team meeting count as externally triggered (meeting acts as an external trigger equivalent to a nudge email). **Added:** kudos-read rate as a secondary metric, week-1 / week-2 reporting cadence (didn't exist in original), Mural-migration question (#6) added to contingency diagnostic. **Added:** witnessing-vs-gratitude survey coding rubric + decision rule + bias note. Cross-references to `14_launch_adoption_plan.md` (migration context) and `15_decision_log.md` (decisions that get reopened if the contingency triggers). |
