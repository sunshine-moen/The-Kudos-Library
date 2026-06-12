"use client";

import { useState } from "react";

interface Prompt {
  id: string;
  prompt_text: string;
  week_start_date: string | null;
  published_at: string | null;
  is_default_rotation: boolean;
}

interface Props {
  initialPrompts: Prompt[];
  queueCount: number;
  lowThreshold: number;
  charLimit: number;
}

function formatWeek(dateStr: string | null): string {
  if (!dateStr) return "Unscheduled";
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function formatPublished(dateStr: string | null): string {
  if (!dateStr) return "Pending";
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function PromptsManager({ initialPrompts, queueCount, lowThreshold, charLimit }: Props) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [currentQueueCount, setCurrentQueueCount] = useState(queueCount);

  const [addText, setAddText] = useState("");
  const [addWeek, setAddWeek] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editWeek, setEditWeek] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    const body: Record<string, string> = { prompt_text: addText };
    if (addWeek) body.week_start_date = addWeek;

    const res = await fetch("/api/admin/featured-prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setAddLoading(false);
    if (res.ok) {
      const created = await res.json() as Prompt;
      setPrompts((prev) => [created, ...prev]);
      if (!created.published_at && created.week_start_date) setCurrentQueueCount((c) => c + 1);
      setAddText("");
      setAddWeek("");
    } else {
      const data = await res.json() as { error?: string };
      setAddError(data.error ?? "Could not add prompt.");
    }
  }

  function startEdit(p: Prompt) {
    setEditId(p.id);
    setEditText(p.prompt_text);
    setEditWeek(p.week_start_date ? p.week_start_date.slice(0, 10) : "");
    setEditError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setEditLoading(true);
    setEditError(null);

    const body: Record<string, string | null> = { prompt_text: editText };
    body.week_start_date = editWeek || null;

    const res = await fetch(`/api/admin/featured-prompts/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json() as Prompt;
      setPrompts((prev) => prev.map((p) => (p.id === editId ? updated : p)));
      setEditId(null);
    } else {
      const data = await res.json() as { error?: string };
      setEditError(data.error ?? "Could not save changes.");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);

    const res = await fetch(`/api/admin/featured-prompts/${deleteId}`, { method: "DELETE" });
    setDeleteLoading(false);

    if (res.ok) {
      const removed = prompts.find((p) => p.id === deleteId);
      setPrompts((prev) => prev.filter((p) => p.id !== deleteId));
      if (removed && !removed.published_at && removed.week_start_date) setCurrentQueueCount((c) => Math.max(0, c - 1));
      setDeleteId(null);
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

  const isLow = currentQueueCount < lowThreshold;

  return (
    <div>
      {/* Queue health indicator */}
      <div
        className="inline-flex items-center gap-2 rounded-sm px-3 py-1 mb-6"
        style={{ background: isLow ? "var(--state-error-bg, #fef2f2)" : "var(--lib-parchment, #e8dcc8)" }}
      >
        <span style={{ font: "var(--text-app-ui)", fontSize: 13, color: isLow ? "var(--state-error-text)" : "var(--lib-ink)", fontWeight: isLow ? 700 : 400 }}>
          {isLow ? `⚠ Queue low: ${currentQueueCount} prompt${currentQueueCount !== 1 ? "s" : ""} queued (threshold: ${lowThreshold})` : `${currentQueueCount} prompt${currentQueueCount !== 1 ? "s" : ""} queued`}
        </span>
      </div>

      {/* Add prompt form */}
      <section aria-labelledby="add-prompt-heading" className="mb-8 p-5 rounded-sm" style={{ background: "var(--lib-parchment, #e8dcc8)" }}>
        <h2 id="add-prompt-heading" className="mb-4" style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Add a prompt
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label htmlFor="add-text" style={{ display: "block", font: "var(--text-app-ui)", fontSize: 13, fontWeight: 600, color: "var(--lib-ink)", marginBottom: 4 }}>
              Prompt text
            </label>
            <textarea
              id="add-text"
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              maxLength={charLimit}
              rows={3}
              required
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="e.g. Who on your team quietly made something better this week?"
            />
            <p style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)", marginTop: 2 }}>
              {addText.length}/{charLimit}
            </p>
          </div>
          <div>
            <label htmlFor="add-week" style={{ display: "block", font: "var(--text-app-ui)", fontSize: 13, fontWeight: 600, color: "var(--lib-ink)", marginBottom: 4 }}>
              Schedule for week starting (optional)
            </label>
            <input id="add-week" type="date" value={addWeek} onChange={(e) => setAddWeek(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
          </div>
          {addError && <p role="alert" style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--state-error-text)" }}>{addError}</p>}
          <button
            type="submit"
            disabled={addLoading || !addText.trim()}
            className="px-5 py-2 rounded-sm disabled:opacity-60"
            style={{ background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none" }}
          >
            {addLoading ? "Adding…" : "Add prompt"}
          </button>
        </form>
      </section>

      {/* Prompt table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", font: "var(--text-app-ui)", fontSize: 13 }} aria-label="Prompt queue">
          <thead>
            <tr style={{ borderBottom: "2px solid var(--lib-parchment)" }}>
              {["Prompt", "Scheduled week", "Status", ""].map((h) => (
                <th key={h} scope="col" style={{ textAlign: "left", padding: "6px 12px 8px", color: "var(--lib-parchment)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prompts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "24px 12px", textAlign: "center", color: "var(--lib-parchment)" }}>No prompts yet.</td>
              </tr>
            )}
            {prompts.map((p) => (
              <>
                <tr key={p.id} style={{ borderBottom: "1px solid var(--lib-parchment)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--lib-ink)", maxWidth: 380 }}>
                    <span title={p.prompt_text} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.prompt_text}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--lib-parchment)", whiteSpace: "nowrap" }}>
                    {formatWeek(p.week_start_date)}
                  </td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {p.published_at ? (
                      <span style={{ color: "var(--state-success-text, #2d6a4f)", fontWeight: 600 }}>Published {formatPublished(p.published_at)}</span>
                    ) : (
                      <span style={{ color: "var(--lib-parchment)" }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {!p.published_at && !p.is_default_rotation && (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--inst-navy)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(p.id)}
                          style={{ font: "var(--text-app-ui)", fontSize: 12, color: "var(--state-error-text)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {p.published_at && (
                      <span style={{ font: "var(--text-app-ui)", fontSize: 11, color: "var(--lib-parchment)", fontStyle: "italic" }}>Read-only</span>
                    )}
                  </td>
                </tr>
                {editId === p.id && (
                  <tr key={`${p.id}-edit`} style={{ background: "var(--lib-parchment, #e8dcc8)" }}>
                    <td colSpan={4} style={{ padding: "12px 24px" }}>
                      <form onSubmit={handleEdit} className="space-y-3">
                        <div>
                          <label htmlFor={`edit-text-${p.id}`} style={{ display: "block", font: "var(--text-app-ui)", fontSize: 13, fontWeight: 600, color: "var(--lib-ink)", marginBottom: 4 }}>Prompt text</label>
                          <textarea
                            id={`edit-text-${p.id}`}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            maxLength={charLimit}
                            rows={3}
                            required
                            style={{ ...inputStyle, resize: "vertical" }}
                          />
                        </div>
                        <div>
                          <label htmlFor={`edit-week-${p.id}`} style={{ display: "block", font: "var(--text-app-ui)", fontSize: 13, fontWeight: 600, color: "var(--lib-ink)", marginBottom: 4 }}>Schedule for week (optional)</label>
                          <input id={`edit-week-${p.id}`} type="date" value={editWeek} onChange={(e) => setEditWeek(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
                        </div>
                        {editError && <p role="alert" style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--state-error-text)" }}>{editError}</p>}
                        <div className="flex gap-3">
                          <button type="submit" disabled={editLoading} className="px-4 py-2 rounded-sm disabled:opacity-60" style={{ background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none" }}>
                            {editLoading ? "Saving…" : "Save"}
                          </button>
                          <button type="button" onClick={() => setEditId(null)} style={{ font: "var(--text-app-ui)", fontSize: 13, color: "var(--lib-ink)", background: "none", border: "1px solid var(--lib-parchment)", borderRadius: 2, padding: "8px 14px", cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-prompt-title"
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div style={{ background: "var(--lib-cream)", borderRadius: 4, padding: "28px 24px", maxWidth: 400, width: "100%" }}>
            <h2 id="delete-prompt-title" style={{ font: "var(--text-app-title)", color: "var(--inst-navy)", fontSize: 20, marginBottom: 12 }}>Delete prompt?</h2>
            <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", marginBottom: 20 }}>
              This action cannot be undone. The prompt will be permanently removed from the queue.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-sm disabled:opacity-60"
                style={{ background: "var(--state-error-text)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none" }}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                style={{ font: "var(--text-app-ui)", fontSize: 14, color: "var(--lib-ink)", background: "none", border: "1px solid var(--lib-parchment)", borderRadius: 2, padding: "8px 16px", cursor: "pointer" }}
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
