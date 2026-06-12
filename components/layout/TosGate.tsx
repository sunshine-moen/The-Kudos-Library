"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { PRODUCT_COPY } from "@/lib/content/hardcoded";

export default function TosGate() {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const router = useRouter();

  async function handleAccept() {
    setAccepting(true);
    await fetch("/api/me/tos-accept", { method: "POST" });
    router.refresh();
  }

  async function handleDecline() {
    setDeclining(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tos-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-md rounded-sm p-8 shadow-lg"
        style={{ background: "var(--lib-cream)", color: "var(--lib-ink)" }}
      >
        <h2
          id="tos-title"
          className="mb-4"
          style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
        >
          Before you continue
        </h2>
        <p className="mb-6" style={{ font: "var(--text-app-body-sm)" }}>
          Please read and accept our{" "}
          <a href="/terms" target="_blank" style={{ color: "var(--inst-navy)" }} className="underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" style={{ color: "var(--inst-navy)" }} className="underline">
            Privacy Policy
          </a>{" "}
          to continue using The Kudos Library.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            disabled={accepting || declining}
            className="w-full rounded-sm px-4 py-2 disabled:opacity-60"
            style={{
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              font: "var(--text-app-ui)",
              fontWeight: 600,
            }}
          >
            {accepting ? "Saving…" : PRODUCT_COPY.onboarding.tosAccept}
          </button>
          <button
            onClick={handleDecline}
            disabled={accepting || declining}
            className="w-full rounded-sm px-4 py-2 disabled:opacity-60"
            style={{
              background: "transparent",
              color: "var(--lib-parchment)",
              font: "var(--text-app-ui)",
              border: "1px solid var(--wood-walnut-deep)",
            }}
          >
            {declining ? "Signing out…" : PRODUCT_COPY.onboarding.tosDecline}
          </button>
        </div>
      </div>
    </div>
  );
}
