"use client";

import { useState, useEffect } from "react";

interface Props {
  recipientName: string;
  editWindowExpiresAt: Date;
  onEdit: () => void;
  kudosId: string;
}

export default function ConfirmationModal({ recipientName, editWindowExpiresAt, onEdit }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((editWindowExpiresAt.getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((editWindowExpiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [editWindowExpiresAt, secondsLeft]);

  const windowOpen = secondsLeft > 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div
      className="rounded-sm p-8 text-center max-w-md mx-auto"
      style={{ background: "var(--lib-cream)", border: "1px solid var(--wood-walnut-deep)" }}
    >
      <p
        className="mb-2"
        style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
      >
        Thanks for celebrating {recipientName}!
      </p>

      {windowOpen ? (
        <>
          <p className="mb-4" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)" }}>
            Your kudos will be delivered in{" "}
            <strong>
              {minutes}:{String(seconds).padStart(2, "0")}
            </strong>
            . You can still edit it before then.
          </p>
          <button
            onClick={onEdit}
            className="px-6 py-2 rounded-sm border"
            style={{
              borderColor: "var(--inst-navy)",
              color: "var(--inst-navy)",
              font: "var(--text-app-ui)",
              fontWeight: 600,
            }}
          >
            Edit kudos
          </button>
        </>
      ) : (
        <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)" }}>
          Your kudos has been delivered.
        </p>
      )}
    </div>
  );
}
