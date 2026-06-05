import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="py-6 px-4 text-center"
      style={{ borderTop: "1px solid var(--wood-walnut-deep)", background: "var(--lib-cream)" }}
    >
      <nav aria-label="Footer navigation" className="flex justify-center gap-6">
        <Link
          href="/privacy"
          className="text-sm"
          style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)", textDecoration: "none" }}
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="text-sm"
          style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)", textDecoration: "none" }}
        >
          Terms of Service
        </Link>
      </nav>
    </footer>
  );
}
