"use client";

import { useState } from "react";

interface Props {
  initialFirstName: string;
  initialLastName: string;
  initialJobTitle: string;
}

export default function EditProfileForm({
  initialFirstName,
  initialLastName,
  initialJobTitle,
}: Props) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveState("idle");
    setErrorMsg(null);

    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, job_title: jobTitle }),
    });

    setSaving(false);
    if (res.ok) {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } else {
      const data = await res.json() as { error?: string };
      setErrorMsg(data.error ?? "Could not save profile.");
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
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    font: "var(--text-app-ui)",
    fontWeight: 600,
    color: "var(--lib-ink)",
    marginBottom: 4,
    fontSize: 13,
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" style={labelStyle}>First name</label>
            <input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={80}
              style={inputStyle}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label htmlFor="last_name" style={labelStyle}>Last name</label>
            <input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={80}
              style={inputStyle}
              autoComplete="family-name"
            />
          </div>
        </div>
        <div>
          <label htmlFor="job_title" style={labelStyle}>Job title</label>
          <input
            id="job_title"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            maxLength={120}
            style={inputStyle}
            autoComplete="organization-title"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-5">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-sm disabled:opacity-60"
          style={{ background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>

        {saveState === "saved" && (
          <span role="status" style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--state-success-text, #2d6a4f)" }}>
            Profile updated
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
