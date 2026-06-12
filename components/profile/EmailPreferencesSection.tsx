"use client";

import { useState } from "react";

interface Toggle {
  key: string;
  label: string;
  description: string;
  managerOnly?: boolean;
  locked?: boolean;
}

const TOGGLES: Toggle[] = [
  {
    key: "recipient_notify",
    label: "Kudos notifications",
    description: "Email you when you receive a new kudos.",
    locked: true,
  },
  {
    key: "inactive_giver_nudge",
    label: "Inactivity nudge",
    description: "Remind you if you haven't given kudos in a while.",
  },
  {
    key: "top_giver_thank_you",
    label: "Top giver announcement",
    description: "Notify you when you're recognized as a top kudos giver.",
  },
  {
    key: "kudos_was_read_digest",
    label: "Read digest",
    description: "Weekly summary of which kudos you gave have been read.",
  },
  {
    key: "prompt_of_the_week",
    label: "Weekly prompt",
    description: "Get this week's featured writing prompt delivered to your inbox.",
  },
  {
    key: "anniversary_reminders",
    label: "Anniversary reminders",
    description: "Notify you when a direct report's work anniversary is coming up.",
    managerOnly: true,
  },
  {
    key: "overlooked_recipient_nudge",
    label: "Overlooked recipient nudge",
    description: "Alert you when a team member hasn't received kudos in a while.",
    managerOnly: true,
  },
  {
    key: "manager_digest",
    label: "Manager digest",
    description: "Weekly summary of kudos activity across your team.",
    managerOnly: true,
  },
];

interface Props {
  initialSettings: Record<string, boolean>;
  isManager: boolean;
}

export default function EmailPreferencesSection({ initialSettings, isManager }: Props) {
  const [settings, setSettings] = useState<Record<string, boolean>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const visibleToggles = TOGGLES.filter((t) => !t.managerOnly || isManager);

  async function handleToggle(key: string, value: boolean) {
    if (key === "recipient_notify") return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaving(true);
    setSaveState("idle");

    const res = await fetch("/api/me/email-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });

    setSaving(false);
    if (res.ok) {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } else {
      setSaveState("error");
      setSettings((prev) => ({ ...prev, [key]: !value })); // revert
    }
  }

  return (
    <section aria-labelledby="email-prefs-heading">
      <div className="flex items-center justify-between mb-4">
        <h2
          id="email-prefs-heading"
          style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}
        >
          Email preferences
        </h2>
        {saving && (
          <span style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)" }}>
            Saving…
          </span>
        )}
        {saveState === "saved" && (
          <span role="status" style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--state-success-text, #2d6a4f)" }}>
            Saved
          </span>
        )}
        {saveState === "error" && (
          <span role="alert" style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--state-error-text)" }}>
            Could not save — try again
          </span>
        )}
      </div>

      <div
        className="rounded-sm"
        style={{ background: "var(--inst-white, #fff)", border: "1px solid var(--lib-parchment)" }}
      >
        {visibleToggles.map((toggle, i) => {
          const isOn = toggle.locked ? true : (settings[toggle.key] !== false);
          return (
            <div
              key={toggle.key}
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: i < visibleToggles.length - 1 ? "1px solid var(--lib-parchment)" : "none",
              }}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600, margin: "0 0 2px" }}>
                  {toggle.label}
                  {toggle.locked && (
                    <span
                      aria-label="cannot be changed"
                      style={{ marginLeft: 6, fontSize: 12, color: "var(--lib-parchment)" }}
                    >
                      🔒
                    </span>
                  )}
                </p>
                <p style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)", margin: 0 }}>
                  {toggle.description}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isOn}
                aria-label={toggle.label}
                disabled={toggle.locked || saving}
                onClick={() => handleToggle(toggle.key, !isOn)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: "none",
                  cursor: toggle.locked ? "default" : "pointer",
                  background: isOn ? "var(--inst-navy)" : "var(--lib-parchment)",
                  position: "relative",
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: isOn ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "white",
                    transition: "left 0.15s",
                  }}
                />
                <span className="sr-only">{isOn ? "On" : "Off"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
