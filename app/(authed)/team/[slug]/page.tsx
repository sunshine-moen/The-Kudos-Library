import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import BookShelf from "@/components/library/BookShelf";

export default async function TeamShelfPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findFirst({
    where: { id: session.user.id },
    select: { tenant_id: true },
  });
  if (!viewer) redirect("/login");

  const team = await prisma.team.findFirst({
    where: { slug, tenant_id: viewer.tenant_id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      kudos_received: {
        where: { deleted_at: null },
        orderBy: { submitted_at: "desc" },
        select: {
          id: true,
          book_design: true,
          message_text: true,
          submitted_at: true,
          recipient: { select: { first_name: true, last_name: true } },
          team_recipient: { select: { name: true } },
        },
      },
    },
  });

  if (!team) notFound();

  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Team header */}
          <div className="mb-8">
            <nav aria-label="Breadcrumb" className="mb-2">
              <a href="/library" style={{ font: "var(--text-app-ui)", color: "var(--inst-navy)", fontSize: 13 }}>
                ← Library
              </a>
            </nav>
            <h1 style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}>
              {team.name}
            </h1>
            {team.description && (
              <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)", marginTop: 4 }}>
                {team.description}
              </p>
            )}
          </div>

          {/* Team kudos shelf */}
          <BookShelf
            title={`${team.name} Kudos`}
            kudos={team.kudos_received}
            emptyMessage={`No team kudos for ${team.name} yet.`}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
