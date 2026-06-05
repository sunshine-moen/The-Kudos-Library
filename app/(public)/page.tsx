import { PRODUCT_COPY } from "@/lib/content/hardcoded";

export default function MarketingPage() {
  return (
    <main id="main-content" className="min-h-screen" style={{ background: "var(--lib-cream)" }}>
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1
          className="mb-4"
          style={{ font: "var(--text-mk-hero)", color: "var(--inst-navy)" }}
        >
          The Kudos Library
        </h1>
        <p
          className="mb-12"
          style={{ font: "var(--text-mk-lede)", color: "var(--lib-ink)" }}
        >
          {PRODUCT_COPY.hero.tagline}
        </p>
        <a
          href="/login"
          className="inline-block rounded-sm px-8 py-3"
          style={{
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            font: "var(--text-app-ui)",
            fontWeight: 600,
          }}
        >
          {PRODUCT_COPY.marketing.cta}
        </a>
      </div>
    </main>
  );
}
