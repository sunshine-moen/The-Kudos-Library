"use client";

import { useState } from "react";

interface Props {
  isPendingDeletion: boolean;
  pendingDeletionAt: string | null;
}

export default function DeletionSection({ isPendingDeletion, pendingDeletionAt }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [working, setWorking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  async function handleRequestDeletion() {
    setWorking(true);
    setErrorMsg(null);
    const res = await fetch("/api/me/request-deletion", { method: "POST" });
    setWorking(false);
    if (res.ok) {
      setShowModal(false);
      window.location.reload();
    } else {
      const data = await res.json() as { error?: string };
      setErrorMsg(data.error ?? "Could not schedule deletion. Please try again.");
    }
  }

  async function handleCancelDeletion() {
    setWorking(true);
    setErrorMsg(null);
    const res = await fetch("/api/me/cancel-deletion", { method: "POST" });
    setWorking(false);
    if (res.ok) {
      setCancelled(true);
      window.location.reload();
    } else {
      const data = await res.json() as { error?: string };
      setErrorMsg(data.error ?? "Could not cancel deletion. Please try again.");
    }
  }

  if (cancelled) {
    return (
      <p role="status" style={{ font: "var(--text-app-ui)", fontSize: 14, color: "var(--state-success-text, #2d6a4f)" }}>
        Deletion cancelled. Your account is active.
      </p>
    );
  }

  return (
    <div>
      {isPendingDeletion && pendingDeletionAt ? (
        <div
          className="rounded-sm px-5 py-4 mb-4"
          style={{ background: "var(--state-error-bg, #fef2f2)", border: "1px solid var(--state-error-text)" }}
        >
          <p style={{ font: "var(--text-app-ui)", fontSize: 14, color: "var(--lib-ink)", margin: "0 0 12px" }}>
            Your account is scheduled for deletion on{" "}
            <strong>{new Date(pendingDeletionAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</strong>.
            All your data will be permanently removed.
          </p>
          {errorMsg && (
            <p role="alert" style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--state-error-text)", marginBottom: 8 }}>
              {errorMsg}
            </p>
          )}
          <button
            type="button"
            onClick={handleCancelDeletion}
            disabled={working}
            className="px-4 py-2 rounded-sm disabled:opacity-60"
            style={{ background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none" }}
          >
            {working ? "Cancelling…" : "Cancel deletion"}
          </button>
        </div>
      ) : (
        <>
          {errorMsg && (
            <p role="alert" style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--state-error-text)", marginBottom: 8 }}>
              {errorMsg}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-sm"
            style={{ background: "transparent", border: "1px solid var(--state-error-text)", color: "var(--state-error-text)", font: "var(--text-app-ui)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Delete my account
          </button>
        </>
      )}

      {/* Confirmation modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              background: "var(--lib-cream)",
              borderRadius: 4,
              padding: "32px 28px",
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <h2 id="delete-modal-title" style={{ font: "var(--text-app-title)", color: "var(--inst-navy)", fontSize: 22, marginBottom: 16 }}>
              Are you sure?
            </h2>
            <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", marginBottom: 8, lineHeight: 1.6 }}>
              Requesting deletion will schedule permanent removal of your account in 30 days:
            </p>
            <ul style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontSize: 14, lineHeight: 1.8, paddingLeft: 20, marginBottom: 24 }}>
              <li>Your kudos will be anonymized</li>
              <li>Your badges and library history will be removed</li>
              <li>You will be signed out immediately</li>
            </ul>
            <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)", fontSize: 13, marginBottom: 24 }}>
              You can cancel the deletion any time within 30 days via a link in the confirmation email.
            </p>
            {errorMsg && (
              <p role="alert" style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--state-error-text)", marginBottom: 12 }}>
                {errorMsg}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRequestDeletion}
                disabled={working}
                className="px-5 py-2 rounded-sm disabled:opacity-60"
                style={{ background: "var(--state-error-text)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none" }}
              >
                {working ? "Scheduling…" : "Yes, delete my account"}
              </button>
              <button
                type="button"
                onClick={() => { setShowModal(false); setErrorMsg(null); }}
                className="px-5 py-2 rounded-sm"
                style={{ background: "transparent", border: "1px solid var(--lib-parchment)", color: "var(--lib-ink)", font: "var(--text-app-ui)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
