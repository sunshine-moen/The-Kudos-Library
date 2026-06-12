import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import BookShelf from "@/components/library/BookShelf";

export default async function MemberShelfPage({
  params,
}: {
  params: Promise<{ member: string }>;
}) {
  const { member: memberId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.user.findFirst({
    where: { id: memberId },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      job_title: true,
      department: true,
      badge_awards: {
        include: {
          badge: { select: { name: true, visual_asset: true } },
        },
      },
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

  if (!member) notFound();

  const fullName = `${member.first_name} ${member.last_name}`;

  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Member header */}
          <div className="mb-8">
            <nav aria-label="Breadcrumb" className="mb-2">
              <a href="/library" style={{ font: "var(--text-app-ui)", color: "var(--inst-navy)", fontSize: 13 }}>
                ← Library
              </a>
            </nav>
            <h1 style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}>
              {fullName}
            </h1>
            {(member.job_title || member.department) && (
              <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)", marginTop: 4 }}>
                {[member.job_title, member.department].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* Badges */}
          {member.badge_awards.length > 0 && (
            <section className="mb-8" aria-label="Badges earned">
              <h2 className="mb-3" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
                Badges
              </h2>
              <div className="flex flex-wrap gap-3">
                {member.badge_awards.map((award) => (
                  <div
                    key={award.id}
                    className="flex items-center gap-2 rounded-sm px-3 py-2"
                    style={{ background: "var(--inst-navy)", color: "var(--inst-white)" }}
                  >
                    <span style={{ font: "var(--text-app-ui)", fontSize: 13 }}>
                      {award.badge.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Kudos shelf */}
          <BookShelf
            title={`${member.first_name}'s Kudos`}
            kudos={member.kudos_received}
            emptyMessage={`No kudos for ${member.first_name} yet.`}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
