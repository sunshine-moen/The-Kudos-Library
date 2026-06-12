import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

interface ReadinessCheck {
  name: string;
  passed: boolean;
  message: string;
}

export const GET = requireAdmin(async (_req, ctx) => {
  const checks: ReadinessCheck[] = [];

  // 1. Minimum 2 active admins
  const adminCount = await prisma.user.count({
    where: { tenant_id: ctx.tenantId, role: "admin", status: "active" },
  });
  checks.push({
    name: "min_admins",
    passed: adminCount >= 2,
    message:
      adminCount >= 2
        ? `${adminCount} active admins — requirement met.`
        : `Production launch requires ≥2 active admins; currently ${adminCount}.`,
  });

  // 2. At least one active value tag seeded
  const valueTagCount = await prisma.valueTag.count({
    where: { tenant_id: ctx.tenantId, is_active: true },
  });
  checks.push({
    name: "values_seeded",
    passed: valueTagCount >= 1,
    message:
      valueTagCount >= 1
        ? `${valueTagCount} active value tags — requirement met.`
        : "No active value tags found. Seed at least one value tag before launch.",
  });

  // 3. At least one featured prompt exists (default rotation or scheduled)
  const promptCount = await prisma.featuredPrompt.count({
    where: { tenant_id: ctx.tenantId },
  });
  checks.push({
    name: "featured_prompt",
    passed: promptCount >= 1,
    message:
      promptCount >= 1
        ? `${promptCount} featured prompt(s) seeded — requirement met.`
        : "No featured prompts found. Seed at least one prompt before launch.",
  });

  // 4. Terms and Privacy Policy are seeded and non-empty
  const staticContent = await prisma.staticContent.findMany({
    where: { tenant_id: ctx.tenantId, key: { in: ["terms", "privacy"] } },
    select: { key: true, body_html: true },
  });
  const termsRow = staticContent.find((r) => r.key === "terms");
  const privacyRow = staticContent.find((r) => r.key === "privacy");
  const termsOk = !!termsRow && termsRow.body_html.trim().length > 0;
  const privacyOk = !!privacyRow && privacyRow.body_html.trim().length > 0;
  checks.push({
    name: "terms_accepted",
    passed: termsOk && privacyOk,
    message:
      termsOk && privacyOk
        ? "Terms and Privacy Policy are seeded — requirement met."
        : [
            !termsOk ? "Terms of Service content is missing or empty." : "",
            !privacyOk ? "Privacy Policy content is missing or empty." : "",
          ]
            .filter(Boolean)
            .join(" "),
  });

  // 5. Tenant has at least one active roster member (besides admins)
  const memberCount = await prisma.user.count({
    where: { tenant_id: ctx.tenantId, status: "active" },
  });
  checks.push({
    name: "roster_seeded",
    passed: memberCount >= 1,
    message:
      memberCount >= 1
        ? `${memberCount} active roster member(s) — requirement met.`
        : "No active roster members found. Import the team roster before launch.",
  });

  const allPassed = checks.every((c) => c.passed);

  return NextResponse.json({ all_passed: allPassed, checks });
});
