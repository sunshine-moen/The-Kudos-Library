import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import CelebrateForm from "@/components/kudos/CelebrateForm";

export default async function CelebratePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenant_id: true },
  });

  const activePrompt = user?.tenant_id
    ? await prisma.featuredPrompt.findFirst({
        where: { tenant_id: user.tenant_id, published_at: { not: null } },
        orderBy: { published_at: "desc" },
        select: { prompt_text: true, pre_tag_value_id: true },
      })
    : null;

  // Fallback: when no featured prompt is active, pre-tag with giver's most-used value tag (rolling 30 days)
  let fallbackValueTagId: string | null = null;
  if (!activePrompt && user?.tenant_id) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<Array<{ value_tag_id: string; cnt: bigint }>>`
      SELECT kv.value_tag_id, COUNT(*) AS cnt
      FROM kudos_value kv
      JOIN kudos k ON kv.kudos_id = k.id
      WHERE k.giver_id = ${session.user.id}::uuid
        AND k.tenant_id = ${user.tenant_id}::uuid
        AND k.submitted_at >= ${thirtyDaysAgo}
        AND k.deleted_at IS NULL
      GROUP BY kv.value_tag_id
      ORDER BY cnt DESC
      LIMIT 1
    `;
    fallbackValueTagId = rows[0]?.value_tag_id ?? null;
  }

  const preTagValueId = activePrompt?.pre_tag_value_id ?? fallbackValueTagId;

  return (
    <main id="main-content" className="px-4 py-10" style={{ background: "var(--lib-cream)", minHeight: "100vh" }}>
      <h1
        className="mb-8 text-center"
        style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
      >
        Celebrate a colleague
      </h1>
      <CelebrateForm
        activePromptText={activePrompt?.prompt_text ?? null}
        preTagValueId={preTagValueId}
      />
    </main>
  );
}
