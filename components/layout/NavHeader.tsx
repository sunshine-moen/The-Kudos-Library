import Link from "next/link";
import { signOut } from "@/lib/auth/auth";

export default function NavHeader() {
  return (
    <header style={{ background: "var(--inst-navy)", color: "var(--inst-white)" }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <nav aria-label="Main navigation">
          <Link
            href="/library"
            style={{ color: "var(--inst-gold)", font: "var(--text-app-ui)", fontWeight: 600, textDecoration: "none" }}
          >
            The Kudos Library
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/celebrate"
            className="text-sm"
            style={{ color: "var(--inst-white)", font: "var(--text-app-ui)", textDecoration: "none" }}
          >
            Give kudos
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm"
              style={{ color: "var(--inst-white)", font: "var(--text-app-ui)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
