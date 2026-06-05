"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth/actions";

interface Props {
  role: string;
  userInitial: string;
  userName: string;
}

const NAV_LINKS = [
  { href: "/library", label: "Library" },
  { href: "/celebrate", label: "Give kudos" },
];

export default function NavLinks({ role, userInitial, userName }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const desktopLinkStyle = (href: string): React.CSSProperties => ({
    color: isActive(href) ? "var(--inst-gold)" : "var(--header-text)",
    font: "var(--text-app-ui)",
    fontSize: 14,
    textDecoration: "none",
    fontWeight: isActive(href) ? 600 : 400,
    borderBottom: isActive(href) ? "2px solid var(--inst-gold)" : "2px solid transparent",
    paddingBottom: 2,
    transition: "color 150ms ease, border-color 150ms ease",
  });

  const mobileLinkStyle = (href: string): React.CSSProperties => ({
    color: isActive(href) ? "var(--inst-gold)" : "var(--header-text)",
    font: "var(--text-app-ui)",
    fontSize: 14,
    textDecoration: "none",
    fontWeight: isActive(href) ? 600 : 400,
    borderLeft: isActive(href) ? "3px solid var(--inst-gold)" : "3px solid transparent",
    paddingLeft: 10,
    display: "block",
  });

  return (
    <>
      {/* Desktop nav links */}
      <div className="hidden sm:flex items-center gap-6">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={desktopLinkStyle(link.href)}>
            {link.label}
          </Link>
        ))}
        {role === "admin" && (
          <Link href="/admin/roster" style={desktopLinkStyle("/admin")}>
            Admin
          </Link>
        )}
      </div>

      {/* User avatar + dropdown (desktop) */}
      <div className="hidden sm:flex items-center gap-3 relative">
        <button
          type="button"
          aria-label={`User menu for ${userName}`}
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
          onClick={() => setUserMenuOpen((o) => !o)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--inst-gold)",
            color: "var(--inst-navy)",
            font: "var(--text-app-ui)",
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {userInitial}
        </button>
        {userMenuOpen && (
          <div
            role="menu"
            aria-label="User options"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "var(--inst-white)",
              border: "1px solid var(--wood-walnut-deep)",
              borderRadius: 4,
              minWidth: 148,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              zIndex: 100,
            }}
          >
            <div
              style={{
                padding: "8px 14px",
                font: "var(--text-app-ui)",
                fontSize: 12,
                color: "var(--lib-ink)",
                borderBottom: "1px solid var(--wood-walnut-deep)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {userName}
              {role === "admin" && (
                <span
                  style={{
                    fontSize: 10,
                    background: "var(--inst-navy)",
                    color: "var(--inst-gold)",
                    borderRadius: 3,
                    padding: "1px 5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Admin
                </span>
              )}
            </div>
            <form action={logout} style={{ display: "contents" }}>
              <button
                type="submit"
                role="menuitem"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 14px",
                  font: "var(--text-app-ui)",
                  fontSize: 13,
                  color: "var(--lib-ink)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Hamburger (mobile) */}
      <button
        type="button"
        className="sm:hidden"
        aria-label={menuOpen ? "Close menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        onClick={() => setMenuOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--inst-white)",
          padding: 6,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <span style={{ display: "block", width: 22, height: 2, background: "currentColor", borderRadius: 1 }} />
        <span style={{ display: "block", width: 22, height: 2, background: "currentColor", borderRadius: 1 }} />
        <span style={{ display: "block", width: 22, height: 2, background: "currentColor", borderRadius: 1 }} />
      </button>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="sm:hidden"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--inst-navy)",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            padding: "12px 16px 16px",
            zIndex: 50,
          }}
        >
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={mobileLinkStyle(link.href)}
              >
                {link.label}
              </Link>
            ))}
            {role === "admin" && (
              <Link
                href="/admin/roster"
                onClick={() => setMenuOpen(false)}
                style={mobileLinkStyle("/admin")}
              >
                Admin
              </Link>
            )}
            <form action={logout}>
              <button
                type="submit"
                style={{
                  color: "var(--header-text)",
                  font: "var(--text-app-ui)",
                  fontSize: 14,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  paddingLeft: 13,
                  borderLeft: "3px solid transparent",
                  display: "block",
                }}
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      )}
    </>
  );
}
