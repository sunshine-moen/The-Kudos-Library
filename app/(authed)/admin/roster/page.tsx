import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import RosterClient from "@/components/admin/RosterClient";

export default async function AdminRosterPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const member = await prisma.user.findFirst({
    where: { id: userId },
    select: { role: true },
  });

  if (member?.role !== "admin") redirect("/library");

  const [members, teams] = await Promise.all([
    prisma.user.findMany({
      where: { tenant_id: { not: undefined }, status: { not: "deleted" } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        job_title: true,
        digest_cadence: true,
        on_leave_from: true,
        on_leave_until: true,
        sub_team: { select: { id: true, name: true, slug: true } },
        manager: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: [{ status: "asc" }, { last_name: "asc" }, { first_name: "asc" }],
    }),
    prisma.team.findMany({
      select: { id: true, name: true, slug: true, kind: true },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    }),
  ]);

  const serialised = members.map((m) => ({
    ...m,
    on_leave_from: m.on_leave_from?.toISOString() ?? null,
    on_leave_until: m.on_leave_until?.toISOString() ?? null,
  }));

  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="mb-6" style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}>
            Team Roster
          </h1>
          <RosterClient members={serialised} teams={teams} />
        </div>
      </main>
      <Footer />
    </>
  );
}
