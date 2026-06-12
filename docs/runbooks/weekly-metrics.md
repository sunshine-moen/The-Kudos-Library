# Weekly Metrics Runbook — The Kudos Library

**Owner:** Rebekah Moen  
**Cadence:** Run Monday morning before the manager digest lands.  
**Primary reference:** `docs/launch/13_measurement_validation_plan.md`  
**Adoption context:** `docs/launch/14_launch_adoption_plan.md`

---

## Primary metric: unprompted-giver rate

The share of unique givers in a given ISO week who submitted kudos more than 24 hours after their last product-initiated email touch. This measures self-initiated giving independent of prompts.

**Contingency trigger:** If the unprompted-giver rate is <10% for 3 consecutive weeks after week 6, initiate the contingency investigation per `13_measurement_validation_plan.md`.

---

## SQL queries

All queries assume:
- `$tenant_id` = the AG tenant UUID (set as a psql variable or substitute inline)
- `$week_start` = Monday 00:00:00 PT (ISO week start, converted to UTC)
- `$week_end` = Sunday 23:59:59 PT (ISO week end, converted to UTC)

Use `date_trunc('week', now() AT TIME ZONE 'America/Vancouver') AT TIME ZONE 'America/Vancouver'` to generate `$week_start` dynamically.

---

### Query 1 — System-computed unprompted-giver rate

```sql
-- Unprompted-giver rate (system-computed, no meeting-window exclusion)
-- A giver is "unprompted" if they gave kudos > 24h after their last product email touch,
-- or if they have never received a product email.
WITH last_touch AS (
  SELECT DISTINCT ON (esl.recipient_user_id)
    esl.recipient_user_id,
    esl.sent_at AS last_email_at
  FROM email_send_log esl
  WHERE esl.tenant_id = $tenant_id
    AND esl.sent_at < $week_end
  ORDER BY esl.recipient_user_id, esl.sent_at DESC
),
givers_this_week AS (
  SELECT DISTINCT k.giver_id
  FROM kudos k
  WHERE k.submitted_at >= $week_start
    AND k.submitted_at < $week_end
    AND k.deleted_at IS NULL
    AND k.tenant_id = $tenant_id
),
giver_with_touch AS (
  SELECT
    g.giver_id,
    lt.last_email_at,
    MIN(k.submitted_at) AS first_kudos_this_week
  FROM givers_this_week g
  JOIN kudos k ON k.giver_id = g.giver_id
    AND k.submitted_at >= $week_start
    AND k.submitted_at < $week_end
    AND k.deleted_at IS NULL
  LEFT JOIN last_touch lt ON lt.recipient_user_id = g.giver_id
  GROUP BY g.giver_id, lt.last_email_at
)
SELECT
  COUNT(*) AS total_givers,
  COUNT(*) FILTER (
    WHERE last_email_at IS NULL
       OR EXTRACT(EPOCH FROM (first_kudos_this_week - last_email_at)) > 86400
  ) AS unprompted_givers,
  ROUND(
    COUNT(*) FILTER (
      WHERE last_email_at IS NULL
         OR EXTRACT(EPOCH FROM (first_kudos_this_week - last_email_at)) > 86400
    )::numeric / NULLIF(COUNT(*), 0) * 100,
    1
  ) AS unprompted_rate_pct
FROM giver_with_touch;
```

---

### Query 2 — Meeting-window-adjusted unprompted-giver rate (metric of record)

Excludes kudos submitted during the AG Wednesday team meeting window: **Wed 09:00 PT through Thu 09:00 PT**. v1 manual adjustment until `team_settings.team_meeting_day` is implemented (v1.5).

This is the metric used for the week-12 contingency decision.

```sql
-- Meeting-window-adjusted unprompted-giver rate
-- Same as Query 1 but excludes kudos submitted Wed 09:00–Thu 09:00 America/Vancouver
WITH last_touch AS (
  SELECT DISTINCT ON (esl.recipient_user_id)
    esl.recipient_user_id,
    esl.sent_at AS last_email_at
  FROM email_send_log esl
  WHERE esl.tenant_id = $tenant_id
    AND esl.sent_at < $week_end
  ORDER BY esl.recipient_user_id, esl.sent_at DESC
),
kudos_outside_meeting AS (
  SELECT k.giver_id, k.submitted_at
  FROM kudos k
  WHERE k.submitted_at >= $week_start
    AND k.submitted_at < $week_end
    AND k.deleted_at IS NULL
    AND k.tenant_id = $tenant_id
    -- Exclude the 24-hour AG meeting window: Wed 09:00 – Thu 09:00 PT
    AND NOT (
      EXTRACT(DOW FROM k.submitted_at AT TIME ZONE 'America/Vancouver') = 3
        AND EXTRACT(HOUR FROM k.submitted_at AT TIME ZONE 'America/Vancouver') >= 9
      OR
      EXTRACT(DOW FROM k.submitted_at AT TIME ZONE 'America/Vancouver') = 4
        AND EXTRACT(HOUR FROM k.submitted_at AT TIME ZONE 'America/Vancouver') < 9
    )
),
givers_this_week AS (
  SELECT DISTINCT giver_id FROM kudos_outside_meeting
),
giver_with_touch AS (
  SELECT
    g.giver_id,
    lt.last_email_at,
    MIN(k.submitted_at) AS first_kudos_this_week
  FROM givers_this_week g
  JOIN kudos_outside_meeting k ON k.giver_id = g.giver_id
  LEFT JOIN last_touch lt ON lt.recipient_user_id = g.giver_id
  GROUP BY g.giver_id, lt.last_email_at
)
SELECT
  COUNT(*) AS total_givers,
  COUNT(*) FILTER (
    WHERE last_email_at IS NULL
       OR EXTRACT(EPOCH FROM (first_kudos_this_week - last_email_at)) > 86400
  ) AS unprompted_givers,
  ROUND(
    COUNT(*) FILTER (
      WHERE last_email_at IS NULL
         OR EXTRACT(EPOCH FROM (first_kudos_this_week - last_email_at)) > 86400
    )::numeric / NULLIF(COUNT(*), 0) * 100,
    1
  ) AS unprompted_rate_pct
FROM giver_with_touch;
```

---

### Query 3 — Time-of-day distribution

Flattening over time indicates organic giving patterns replacing meeting-triggered spikes.

```sql
-- Kudos submission time-of-day distribution (PT), for the current week
SELECT
  EXTRACT(HOUR FROM submitted_at AT TIME ZONE 'America/Vancouver') AS hour_pt,
  COUNT(*) AS kudos_count
FROM kudos
WHERE submitted_at >= $week_start
  AND submitted_at < $week_end
  AND deleted_at IS NULL
  AND tenant_id = $tenant_id
GROUP BY hour_pt
ORDER BY hour_pt;
```

---

### Query 4 — Cross-team kudos rate

Share of kudos where the giver and recipient are on different teams. Increasing = recognition spreading across silos.

```sql
-- Cross-team kudos rate (individual-recipient kudos only)
SELECT
  COUNT(*) AS total_kudos,
  COUNT(*) FILTER (
    WHERE giver.department != recipient.department
  ) AS cross_team_kudos,
  ROUND(
    COUNT(*) FILTER (
      WHERE giver.department != recipient.department
    )::numeric / NULLIF(COUNT(*), 0) * 100,
    1
  ) AS cross_team_rate_pct
FROM kudos k
JOIN "User" giver ON giver.id = k.giver_id
JOIN "User" recipient ON recipient.id = k.recipient_id
WHERE k.submitted_at >= $week_start
  AND k.submitted_at < $week_end
  AND k.deleted_at IS NULL
  AND k.tenant_id = $tenant_id
  AND k.recipient_id IS NOT NULL;
```

---

### Query 5 — Nudge conversion rate

Share of kudos submitted within 24 hours of a prompt-type email (prompt_of_week, inactive_nudge, overlooked_recipient). Trending down = success (people giving without being nudged).

```sql
-- Nudge conversion rate: kudos within 24h of a prompt-type email touch
WITH prompt_touches AS (
  SELECT
    recipient_user_id,
    sent_at
  FROM email_send_log
  WHERE tenant_id = $tenant_id
    AND template_type IN ('prompt_of_week', 'inactive_nudge', 'overlooked_recipient')
    AND sent_at >= $week_start - INTERVAL '24 hours'
    AND sent_at < $week_end
)
SELECT
  COUNT(DISTINCT k.id) AS total_kudos_this_week,
  COUNT(DISTINCT k.id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM prompt_touches pt
      WHERE pt.recipient_user_id = k.giver_id
        AND k.submitted_at > pt.sent_at
        AND k.submitted_at <= pt.sent_at + INTERVAL '24 hours'
    )
  ) AS nudge_converted_kudos,
  ROUND(
    COUNT(DISTINCT k.id) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM prompt_touches pt
        WHERE pt.recipient_user_id = k.giver_id
          AND k.submitted_at > pt.sent_at
          AND k.submitted_at <= pt.sent_at + INTERVAL '24 hours'
      )
    )::numeric / NULLIF(COUNT(DISTINCT k.id), 0) * 100,
    1
  ) AS nudge_conversion_rate_pct
FROM kudos k
WHERE k.submitted_at >= $week_start
  AND k.submitted_at < $week_end
  AND k.deleted_at IS NULL
  AND k.tenant_id = $tenant_id;
```

---

### Query 6 — Top-giver volume distribution

Looking for long-tail (many people giving a little) vs. concentration (one or two people giving everything).

```sql
-- Top-giver distribution: kudos given per person this week
SELECT
  u.first_name,
  u.last_name,
  COUNT(k.id) AS kudos_given
FROM kudos k
JOIN "User" u ON u.id = k.giver_id
WHERE k.submitted_at >= $week_start
  AND k.submitted_at < $week_end
  AND k.deleted_at IS NULL
  AND k.tenant_id = $tenant_id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY kudos_given DESC;
```

---

### Query 7 — Kudos read rate

Share of recipient-notify emails where the recipient read the kudos within 7 days. Low rate = email deliverability issue or engagement drop.

```sql
-- Kudos read rate: % of recipient_notify sends with a kudos_read within 7 days
SELECT
  COUNT(DISTINCT esl.id) AS recipient_notify_sent,
  COUNT(DISTINCT kr.id) AS read_within_7_days,
  ROUND(
    COUNT(DISTINCT kr.id)::numeric / NULLIF(COUNT(DISTINCT esl.id), 0) * 100,
    1
  ) AS read_rate_pct
FROM email_send_log esl
LEFT JOIN kudos_read kr
  ON kr.kudos_id = esl.kudos_id
  AND kr.read_at <= esl.sent_at + INTERVAL '7 days'
WHERE esl.tenant_id = $tenant_id
  AND esl.template_type = 'recipient_notify'
  AND esl.sent_at >= $week_start - INTERVAL '7 days'
  AND esl.sent_at < $week_end;
```

---

## Reporting cadence

| Checkpoint | Week(s) | What to review |
|---|---|---|
| Baseline | Week 1 | Total kudos given, unique givers, time-of-day spike at Wednesday 09:00 PT confirms meeting-trigger pattern |
| Early signal | Week 2 | Unprompted rate (expect low — team still adjusting). Cross-team rate baseline. |
| Adoption curve | Week 4 | Has the Wednesday spike flattened? Are there multiple giving days? |
| Conversion check | Week 6 | Nudge conversion rate — is it declining? Unprompted rate — is it above 10%? |
| Contingency gate | Week 6+ | If unprompted rate <10% for 3 consecutive weeks → trigger contingency investigation |
| Mid-term | Week 8 | Manager digest open rate (check Resend dashboard). Badge milestone emails fired? |
| Stability check | Week 12 | All metrics stable. Cross-team rate trending up? Quiet-week emails trending down? |
| 6-month review | Month 6 | Full cycle. Meeting-window exclusion still needed? v1.5 `team_meeting_day` schema ready? |

---

## Contingency investigation checklist

Trigger: unprompted-giver rate <10% for 3 consecutive weeks after week 6.

1. Run Query 3 (time-of-day) — is giving still concentrated on Wednesday?
2. Run Query 5 (nudge conversion) — are people only giving after a prompt email?
3. Check Resend dashboard — are prompt emails being delivered and opened?
4. Interview 2–3 team members: "What makes you think to give a kudos?"
5. Review featured prompt text — are prompts feeling like assignments?
6. Consider: shorter edit window, different prompt framing, or pairing with team ritual other than the retiring Wednesday meeting.
7. Document findings and decision in `docs/launch/13_measurement_validation_plan.md`.
