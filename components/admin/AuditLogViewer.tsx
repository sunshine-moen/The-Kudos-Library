"use client";

import { useState, useCallback } from "react";

interface AuditRow {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: unknown;
  occurred_at: string;
  actor: { first_name: string; last_name: string; id: string } | null;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  initialRows: AuditRow[];
  initialNextCursor: string | null;
  members: Member[];
}

const ACTION_LABELS: Record<string, string> = {
  kudos_soft_delete: "Kudos deleted",
  settings_update: "Settings updated",
  featured_prompt_created: "Prompt created",
  member_role_changed: "Role changed",
  member_status_changed: "Status changed",
  member_invited: "Member invited",
  tos_accepted: "ToS accepted",
};

function labelForAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export default function AuditLogViewer({ initialRows, initialNextCursor, members }: Props) {
  const [rows, setRows] = useState<AuditRow[]>(initialRows);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actorId, setActorId] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchRows(cursor: string | null, replace: boolean) {
    setLoading(true);
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (actorId) params.set("actor_id", actorId);
    if (actionFilter) params.set("action", actionFilter);

    const res = await fetch(`/api/admin/audit-log?${params}`);
    if (res.ok) {
      const data = await res.json() as { rows: AuditRow[]; nextCursor: string | null };
      setRows(replace ? data.rows : (prev) => [...prev, ...data.rows]);
      setNextCursor(data.nextCursor);
    }
    setLoading(false);
  }

  const handleFilter = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchRows(null, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, actorId, actionFilter]);

  const inputStyle = {
    borderRadius: 2,
    border: "1px solid var(--wood-walnut-deep)",
    background: "var(--lib-cream)",
    font: "var(--text-app-ui)",
    color: "var(--lib-ink)",
    padding: "6px 10px",
    fontSize: 13,
  };

  return (
    <div>
      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label htmlFor="from" style={{ display: "block", font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)", marginBottom: 2 }}>From</label>
          <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="to" style={{ display: "block", font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)", marginBottom: 2 }}>To</label>
          <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="actor" style={{ display: "block", font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)", marginBottom: 2 }}>Actor</label>
          <select id="actor" value={actorId} onChange={(e) => setActorId(e.target.value)} style={inputStyle}>
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="action-filter" style={{ display: "block", font: "var(--text-app-ui)", fontSize: 12, color: "var(--lib-parchment)", marginBottom: 2 }}>Action</label>
          <select id="action-filter" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={inputStyle}>
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button type="submit" style={{ ...inputStyle, background: "var(--inst-navy)", color: "var(--inst-white)", fontWeight: 700, cursor: "pointer", border: "none" }}>
          Filter
        </button>
      </form>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", font: "var(--text-app-ui)", fontSize: 13 }} aria-label="Admin audit log">
          <thead>
            <tr style={{ borderBottom: "2px solid var(--lib-parchment)" }}>
              {["When", "Actor", "Action", "Target", ""].map((h) => (
                <th key={h} scope="col" style={{ textAlign: "left", padding: "6px 12px 8px", color: "var(--lib-parchment)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "24px 12px", textAlign: "center", color: "var(--lib-parchment)" }}>
                  No audit log entries found.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <>
                <tr
                  key={row.id}
                  style={{ borderBottom: "1px solid var(--lib-parchment)", cursor: row.metadata ? "pointer" : "default" }}
                  onClick={() => (row.metadata !== null && row.metadata !== undefined) && setExpandedId(expandedId === row.id ? null : row.id)}
                  aria-expanded={expandedId === row.id}
                >
                  <td style={{ padding: "10px 12px", color: "var(--lib-parchment)", whiteSpace: "nowrap" }}>
                    {new Date(row.occurred_at).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--lib-ink)" }}>
                    {row.actor ? `${row.actor.first_name} ${row.actor.last_name}` : "System"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--lib-ink)", fontWeight: 600 }}>
                    {labelForAction(row.action)}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--lib-parchment)", fontFamily: "monospace", fontSize: 11 }}>
                    {row.target_type}
                    {row.target_id && <span style={{ color: "var(--lib-ink)", marginLeft: 4 }}>{row.target_id.slice(0, 8)}…</span>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {row.metadata !== null && row.metadata !== undefined && (
                      <span style={{ color: "var(--inst-navy)", fontSize: 11, textDecoration: "underline" }}>
                        {expandedId === row.id ? "▲ hide" : "▼ details"}
                      </span>
                    )}
                  </td>
                </tr>
                {expandedId === row.id && row.metadata !== null && row.metadata !== undefined && (
                  <tr key={`${row.id}-meta`} style={{ background: "var(--lib-parchment, #f0e8d5)" }}>
                    <td colSpan={5} style={{ padding: "12px 24px" }}>
                      <pre style={{ margin: 0, fontSize: 12, color: "var(--lib-ink)", overflowX: "auto" }}>
                        {JSON.stringify(row.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {nextCursor && (
        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => fetchRows(nextCursor, false)}
            style={{ background: "transparent", border: "1px solid var(--inst-navy)", color: "var(--inst-navy)", font: "var(--text-app-ui)", fontWeight: 600, padding: "10px 24px", borderRadius: 2, cursor: "pointer" }}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
