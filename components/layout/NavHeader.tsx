import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import NavLinks from "./NavLinks";

// SVG crest mark (simplified chevron representing the library crest)
function CrestMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="24" height="24" rx="3" fill="var(--inst-gold-heritage)" />
      <path d="M14 6 L22 13 L14 20 L6 13 Z" fill="none" stroke="var(--inst-navy)" strokeWidth="1.5" />
      <circle cx="14" cy="13" r="3" fill="var(--inst-navy)" />
    </svg>
  );
}

export default async function NavHeader() {
  const session = await auth();
  let role = "user";
  let firstName = "";
  let lastName = "";

  if (session?.user?.id) {
    const member = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, first_name: true, last_name: true },
    });
    if (member) {
      role = member.role;
      firstName = member.first_name;
      lastName = member.last_name;
    }
  }

  const userInitial = firstName ? (firstName[0] ?? "?").toUpperCase() : "?";
  const userName = [firstName, lastName].filter(Boolean).join(" ") || "Account";

  return (
    <header
      style={{ background: "var(--header-bg)", color: "var(--header-text)", position: "relative" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo / crest */}
        <a
          href="/library"
          className="flex items-center gap-2 shrink-0"
          style={{ textDecoration: "none" }}
          aria-label="The Kudos Library — home"
        >
          <CrestMark />
          <span
            style={{
              color: "var(--inst-gold)",
              font: "var(--text-app-ui)",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "-0.02em",
            }}
          >
            The Kudos Library
          </span>
        </a>

        {/* Nav links + user menu (client — needs usePathname) */}
        <NavLinks role={role} userInitial={userInitial} userName={userName} />
      </div>
    </header>
  );
}
