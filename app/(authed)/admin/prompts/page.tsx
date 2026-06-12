import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import PromptsManager from "@/components/admin/PromptsManager";

export default async function AdminPromptsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, tenant_id: true },
  });

  if (!user || user.role !== "admin") redirect("/library");

  const settings = await prisma.teamSettings.findUnique({
    where: { tenant_id: user.tenant_id },
    select: { prompt_queue_low_threshold: true, kudos_char_limit: true },
  });

  const threshold = settings?.prompt_queue_low_threshold ?? 2;
  const charLimit = settings?.kudos_char_limit ?? 500;

  const now = new Date();

  const allPrompts = await prisma.featuredPrompt.findMany({
    where: { tenant_id: user.tenant_id, is_default_rotation: false },
    orderBy: [
      { published_at: "desc" },
      { week_start_date: "asc" },
      { created_at: "desc" },
    ],
    select: {
      id: true,
      prompt_text: true,
      week_start_date: true,
      published_at: true,
      is_default_rotation: true,
    },
  });

  // Queue count = unpublished prompts with a scheduled week in the future
  const queueCount = allPrompts.filter(
    (p) => !p.published_at && p.week_start_date && new Date(p.week_start_date) >= now,
  ).length;

  // Serialize dates for client
  const serialized = allPrompts.map((p) => ({
    ...p,
    week_start_date: p.week_start_date ? p.week_start_date.toISOString() : null,
    published_at: p.published_at ? p.published_at.toISOString() : null,
  }));

  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <nav aria-label="Admin navigation" className="mb-6">
            <div className="flex gap-4" style={{ font: "var(--text-app-ui)", fontSize: 13 }}>
              <a href="/admin/settings" style={{ color: "var(--inst-navy)" }}>Settings</a>
              <a href="/admin/audit-log" style={{ color: "var(--inst-navy)" }}>Audit log</a>
              <span style={{ color: "var(--lib-ink)", fontWeight: 700 }}>Prompts</span>
            </div>
          </nav>

          <h1
            className="mb-2"
            style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
          >
            Featured prompts
          </h1>
          <p className="mb-8" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)" }}>
            Manage the weekly prompt queue. Scheduled prompts are published automatically on their week&apos;s Monday.
          </p>
          <PromptsManager
            initialPrompts={serialized}
            queueCount={queueCount}
            lowThreshold={threshold}
            charLimit={charLimit}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
