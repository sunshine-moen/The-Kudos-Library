import Link from "next/link";

function UbcCrestMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="18" height="18" rx="2" fill="var(--inst-gold-heritage)" opacity="0.7" />
      <path d="M10 4 L16 9.5 L10 15 L4 9.5 Z" fill="none" stroke="var(--lib-ink)" strokeWidth="1.2" />
      <circle cx="10" cy="9.5" r="2" fill="var(--lib-ink)" opacity="0.6" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      className="py-6 px-4 text-center"
      style={{ borderTop: "1px solid var(--wood-walnut-deep)", background: "var(--lib-cream)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <UbcCrestMark />
        <nav aria-label="Footer navigation" className="flex justify-center gap-6">
          <Link
            href="/privacy"
            style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)", fontSize: 13, textDecoration: "none" }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)", fontSize: 13, textDecoration: "none" }}
          >
            Terms of Service
          </Link>
        </nav>
        <p
          style={{
            font: "var(--text-app-ui)",
            fontSize: 11,
            color: "var(--lib-parchment)",
            margin: 0,
          }}
        >
          The Kudos Library — AG Digital Experience Team
        </p>
      </div>
    </footer>
  );
}
