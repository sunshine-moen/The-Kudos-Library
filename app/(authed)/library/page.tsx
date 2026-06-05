import NavHeader from "@/components/layout/NavHeader";
import Footer from "@/components/layout/Footer";
import { PRODUCT_COPY } from "@/lib/content/hardcoded";

export default function LibraryPage() {
  return (
    <>
      <NavHeader />
      <main id="main-content" style={{ background: "var(--lib-cream)", minHeight: "80vh" }}>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1
            className="mb-4"
            style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
          >
            {PRODUCT_COPY.hero.tagline}
          </h1>
          <p
            className="mb-12 max-w-xl mx-auto"
            style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)" }}
          >
            {PRODUCT_COPY.hero.subline}
          </p>

          {/* Shelf placeholder — wired in Phase B */}
          <div
            className="rounded-sm p-12 text-center"
            style={{ border: "2px dashed var(--wood-walnut-deep)", color: "var(--lib-parchment)", font: "var(--text-app-ui)" }}
          >
            Your team&apos;s shelves will appear here. Give a kudos to start building the library.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
