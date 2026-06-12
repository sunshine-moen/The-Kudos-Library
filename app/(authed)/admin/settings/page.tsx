import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, tenant_id: true },
  });

  if (!user || user.role !== "admin") redirect("/library");

  const settings = await prisma.teamSettings.findUnique({
    where: { tenant_id: user.tenant_id },
  });

  if (!settings) redirect("/library");

  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1
            className="mb-2"
            style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
          >
            Team settings
          </h1>
          <p className="mb-10" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)" }}>
            Changes take effect on the next kudos submission or cron run.
          </p>
          <AdminSettingsForm initialSettings={settings} />
        </div>
      </main>
      <Footer />
    </>
  );
}
