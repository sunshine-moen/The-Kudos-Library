import type { TenantContext } from "@/lib/auth/tenant-context";
import type { EmailTemplate, EmailTemplateType } from "@prisma/client";

export async function getEmailTemplate(
  _ctx: TenantContext,
  _type: EmailTemplateType,
): Promise<EmailTemplate | null> {
  throw new Error("not implemented");
}
