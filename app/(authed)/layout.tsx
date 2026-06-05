import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import TosGate from "@/components/layout/TosGate";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tos_accepted_at: true },
  });

  const needsTos = !member?.tos_accepted_at;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:px-4 focus:py-2"
        style={{
          background: "var(--inst-navy)",
          color: "var(--inst-white)",
          font: "var(--text-app-ui)",
        }}
      >
        Skip to main content
      </a>
      {needsTos && <TosGate />}
      {children}
    </>
  );
}
