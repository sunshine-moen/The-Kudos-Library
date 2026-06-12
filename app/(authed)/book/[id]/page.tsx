import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import BookModal from "@/components/library/BookModal";

async function recordRead(kudosId: string, userId: string, tenantId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/kudos-read`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kudos_id: kudosId }),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const data = await res.json() as { is_first_ever_read: boolean };
      return data.is_first_ever_read;
    }
  } catch {
    // Non-fatal — read tracking shouldn't break the page
  }
  return false;
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const kudos = await prisma.kudos.findUnique({
    where: { id },
    include: {
      giver: { select: { first_name: true, last_name: true } },
      recipient: { select: { first_name: true, last_name: true } },
      team_recipient: { select: { name: true } },
      context_category: { select: { label: true } },
      kudos_values: { include: { value_tag: { select: { label: true } } } },
    },
  });

  if (!kudos) notFound();

  // Non-admins cannot see soft-deleted kudos
  const member = userId
    ? await prisma.user.findFirst({ where: { id: userId }, select: { role: true } })
    : null;
  const isAdmin = member?.role === "admin";

  if (kudos.deleted_at && !isAdmin) notFound();

  const tenantId = kudos.tenant_id;
  const isFirstEverRead =
    userId && tenantId ? await recordRead(id, userId, tenantId) : false;

  return (
    <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "100vh" }}>
      <BookModal
        kudos={{
          ...kudos,
          deleted_at: kudos.deleted_at?.toISOString() ?? null,
          team_recipient_id: kudos.team_recipient_id,
          team_recipient: kudos.team_recipient,
        }}
        isFirstEverRead={isFirstEverRead}
        isModal={false}
        isAdmin={isAdmin}
      />
    </main>
  );
}
