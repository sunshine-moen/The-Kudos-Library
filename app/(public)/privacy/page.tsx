import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — The Kudos Library",
};

export default function PrivacyPage() {
  return (
    <main
      id="main-content"
      className="max-w-2xl mx-auto px-6 py-12"
      style={{ color: "var(--lib-ink)", font: "var(--text-app-body-sm)" }}
    >
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/"
          style={{ color: "var(--inst-navy)", textDecoration: "none", font: "var(--text-app-ui)", fontSize: 14 }}
        >
          ← The Kudos Library
        </Link>
      </nav>

      <h1
        className="mb-2"
        style={{ font: "var(--text-app-title)", color: "var(--inst-navy)", fontSize: 28 }}
      >
        Privacy Policy
      </h1>
      <p className="mb-8" style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)", fontSize: 13 }}>
        Effective date: June 2026 — Arcadian Grove Library, Annual Giving team
      </p>

      <section aria-labelledby="section-overview" className="mb-8">
        <h2
          id="section-overview"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          About this policy
        </h2>
        <p className="mb-3">
          The Kudos Library is an internal recognition platform operated by the UBC Annual Giving Digital
          Experience team. This policy describes what data is collected, how it is used, and how long it is kept.
          This platform is not a public service and is available only to staff members of Arcadian Grove Library.
        </p>
      </section>

      <section aria-labelledby="section-data-collected" className="mb-8">
        <h2
          id="section-data-collected"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          Data we collect
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account information:</strong> your name, email address, job title, and department, as
            provided during onboarding.
          </li>
          <li>
            <strong>Kudos content:</strong> the text you write in kudos, the recipient you select, value tags,
            and any context category you choose.
          </li>
          <li>
            <strong>Usage data:</strong> which kudos you have opened and when, for the purpose of the reading
            indicator feature.
          </li>
          <li>
            <strong>Session data:</strong> login timestamps and device confirmation records (stored as hashed
            identifiers, not raw device data).
          </li>
          <li>
            <strong>Administrator records:</strong> audit log entries for admin actions taken within the platform.
          </li>
        </ul>
      </section>

      <section aria-labelledby="section-data-use" className="mb-8">
        <h2
          id="section-data-use"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          How we use your data
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To display kudos on the library shelves visible to your team.</li>
          <li>To send email notifications about kudos you have received.</li>
          <li>To deliver weekly manager digests and badge milestone emails.</li>
          <li>
            To generate leaderboards and usage summaries shared internally within Arcadian Grove Library.
          </li>
        </ul>
        <p className="mt-3">
          Your data is not sold, shared with advertisers, or disclosed to third parties outside the UBC Annual
          Giving team, except as required by law.
        </p>
      </section>

      <section aria-labelledby="section-retention" className="mb-8">
        <h2
          id="section-retention"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          Data retention
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account data:</strong> retained while your account is active. On deletion, your name is
            removed and your account is anonymised within 30 days of requesting deletion.
          </li>
          <li>
            <strong>Kudos content:</strong> the text of kudos you gave is preserved for team history after your
            account is deleted, but your name is removed. Kudos you received are kept on the recipient&apos;s shelf.
          </li>
          <li>
            <strong>Audit logs:</strong> administrative audit log entries are retained for 365 days, then deleted.
          </li>
          <li>
            <strong>Email send logs:</strong> kept for 90 days for deliverability troubleshooting.
          </li>
        </ul>
      </section>

      <section aria-labelledby="section-deletion" className="mb-8">
        <h2
          id="section-deletion"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          Requesting account deletion
        </h2>
        <p className="mb-3">
          You can request deletion of your account from your{" "}
          <Link href="/profile" style={{ color: "var(--inst-navy)" }} className="underline">
            profile page
          </Link>
          . After requesting deletion, you have a 30-day window to cancel. After 30 days, your account is
          anonymised: your name is replaced with &quot;Deleted User&quot;, your email address is replaced with a
          non-deliverable sentinel address, and your badge awards and reading history are deleted permanently.
          Kudos text is preserved without attribution.
        </p>
      </section>

      <section aria-labelledby="section-contact" className="mb-8">
        <h2
          id="section-contact"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          Contact
        </h2>
        <p>
          Questions about this policy or requests related to your data should be directed to the UBC Annual
          Giving Digital Experience team. Contact your administrator or reach out via the internal team channel.
        </p>
      </section>

      <hr style={{ borderColor: "var(--wood-walnut-deep)", margin: "2rem 0" }} />
      <p style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)" }}>
        Also see:{" "}
        <Link href="/terms" style={{ color: "var(--inst-navy)" }} className="underline">
          Terms of Service
        </Link>
      </p>
    </main>
  );
}
