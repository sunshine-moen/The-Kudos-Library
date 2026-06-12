# Pre-Launch Checklist — The Kudos Library

**Owner:** Rebekah Moen  
**Sign-off required:** All items checked before production cutover.  
**Reference:** `docs/launch/14_launch_adoption_plan.md` · `docs/launch/13_measurement_validation_plan.md`

Check each item against the **production** environment (not staging unless noted). Record the date and any notes beside each checkbox.

---

## 1. Technical gates (verifiable via API or SQL)

These can be run by Claude Code or Rebekah against the production database.

### 1.1 Launch-readiness API

- [ ] `GET /api/admin/launch-readiness` returns `{ "all_passed": true }` with all 5 checks passing.

```bash
curl -s https://kudos.ag.ubc.ca/api/admin/launch-readiness \
  -H "Cookie: <session-cookie>" | jq .
```

Expected: `{ "all_passed": true, "checks": [...] }`

---

### 1.2 Admin count

- [ ] ≥2 active admins in the production tenant.

```sql
SELECT COUNT(*) FROM "User"
WHERE tenant_id = '<AG_TENANT_ID>'
  AND role = 'admin'
  AND status = 'active';
-- Expected: ≥ 2
```

---

### 1.3 Value tags

- [ ] 12 value tags seeded and active.

```sql
SELECT COUNT(*) FROM value_tag
WHERE tenant_id = '<AG_TENANT_ID>'
  AND is_active = true;
-- Expected: 12
```

---

### 1.4 Context categories

- [ ] 6 context categories seeded.

```sql
SELECT COUNT(*) FROM context_category
WHERE tenant_id = '<AG_TENANT_ID>';
-- Expected: 6
-- Required keys: process_or_system, project, mentorship, coverage, collaboration_event, everyday_moment
```

---

### 1.5 Featured prompts

- [ ] ≥8 featured prompts seeded for default rotation.

```sql
SELECT COUNT(*) FROM featured_prompt
WHERE tenant_id = '<AG_TENANT_ID>'
  AND is_default_rotation = true;
-- Expected: ≥ 8
```

- [ ] One featured prompt scheduled as active for the launch week (the first Monday of launch).

```sql
SELECT prompt_text, week_start_date, published_at
FROM featured_prompt
WHERE tenant_id = '<AG_TENANT_ID>'
  AND published_at IS NOT NULL
ORDER BY published_at DESC
LIMIT 3;
-- Confirm the launch-week prompt is present and week_start_date = launch Monday
```

---

### 1.6 Roster

- [ ] Full AG team roster imported: ≥15 active members.

```sql
SELECT COUNT(*) FROM "User"
WHERE tenant_id = '<AG_TENANT_ID>'
  AND status = 'active';
-- Expected: ≥ 15
```

- [ ] Manager relationships set for all non-top-level members.

```sql
SELECT COUNT(*) FROM "User"
WHERE tenant_id = '<AG_TENANT_ID>'
  AND status = 'active'
  AND manager_id IS NULL
  AND role NOT IN ('admin');
-- Expected: 0 or 1 (only top-level lead may have manager_id = NULL)
```

---

### 1.7 Static content

- [ ] Terms of Service and Privacy Policy rows seeded and non-empty.

```sql
SELECT key, LENGTH(body_html) AS char_count
FROM static_content
WHERE tenant_id = '<AG_TENANT_ID>'
  AND key IN ('terms', 'privacy');
-- Expected: 2 rows, both with char_count > 100
```

---

### 1.8 Application health

- [ ] `/api/health` returns 200.

```bash
curl -s -o /dev/null -w "%{http_code}" https://kudos.ag.ubc.ca/api/health
# Expected: 200
```

- [ ] `GET /api/admin/health` (with `ADMIN_HEALTH_SECRET`) shows all crons run within 25 hours.

---

### 1.9 Email pipeline

- [ ] Send a test kudos on staging. Confirm `email_outbox` row is created with correct `recipient_user_id` and `template_type = 'recipient_notify'`.
- [ ] Confirm outbox-poller fires and the email arrives in Resend dashboard within 20 minutes of the edit window expiring.
- [ ] Confirm email renders correctly in Gmail and Outlook (mobile + desktop).

---

### 1.10 Marketing page

- [ ] `GET /` returns 200 with hero copy: *"A library a team builds together—one kudos at a time, growing into a history."*
- [ ] Sign-in CTA link navigates to `/login`.
- [ ] Footer links to `/terms` and `/privacy` both return 200 with non-empty content.

---

## 2. Human sign-off gates (Rebekah owns)

These cannot be automated. Rebekah reviews and checks each item.

### 2.1 Email template review

- [ ] All 13 email templates rendered in staging with real data — no unresolved `{{variable}}` strings, correct names, correct dates.

Templates to review:
1. `magic_link` — sign-in email
2. `magic_link_new_device` — device confirmation email
3. `recipient_notify` — kudos received notification
4. `manager_digest` — Monday weekly summary
5. `manager_quiet_week` — quiet week variant
6. `badge_milestone` — badge earned notification (test with "First Chapter")
7. `overlooked_recipient` — recognition reminder to manager
8. `inactive_nudge` — giver re-engagement
9. `top_giver_announcement` — weekly top-giver
10. `work_anniversary_reminder` — anniversary alert to manager
11. `kudos_was_read_digest` — "your words made it to them"
12. `account_deletion_grace_period` — deletion scheduled
13. `account_deletion_cancelled` — deletion cancelled

---

### 2.2 Badge milestone tone pass

- [ ] Read all 9 badge story copy blocks (in `/profile` and in the milestone email). Confirm tone matches the library voice.
- [ ] "First Chapter" badge confirmed — this is the badge shown in the pre-launch checklist email template test above.

---

### 2.3 Author quotes

- [ ] ≥14 author quotes verified against primary sources and seeded (see `docs/AUTHOR_REVIEW_LOG.md`).
- [ ] No ⚠ (low-confidence) quotes are seeded in production.

---

### 2.4 Marketing page voice

- [ ] "What it is" and "How it works" sections reviewed and match Rebekah's voice.
- [ ] "Why I built this" personal note drafted, edited and ready to add via admin.
- [ ] All screenshots captured from staging and uploaded.

---

### 2.5 Terms and Privacy Policy

- [ ] Placeholder copy reviewed. Rebekah confirms: "acceptable for v1 pilot launch — legal/comms review deferred to v1.5."
- [ ] `[DATE TBD]` replaced with actual effective date.
- [ ] `[contact-email-TBD]` replaced with actual contact email.

---

### 2.6 Launch announcement

- [ ] Announcement email drafted and ready to send from Rebekah's work email the morning of launch.
- [ ] Email references the library URL, sign-in flow, and the "this is replacing the Wednesday Mural ritual" framing from `14_launch_adoption_plan.md`.
- [ ] Recording slot booked for the 60-minute team walkthrough (within the first week of launch).

---

## 3. Final cutover steps (in order)

1. Confirm all items in sections 1 and 2 are checked.
2. Run `GET /api/admin/launch-readiness` one final time — confirm `all_passed: true`.
3. Send the launch announcement email to the AG team.
4. Run the 60-minute walkthrough session (or distribute recording).
5. Monitor Resend dashboard and Sentry for the first 48 hours.
6. Run weekly-metrics.md queries on the first Monday after launch.

---

## Notes

_Record the date each item was verified and any exceptions._

| Item | Verified by | Date | Notes |
|---|---|---|---|
| Launch-readiness API | | | |
| Admin count | | | |
| Value tags | | | |
| Context categories | | | |
| Featured prompts | | | |
| Roster | | | |
| Static content | | | |
| Health endpoint | | | |
| Email pipeline | | | |
| Marketing page | | | |
| Email template review | | | |
| Badge tone pass | | | |
| Author quotes | | | |
| Marketing page voice | | | |
| Terms and privacy | | | |
| Launch announcement | | | |
