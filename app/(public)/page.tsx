import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { PRODUCT_COPY } from "@/lib/content/hardcoded";
import Footer from "@/components/layout/Footer";

const PREVIEW_BOOKS = [
  { design: "classic-navy", label: "Team spirit" },
  { design: "forest-green", label: "Collaboration" },
  { design: "burgundy", label: "Leadership" },
  { design: "warm-terracotta", label: "Creativity" },
];

const SPINE_COLORS: Record<string, string> = {
  "classic-navy": "var(--spine-navy)",
  "forest-green": "var(--spine-green)",
  "burgundy": "var(--spine-oxblood)",
  "warm-terracotta": "var(--spine-brick)",
};

export default async function MarketingPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/library");

  const btnStyle = {
    display: "inline-block",
    background: "var(--btn-primary-bg)",
    color: "var(--btn-primary-text)",
    font: "var(--text-app-ui)",
    fontWeight: 700,
    fontSize: 16,
    padding: "14px 32px",
    borderRadius: 2,
    textDecoration: "none",
    letterSpacing: "0.02em",
  };

  return (
    <>
      <a href="#main-content" className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:p-4 focus-visible:z-50" style={{ background: "var(--lib-cream)", color: "var(--inst-navy)" }}>
        Skip to main content
      </a>

      <main id="main-content" style={{ background: "var(--lib-cream)" }}>

        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          style={{ background: "var(--inst-navy)", padding: "80px 24px 72px", textAlign: "center" }}
        >
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h1
              id="hero-heading"
              style={{ font: "var(--text-mk-hero)", color: "var(--inst-gold)", marginBottom: 16 }}
            >
              {PRODUCT_COPY.marketing.title}
            </h1>
            <p
              style={{ font: "var(--text-mk-lede)", color: "var(--lib-cream)", marginBottom: 36, lineHeight: 1.5 }}
            >
              {PRODUCT_COPY.marketing.tagline}
            </p>
            <a href="/login" style={btnStyle}>
              {PRODUCT_COPY.marketing.cta}
            </a>
          </div>
        </section>

        {/* What it is */}
        <section
          aria-labelledby="what-heading"
          style={{ padding: "64px 24px", maxWidth: 680, margin: "0 auto" }}
        >
          <h2
            id="what-heading"
            style={{ font: "var(--text-app-title)", color: "var(--inst-navy)", marginBottom: 16, fontSize: 22 }}
          >
            What is it?
          </h2>
          <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", lineHeight: 1.7, fontSize: 16 }}>
            {PRODUCT_COPY.marketing.whatItIs}
          </p>
        </section>

        {/* Preview bookshelf */}
        <section
          aria-label="Preview of kudos shelf"
          style={{ background: "var(--wood-walnut)", padding: "40px 24px 52px", position: "relative" }}
        >
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <p style={{ font: "var(--text-app-ui)", color: "var(--wood-caramel)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20, fontWeight: 700 }}>
              A glimpse of the shelf
            </p>
            <div
              className="flex gap-3 items-end"
              role="list"
              aria-label="Example kudos books"
            >
              {PREVIEW_BOOKS.map((book) => (
                <div
                  key={book.design}
                  role="listitem"
                  aria-label={`Example book: ${book.label}`}
                  style={{
                    width: 44,
                    height: 110,
                    background: SPINE_COLORS[book.design] ?? "var(--spine-navy)",
                    borderRadius: "2px 2px 0 0",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 8,
                    boxShadow: "2px 0 4px rgba(0,0,0,0.2)",
                  }}
                >
                  <span
                    style={{
                      writingMode: "vertical-rl",
                      textOrientation: "mixed",
                      transform: "rotate(180deg)",
                      font: "var(--text-app-ui)",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.7)",
                      letterSpacing: "0.05em",
                      overflow: "hidden",
                      maxHeight: 90,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    aria-hidden
                  >
                    {book.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Shelf ledge */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 14,
              background: "var(--wood-walnut-deep)",
            }}
            aria-hidden
          />
        </section>

        {/* How it works */}
        <section
          aria-labelledby="how-heading"
          style={{ padding: "64px 24px", maxWidth: 680, margin: "0 auto" }}
        >
          <h2
            id="how-heading"
            style={{ font: "var(--text-app-title)", color: "var(--inst-navy)", marginBottom: 24, fontSize: 22 }}
          >
            How it works
          </h2>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }} role="list">
            {PRODUCT_COPY.marketing.howItWorks.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  marginBottom: 20,
                  font: "var(--text-app-body-sm)",
                  color: "var(--lib-ink)",
                  fontSize: 16,
                  lineHeight: 1.6,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--inst-navy)",
                    color: "var(--inst-white)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {i + 1}
                </span>
                <span>
                  <strong>{item.step}</strong> {item.body}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Bottom CTA */}
        <section
          style={{ background: "var(--inst-navy)", padding: "64px 24px", textAlign: "center" }}
          aria-label="Call to action"
        >
          <p style={{ font: "var(--text-mk-lede)", color: "var(--lib-cream)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
            {PRODUCT_COPY.hero.subline}
          </p>
          <a href="/login" style={btnStyle}>
            {PRODUCT_COPY.marketing.cta}
          </a>
        </section>

      </main>

      <Footer />
    </>
  );
}
