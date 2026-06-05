import CelebrateForm from "@/components/kudos/CelebrateForm";

export default function CelebratePage() {
  return (
    <main id="main-content" className="px-4 py-10" style={{ background: "var(--lib-cream)", minHeight: "100vh" }}>
      <h1
        className="mb-8 text-center"
        style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
      >
        Celebrate a colleague
      </h1>
      <CelebrateForm />
    </main>
  );
}
