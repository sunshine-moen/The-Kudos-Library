import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import BookShelf from "@/components/library/BookShelf";
import WayfindingSign from "@/components/library/WayfindingSign";
import { PRODUCT_COPY } from "@/lib/content/hardcoded";

const NEW_ARRIVALS_LIMIT = 20;

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenantId = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenant_id: true },
  }))?.tenant_id;

  if (!tenantId) redirect("/login");

  const kudosSelect = {
    id: true,
    book_design: true,
    message_text: true,
    submitted_at: true,
    recipient: { select: { first_name: true, last_name: true } },
    team_recipient: { select: { name: true } },
  } as const;

  // New Arrivals — most recent 20 across the whole tenant
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [newArrivals, activeMembers, subTeams, weeklyWinners, monthlyWinners, activePrompt, pickupCount] = await Promise.all([
    prisma.kudos.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: { submitted_at: "desc" },
      take: NEW_ARRIVALS_LIMIT,
      select: kudosSelect,
    }),
    prisma.user.findMany({
      where: { tenant_id: tenantId, status: { in: ["active", "on_leave"] } },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
      select: {
        id: true,
        first_name: true,
        last_name: true,
        kudos_received: {
          where: { deleted_at: null },
          orderBy: { submitted_at: "desc" },
          take: 30,
          select: kudosSelect,
        },
      },
    }),
    prisma.team.findMany({
      where: { tenant_id: tenantId, kind: "sub_team" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        kudos_received: {
          where: { deleted_at: null },
          orderBy: { submitted_at: "desc" },
          take: 20,
          select: kudosSelect,
        },
      },
    }),
    prisma.leaderboardWinner.findMany({
      where: { tenant_id: tenantId, kind: "top_giver_week" },
      orderBy: [{ period_start: "desc" }, { rank: "asc" }],
      take: 5,
      include: { winner: { select: { first_name: true, last_name: true } } },
    }),
    prisma.leaderboardWinner.findMany({
      where: { tenant_id: tenantId, kind: "top_giver_month" },
      orderBy: [{ period_start: "desc" }, { rank: "asc" }],
      take: 5,
      include: { winner: { select: { first_name: true, last_name: true } } },
    }),
    prisma.featuredPrompt.findFirst({
      where: { tenant_id: tenantId, published_at: { not: null } },
      orderBy: { published_at: "desc" },
      select: { prompt_text: true },
    }),
    prisma.kudosRead.count({
      where: {
        tenant_id: tenantId,
        read_at: { gte: weekAgo },
        kudos: { recipient_id: session.user.id, deleted_at: null },
      },
    }),
  ]);

  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="mb-3" style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}>
              {PRODUCT_COPY.hero.tagline}
            </h1>
            <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", maxWidth: 480, margin: "0 auto" }}>
              {PRODUCT_COPY.hero.subline}
            </p>
          </div>

          {/* New Arrivals */}
          <BookShelf
            title="New Arrivals"
            kudos={newArrivals}
            emptyMessage="The first kudos will appear here."
          />

          {/* Leaderboard */}
          {(weeklyWinners.length > 0 || monthlyWinners.length > 0) && (
            <section className="mb-10" aria-label="Leaderboard">
              <h2 className="mb-3" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
                Top Givers
              </h2>
              <div className="flex flex-wrap gap-6">
                {weeklyWinners.length > 0 && (
                  <div className="rounded-sm p-4 flex-1 min-w-48" style={{ background: "var(--inst-navy)" }}>
                    <p className="mb-3" style={{ font: "var(--text-app-ui)", color: "var(--inst-gold)", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>
                      This Week
                    </p>
                    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {weeklyWinners.map((w) => (
                        <li key={w.id} className="flex items-center justify-between mb-1">
                          <span style={{ color: "var(--inst-white)", font: "var(--text-app-ui)", fontSize: 13 }}>
                            {w.rank}. {w.winner.first_name} {w.winner.last_name}
                          </span>
                          <span style={{ color: "var(--inst-gold)", font: "var(--text-app-ui)", fontSize: 12 }}>
                            {w.kudos_count}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {monthlyWinners.length > 0 && (
                  <div className="rounded-sm p-4 flex-1 min-w-48" style={{ background: "var(--inst-navy)" }}>
                    <p className="mb-3" style={{ font: "var(--text-app-ui)", color: "var(--inst-gold)", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>
                      This Month
                    </p>
                    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {monthlyWinners.map((w) => (
                        <li key={w.id} className="flex items-center justify-between mb-1">
                          <span style={{ color: "var(--inst-white)", font: "var(--text-app-ui)", fontSize: 13 }}>
                            {w.rank}. {w.winner.first_name} {w.winner.last_name}
                          </span>
                          <span style={{ color: "var(--inst-gold)", font: "var(--text-app-ui)", fontSize: 12 }}>
                            {w.kudos_count}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Team shelves (sub-teams) */}
          {subTeams.map((team) => (
            <BookShelf
              key={team.id}
              title={`${team.name} Team`}
              kudos={team.kudos_received}
              emptyMessage={`No team kudos for ${team.name} yet.`}
            />
          ))}

          {/* Personal shelves */}
          <section aria-label="Personal shelves">
            <h2 className="mb-4" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
              Personal Shelves
            </h2>
            {activeMembers.map((member) => (
              <BookShelf
                key={member.id}
                title={`${member.first_name} ${member.last_name}`}
                kudos={member.kudos_received}
                emptyMessage={`No kudos for ${member.first_name} yet.`}
              />
            ))}
          </section>

          <WayfindingSign
            promptText={activePrompt?.prompt_text ?? null}
            pickupCount={pickupCount}
            showPickupIndicator={true}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
