"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmDeviceForm({ kudosId }: { kudosId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    const res = await fetch("/api/auth/confirm-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kudos_id: kudosId }),
    });
    if (res.ok) {
      router.push(`/book/${kudosId}`);
    } else {
      setError("Something went wrong. Please try again or request a new link.");
      setConfirming(false);
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--lib-cream)" }}
    >
      <div className="w-full max-w-sm px-6 text-center">
        <h1
          className="mb-4"
          style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
        >
          Is this you?
        </h1>
        <p className="mb-8" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)" }}>
          We don&apos;t recognise this device. Confirm it&apos;s you to continue to your kudos.
        </p>

        {error && (
          <p
            className="mb-4 rounded px-3 py-2 text-sm"
            style={{ background: "var(--state-error-bg)", color: "var(--state-error-text)" }}
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full rounded-sm px-4 py-3 disabled:opacity-60"
          style={{
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            font: "var(--text-app-ui)",
            fontWeight: 600,
          }}
        >
          {confirming ? "Confirming…" : "Yes, this is me"}
        </button>
      </div>
    </main>
  );
}
