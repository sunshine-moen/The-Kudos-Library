import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — The Kudos Library",
};

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="mb-8" style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)", fontSize: 13 }}>
        Effective date: June 2026 — Arcadian Grove Library, Annual Giving team
      </p>

      <section aria-labelledby="section-platform" className="mb-8">
        <h2
          id="section-platform"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          About this platform
        </h2>
        <p>
          The Kudos Library is an internal staff recognition platform operated by the UBC Annual Giving Digital
          Experience team for Arcadian Grove Library staff. It is not a public service. Access is limited to
          staff members who have been added to the platform by an administrator. Use of this platform is subject
          to UBC&apos;s Acceptable Use Policy for information technology resources.
        </p>
      </section>

      <section aria-labelledby="section-acceptable-use" className="mb-8">
        <h2
          id="section-acceptable-use"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          Acceptable use
        </h2>
        <p className="mb-3">
          Kudos must be genuine, specific, and respectful. By using this platform you agree not to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Submit kudos that are dishonest, misleading, or intended to harm a colleague&apos;s reputation.</li>
          <li>Use kudos to harass, demean, or target an individual.</li>
          <li>Use the platform for any purpose unrelated to team recognition.</li>
          <li>Attempt to access, modify, or delete data belonging to other users without authorisation.</li>
          <li>Circumvent platform access controls or the ToS acceptance gate.</li>
        </ul>
        <p className="mt-3">
          Administrators reserve the right to remove kudos content that violates these terms and to deactivate
          accounts that are used inappropriately.
        </p>
      </section>

      <section aria-labelledby="section-data-ownership" className="mb-8">
        <h2
          id="section-data-ownership"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          Data ownership
        </h2>
        <p className="mb-3">
          Kudos you submit become part of the team&apos;s shared recognition record and are visible to all members
          of Arcadian Grove Library staff with access to the platform. The UBC Annual Giving team retains
          responsibility for the data held in this platform.
        </p>
        <p>
          Kudos text is preserved for team history even after the submitting account is deleted, but your name
          is removed from that content. You retain no right to demand removal of kudos text once submitted,
          beyond the account deletion process described in our{" "}
          <Link href="/privacy" style={{ color: "var(--inst-navy)" }} className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="section-account-deletion" className="mb-8">
        <h2
          id="section-account-deletion"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          Account deletion
        </h2>
        <p>
          You may request deletion of your account at any time from your profile page. After a 30-day grace
          period, your account will be anonymised. During the 30-day window you may cancel the deletion request.
          Once the 30-day period has passed, anonymisation is permanent and cannot be reversed. Staff offboarding
          may also result in account deactivation at the discretion of an administrator.
        </p>
      </section>

      <section aria-labelledby="section-changes" className="mb-8">
        <h2
          id="section-changes"
          className="mb-3"
          style={{ font: "var(--text-app-ui)", fontWeight: 700, fontSize: 18, color: "var(--inst-navy)" }}
        >
          Changes to these terms
        </h2>
        <p>
          The UBC Annual Giving team may update these terms from time to time. If material changes are made,
          users will be prompted to re-accept. Continued use of the platform after changes take effect
          constitutes acceptance of the revised terms.
        </p>
      </section>

      <hr style={{ borderColor: "var(--wood-walnut-deep)", margin: "2rem 0" }} />
      <p style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)" }}>
        Also see:{" "}
        <Link href="/privacy" style={{ color: "var(--inst-navy)" }} className="underline">
          Privacy Policy
        </Link>
      </p>
    </main>
  );
}
