import type { PrismaClient } from "@prisma/client";
import { BADGE_DEFINITIONS } from "./definitions";

/** Seeds badge_definition rows for the given tenant. Idempotent via upsert. */
export async function seedBadgeDefinitions(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  for (const def of BADGE_DEFINITIONS) {
    await prisma.badgeDefinition.upsert({
      where: { tenant_id_key: { tenant_id: tenantId, key: def.key } },
      update: {
        name: def.name,
        description: def.description,
        criteria: def.criteria as object,
        visual_asset: def.visual_asset,
      },
      create: {
        tenant_id: tenantId,
        key: def.key,
        name: def.name,
        description: def.description,
        criteria: def.criteria as object,
        visual_asset: def.visual_asset,
      },
    });
  }
}
