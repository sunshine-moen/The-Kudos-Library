import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import AuditLogViewer from "@/components/admin/AuditLogViewer";

const PAGE_LIMIT = 50;

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, tenant_id: true },
  });

  if (!user || user.role !== "admin") redirect("/library");

  const [rawRows, members] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where: { tenant_id: user.tenant_id },
      orderBy: { occurred_at: "desc" },
      take: PAGE_LIMIT + 1,
      select: {
        id: true,
        action: true,
        target_type: true,
        target_id: true,
        metadata: true,
        occurred_at: true,
        actor: { select: { first_name: true, last_name: true, id: true } },
      },
    }),
    prisma.user.findMany({
      where: { tenant_id: user.tenant_id, status: { in: ["active", "on_leave"] } },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
      select: { id: true, first_name: true, last_name: true },
    }),
  ]);

  const hasMore = rawRows.length > PAGE_LIMIT;
  const rows = hasMore ? rawRows.slice(0, PAGE_LIMIT) : rawRows;
  const nextCursor = hasMore ? (rows[rows.length - 1]?.id ?? null) : null;

  // Serialize dates for client
  const serialized = rows.map((r) => ({ ...r, occurred_at: r.occurred_at.toISOString() }));

  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1
            className="mb-2"
            style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
          >
            Audit log
          </h1>
          <p className="mb-8" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)" }}>
            All admin actions, newest first. Click a row to expand metadata.
          </p>
          <AuditLogViewer
            initialRows={serialized}
            initialNextCursor={nextCursor}
            members={members}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
