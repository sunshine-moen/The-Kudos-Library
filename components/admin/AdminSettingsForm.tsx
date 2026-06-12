"use client";

import { useState } from "react";

interface Settings {
  edit_window_minutes: number;
  max_kudos_per_day_per_giver: number;
  kudos_char_limit: number;
  context_char_limit: number;
  context_required: boolean;
  leaderboard_top_n_week: number;
  leaderboard_top_n_month: number;
  inactive_threshold_weeks: number;
  overlooked_recipient_window_days: number;
  anniversary_reminder_advance_days: number;
  prompt_queue_low_threshold: number;
  timezone: string;
  max_admins: number;
}

// Common Canadian/US timezones shown first; full list available via Intl
const COMMON_TIMEZONES = [
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Toronto",
  "America/Halifax",
  "America/St_Johns",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

interface Props {
  initialSettings: Settings;
}

export default function AdminSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function setField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveState("idle");
    setErrorMsg(null);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    if (res.ok) {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } else {
      const data = await res.json() as { error?: string };
      setErrorMsg(data.error ?? "Could not save settings.");
      setSaveState("error");
    }
  }

  const inputStyle = {
    width: "100%",
    borderRadius: 2,
    border: "1px solid var(--wood-walnut-deep)",
    background: "var(--lib-cream)",
    font: "var(--text-app-ui)",
    color: "var(--lib-ink)",
    padding: "8px 10px",
  };

  const labelStyle = {
    display: "block",
    font: "var(--text-app-ui)",
    fontWeight: 600,
    color: "var(--lib-ink)",
    marginBottom: 4,
    fontSize: 14,
  };

  const descStyle = {
    font: "var(--text-app-ui)",
    fontSize: 12,
    color: "var(--lib-parchment)",
    margin: "2px 0 8px",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* Recognition settings */}
      <section aria-labelledby="recognition-heading">
        <h2 id="recognition-heading" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, marginBottom: 16 }}>
          Recognition
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="edit_window_minutes" style={labelStyle}>Edit window (minutes)</label>
            <p style={descStyle}>How long a giver can edit a kudos after submitting (5–60).</p>
            <input id="edit_window_minutes" type="number" min={5} max={60} value={settings.edit_window_minutes} onChange={(e) => setField("edit_window_minutes", parseInt(e.target.value) || 15)} style={inputStyle} required />
          </div>
          <div>
            <label htmlFor="max_kudos_per_day" style={labelStyle}>Max kudos per giver per day</label>
            <p style={descStyle}>Rate limit applied at submission time.</p>
            <input id="max_kudos_per_day" type="number" min={1} max={100} value={settings.max_kudos_per_day_per_giver} onChange={(e) => setField("max_kudos_per_day_per_giver", parseInt(e.target.value) || 30)} style={inputStyle} required />
          </div>
          <div>
            <label htmlFor="kudos_char_limit" style={labelStyle}>Kudos message character limit</label>
            <input id="kudos_char_limit" type="number" min={100} max={5000} value={settings.kudos_char_limit} onChange={(e) => setField("kudos_char_limit", parseInt(e.target.value) || 2000)} style={inputStyle} required />
          </div>
          <div>
            <label htmlFor="context_char_limit" style={labelStyle}>Context field character limit</label>
            <input id="context_char_limit" type="number" min={50} max={1000} value={settings.context_char_limit} onChange={(e) => setField("context_char_limit", parseInt(e.target.value) || 200)} style={inputStyle} required />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="context_required"
              type="checkbox"
              checked={settings.context_required}
              onChange={(e) => setField("context_required", e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <label htmlFor="context_required" style={{ ...labelStyle, marginBottom: 0 }}>
              Require context when submitting kudos
            </label>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section aria-labelledby="leaderboard-heading">
        <h2 id="leaderboard-heading" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, marginBottom: 16 }}>
          Leaderboard
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="leaderboard_week" style={labelStyle}>Weekly top-N</label>
            <input id="leaderboard_week" type="number" min={1} max={20} value={settings.leaderboard_top_n_week} onChange={(e) => setField("leaderboard_top_n_week", parseInt(e.target.value) || 5)} style={inputStyle} required />
          </div>
          <div>
            <label htmlFor="leaderboard_month" style={labelStyle}>Monthly top-N</label>
            <input id="leaderboard_month" type="number" min={1} max={20} value={settings.leaderboard_top_n_month} onChange={(e) => setField("leaderboard_top_n_month", parseInt(e.target.value) || 10)} style={inputStyle} required />
          </div>
        </div>
      </section>

      {/* Cron thresholds */}
      <section aria-labelledby="cron-heading">
        <h2 id="cron-heading" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, marginBottom: 16 }}>
          Nudge thresholds
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="inactive_weeks" style={labelStyle}>Inactivity threshold (weeks)</label>
            <p style={descStyle}>Weeks without giving kudos before an inactivity nudge is sent.</p>
            <input id="inactive_weeks" type="number" min={1} max={52} value={settings.inactive_threshold_weeks} onChange={(e) => setField("inactive_threshold_weeks", parseInt(e.target.value) || 4)} style={inputStyle} required />
          </div>
          <div>
            <label htmlFor="overlooked_days" style={labelStyle}>Overlooked recipient window (days)</label>
            <p style={descStyle}>Days without receiving kudos before manager is nudged.</p>
            <input id="overlooked_days" type="number" min={7} max={180} value={settings.overlooked_recipient_window_days} onChange={(e) => setField("overlooked_recipient_window_days", parseInt(e.target.value) || 30)} style={inputStyle} required />
          </div>
          <div>
            <label htmlFor="anniversary_advance" style={labelStyle}>Anniversary reminder advance (days)</label>
            <p style={descStyle}>How many days before the anniversary to send the reminder. 0 = on the day.</p>
            <input id="anniversary_advance" type="number" min={0} max={14} value={settings.anniversary_reminder_advance_days} onChange={(e) => setField("anniversary_reminder_advance_days", parseInt(e.target.value) || 0)} style={inputStyle} required />
          </div>
          <div>
            <label htmlFor="prompt_threshold" style={labelStyle}>Prompt queue low threshold</label>
            <p style={descStyle}>Send admin reminder when fewer than this many prompts are queued.</p>
            <input id="prompt_threshold" type="number" min={1} max={10} value={settings.prompt_queue_low_threshold} onChange={(e) => setField("prompt_queue_low_threshold", parseInt(e.target.value) || 2)} style={inputStyle} required />
          </div>
        </div>
      </section>

      {/* Timezone */}
      <section aria-labelledby="tz-heading">
        <h2 id="tz-heading" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, marginBottom: 16 }}>
          Timezone
        </h2>
        <div>
          <label htmlFor="timezone" style={labelStyle}>Team timezone</label>
          <p style={descStyle}>Used for all cron self-gating (DST-safe). Changes take effect on the next cron run.</p>
          <select
            id="timezone"
            value={settings.timezone}
            onChange={(e) => setField("timezone", e.target.value)}
            style={inputStyle}
            required
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Admin management */}
      <section aria-labelledby="admin-heading">
        <h2 id="admin-heading" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, marginBottom: 16 }}>
          Admin management
        </h2>
        <div>
          <label htmlFor="max_admins" style={labelStyle}>Maximum admins</label>
          <p style={descStyle}>Cannot be set below the current active admin count.</p>
          <input id="max_admins" type="number" min={1} max={20} value={settings.max_admins} onChange={(e) => setField("max_admins", parseInt(e.target.value) || 3)} style={inputStyle} required />
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-sm disabled:opacity-60"
          style={{ background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 700, fontSize: 15 }}
        >
          {saving ? "Saving…" : "Save settings"}
        </button>

        {saveState === "saved" && (
          <span role="status" style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--state-success-text, #2d6a4f)" }}>
            Settings saved
          </span>
        )}
        {saveState === "error" && errorMsg && (
          <span role="alert" style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--state-error-text)" }}>
            {errorMsg}
          </span>
        )}
      </div>

    </form>
  );
}
