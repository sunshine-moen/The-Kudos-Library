import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { writeOutboxRow } from "@/lib/outbox/writer";

const LEAD_DAYS: Record<string, number> = {
  one_week_before: 7,
  three_days_before: 3,
  day_of: 0,
};

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const now = new Date();

  const settings = await prisma.teamSettings.findFirst({
    select: {
      timezone: true,
      tenant_id: true,
      anniversary_lead_time: true,
    },
  });
  const tz = settings?.timezone ?? "America/Vancouver";
  const tenantId = settings?.tenant_id;
  const leadDays = LEAD_DAYS[settings?.anniversary_lead_time ?? "one_week_before"] ?? 7;

  // Local calendar date today
  const localDateStr = now.toLocaleDateString("en-CA", { timeZone: tz }); // "YYYY-MM-DD"
  const parts = localDateStr.split("-");
  const localYear = parseInt(parts[0] ?? "2024", 10);
  const localMonth = parseInt(parts[1] ?? "1", 10);
  const localDay = parseInt(parts[2] ?? "1", 10);

  const startRow = await prisma.cronRunLog.create({
    data: { cron_name: "anniversary-reminder", tenant_id: tenantId ?? null, outcome: "success" },
  });

  try {
    if (!tenantId) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, processed: 0 });
    }

    // Include employees with no manager — admin fallback path handles them
    const members = await prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ["active", "on_leave"] },
        OR: [
          { ubc_hire_date: { not: null } },
          { ag_join_date: { not: null } },
        ],
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        ubc_hire_date: true,
        ag_join_date: true,
        email_settings: true,
        manager_id: true,
        manager: {
          select: { id: true, first_name: true, email_settings: true },
        },
      },
    });

    // Pre-fetch admins for the fallback path (used for employees with no manager)
    const admins = await prisma.user.findMany({
      where: { tenant_id: tenantId, role: "admin", status: "active" },
      select: { id: true, email_settings: true },
    });

    let processed = 0;

    for (const member of members) {
      // Dual opt-out: employee can suppress ALL anniversary reminders about themselves
      const memberSettings = member.email_settings as Record<string, unknown> | null;
      if (memberSettings?.["anniversary_about_me"] === false) continue;

      const datesToCheck: Array<{ date: Date; kind: "ubc" | "ag" }> = [];
      if (member.ubc_hire_date) datesToCheck.push({ date: member.ubc_hire_date, kind: "ubc" });
      if (member.ag_join_date) datesToCheck.push({ date: member.ag_join_date, kind: "ag" });

      for (const { date, kind } of datesToCheck) {
        const anniversaryMonth = date.getUTCMonth() + 1;
        const anniversaryDay = date.getUTCDate();
        const startYear = date.getUTCFullYear();

        const anniversaryThisYear = new Date(Date.UTC(localYear, anniversaryMonth - 1, anniversaryDay));
        const reminderDate = new Date(anniversaryThisYear.getTime() - leadDays * 86400000);
        const reminderMonth = reminderDate.getUTCMonth() + 1;
        const reminderDay = reminderDate.getUTCDate();

        if (reminderMonth !== localMonth || reminderDay !== localDay) continue;

        const yearsCount = localYear - startYear;
        if (yearsCount <= 0) continue;

        const alreadySent = await prisma.workAnniversaryReminder.findUnique({
          where: {
            tenant_id_employee_id_anniversary_kind_anniversary_date: {
              tenant_id: tenantId,
              employee_id: member.id,
              anniversary_kind: kind,
              anniversary_date: anniversaryThisYear,
            },
          },
        });
        if (alreadySent) continue;

        if (member.manager) {
          // Normal path: send to the member's direct manager
          const managerSettings = member.manager.email_settings as Record<string, unknown> | null;
          if (managerSettings?.["anniversary_reminders"] === false) continue;

          const idempotencyKey = `anniversary_reminder:${tenantId}:${member.id}:${kind}:${localYear}`;
          const existing = await prisma.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
          if (!existing) {
            await prisma.$transaction(async (tx) => {
              await writeOutboxRow(tx, {
                tenantId,
                templateType: "work_anniversary_reminder",
                recipientUserId: member.manager!.id,
                idempotencyKey,
                payload: {
                  member_id: member.id,
                  member_first_name: member.first_name,
                  member_last_name: member.last_name,
                  years_count: yearsCount,
                  anniversary_kind: kind,
                },
              });
              await tx.workAnniversaryReminder.create({
                data: {
                  tenant_id: tenantId,
                  employee_id: member.id,
                  anniversary_kind: kind,
                  anniversary_date: anniversaryThisYear,
                },
              });
            });
            processed++;
          }
        } else {
          // Admin fallback path: no manager, send to all active admins (excluding the member themselves)
          const eligibleAdmins = admins.filter((a) => {
            if (a.id === member.id) return false; // self-exclusion
            const adminSettings = a.email_settings as Record<string, unknown> | null;
            if (adminSettings?.["anniversary_reminders"] === false) return false;
            return true;
          });

          if (eligibleAdmins.length === 0) {
            // No eligible admins — log suppression, do not queue any email
            console.warn(
              `anniversary-reminder: no eligible admins for employee ${member.id} (${member.first_name} ${member.last_name}), suppressing`
            );
            continue;
          }

          await prisma.$transaction(async (tx) => {
            for (const admin of eligibleAdmins) {
              const idempotencyKey = `anniversary_reminder:${tenantId}:${member.id}:${kind}:${localYear}:admin:${admin.id}`;
              const existing = await tx.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
              if (!existing) {
                await writeOutboxRow(tx, {
                  tenantId,
                  templateType: "work_anniversary_reminder",
                  recipientUserId: admin.id,
                  idempotencyKey,
                  payload: {
                    member_id: member.id,
                    member_first_name: member.first_name,
                    member_last_name: member.last_name,
                    years_count: yearsCount,
                    anniversary_kind: kind,
                  },
                });
              }
            }
            // One WorkAnniversaryReminder row gates all re-sends for this employee+kind+year
            await tx.workAnniversaryReminder.create({
              data: {
                tenant_id: tenantId,
                employee_id: member.id,
                anniversary_kind: kind,
                anniversary_date: anniversaryThisYear,
              },
            });
          });
          processed++;
        }
      }
    }

    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: { completed_at: new Date(), outcome: "success", rows_processed: processed },
    });

    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: { completed_at: new Date(), outcome: "failure" },
    });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
