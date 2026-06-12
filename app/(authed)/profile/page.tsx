import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import EmailPreferencesSection from "@/components/profile/EmailPreferencesSection";
import EditProfileForm from "@/components/profile/EditProfileForm";
import DeletionSection from "@/components/profile/DeletionSection";
import Image from "next/image";
import BookSpine from "@/components/library/BookSpine";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      first_name: true,
      last_name: true,
      email: true,
      role: true,
      job_title: true,
      department: true,
      image: true,
      email_settings: true,
      status: true,
      pending_deletion_at: true,
      sub_team: { select: { name: true } },
      kudos_received: {
        orderBy: { submitted_at: "desc" },
        select: {
          id: true,
          book_design: true,
          message_text: true,
          deleted_at: true,
          submitted_at: true,
          recipient: { select: { first_name: true, last_name: true } },
          team_recipient: { select: { name: true } },
        },
      },
      badge_awards: {
        orderBy: { awarded_at: "asc" },
        include: {
          badge: { select: { name: true, description: true, visual_asset: true } },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const isManager = user.role === "manager" || user.role === "admin";
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

  const metaParts = [user.job_title, user.department, user.sub_team?.name].filter(Boolean);

  const rawSettings = (user.email_settings as Record<string, unknown>) ?? {};
  const boolSettings: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(rawSettings)) {
    if (typeof v === "boolean") boolSettings[k] = v;
  }

  const activeKudos = user.kudos_received.filter((k) => !k.deleted_at);
  const deletedKudos = user.kudos_received.filter((k) => k.deleted_at);

  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-5xl mx-auto px-4 py-10">

          {/* Profile header */}
          <div className="flex items-start gap-5 mb-10">
            {user.image ? (
              <Image
                src={user.image}
                alt={`${fullName} avatar`}
                width={72}
                height={72}
                className="rounded-full flex-shrink-0"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div
                aria-hidden
                className="flex-shrink-0 flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72, background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-title)", fontSize: 28, fontWeight: 700 }}
              >
                {initials}
              </div>
            )}
            <div>
              <h1 style={{ font: "var(--text-app-title)", color: "var(--inst-navy)", marginBottom: 4 }}>
                {fullName}
              </h1>
              {metaParts.length > 0 && (
                <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)", marginBottom: 2 }}>
                  {metaParts.join(" · ")}
                </p>
              )}
              <p style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--lib-parchment)" }}>
                {user.email}
              </p>
            </div>
          </div>

          {/* My Shelf */}
          <section className="mb-10" aria-label="My kudos shelf">
            <h2 className="mb-3" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
              My Shelf
            </h2>
            <div
              className="relative rounded-sm px-4 pt-4 pb-6"
              style={{ background: "var(--wood-walnut)", minHeight: 180 }}
            >
              {user.kudos_received.length === 0 ? (
                <p style={{ color: "var(--wood-caramel)", font: "var(--text-app-ui)", fontSize: 13, fontStyle: "italic", paddingTop: 48, textAlign: "center" }}>
                  No kudos yet — write one for a teammate to get started.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 items-end" role="list" aria-label="My kudos books">
                  {activeKudos.map((k) => {
                    const recipientName = k.recipient
                      ? `${k.recipient.first_name} ${k.recipient.last_name}`
                      : (k.team_recipient?.name ?? "Team");
                    return (
                      <div key={k.id} role="listitem">
                        <BookSpine
                          id={k.id}
                          bookDesign={k.book_design}
                          recipientName={recipientName}
                          messageSnippet={k.message_text}
                        />
                      </div>
                    );
                  })}
                  {deletedKudos.map((k) => {
                    const recipientName = k.recipient
                      ? `${k.recipient.first_name} ${k.recipient.last_name}`
                      : (k.team_recipient?.name ?? "Team");
                    return (
                      <div key={k.id} role="listitem" className="relative" style={{ opacity: 0.45 }} title="This kudos was removed">
                        <BookSpine
                          id={k.id}
                          bookDesign={k.book_design}
                          recipientName={recipientName}
                          messageSnippet={k.message_text}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 4,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "var(--state-error-text)",
                            color: "var(--inst-white)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            padding: "1px 5px",
                            borderRadius: 2,
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                          aria-label="This kudos was removed"
                        >
                          Removed
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div
                style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 12, background: "var(--wood-walnut-deep)", borderRadius: "0 0 4px 4px" }}
                aria-hidden
              />
            </div>
          </section>

          {/* My Badges */}
          <section className="mb-10" aria-label="My badges">
            <h2 className="mb-3" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
              Badges
            </h2>
            {user.badge_awards.length === 0 ? (
              <div
                className="rounded-sm px-5 py-6 flex flex-col items-center gap-2"
                style={{ background: "var(--lib-parchment, #e8dcc8)", textAlign: "center" }}
              >
                <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", margin: 0 }}>
                  No badges yet.
                </p>
                <a
                  href="/celebrate"
                  style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--inst-navy)", fontWeight: 600, textDecoration: "underline" }}
                >
                  Celebrate a teammate to earn your first badge →
                </a>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {user.badge_awards.map((award) => (
                  <div
                    key={award.id}
                    className="group relative"
                    tabIndex={0}
                    role="button"
                    aria-label={`${award.badge.name}: ${award.badge.description}`}
                    style={{ outline: "none" }}
                  >
                    <div
                      className="flex items-center gap-2 rounded-sm px-3 py-2 cursor-default"
                      style={{ background: "var(--inst-navy)", color: "var(--inst-white)" }}
                    >
                      {award.badge.visual_asset && (
                        <span aria-hidden style={{ fontSize: 16 }}>{award.badge.visual_asset}</span>
                      )}
                      <span style={{ font: "var(--text-app-ui)", fontSize: 13, fontWeight: 600 }}>
                        {award.badge.name}
                      </span>
                    </div>
                    {/* Tooltip on hover/focus */}
                    <div
                      className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block group-focus:block"
                      style={{
                        background: "var(--lib-ink)",
                        color: "var(--lib-cream)",
                        font: "var(--text-app-ui)",
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 2,
                        maxWidth: 220,
                        whiteSpace: "normal",
                        pointerEvents: "none",
                      }}
                      role="tooltip"
                    >
                      {award.badge.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Divider */}
          <hr style={{ border: "none", borderTop: "1px solid var(--lib-parchment, #e8dcc8)", marginBottom: 32 }} />

          {/* Email Preferences */}
          <EmailPreferencesSection
            initialSettings={boolSettings}
            isManager={isManager}
          />

          {/* Divider */}
          <hr style={{ border: "none", borderTop: "1px solid var(--lib-parchment, #e8dcc8)", marginTop: 32, marginBottom: 32 }} />

          {/* Edit Profile */}
          <section aria-labelledby="edit-profile-heading" className="mb-10">
            <h2
              id="edit-profile-heading"
              className="mb-5"
              style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}
            >
              Edit Profile
            </h2>
            <p style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--lib-parchment)", marginBottom: 16 }}>
              Department and sub-team are admin-managed. Your email address cannot be changed.
            </p>
            <EditProfileForm
              initialFirstName={user.first_name}
              initialLastName={user.last_name}
              initialJobTitle={user.job_title}
            />
          </section>

          {/* Danger zone */}
          <div
            className="rounded-sm px-5 py-5 mt-4"
            style={{ border: "1px solid var(--state-error-text)", background: "var(--lib-cream)" }}
          >
            <h2
              className="mb-3"
              style={{ font: "var(--text-app-body-sm)", color: "var(--state-error-text)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}
            >
              Danger zone
            </h2>
            <DeletionSection
              isPendingDeletion={user.status === "pending_deletion"}
              pendingDeletionAt={user.pending_deletion_at?.toISOString() ?? null}
            />
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
