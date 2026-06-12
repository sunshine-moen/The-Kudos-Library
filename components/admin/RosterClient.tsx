"use client";

import { useState } from "react";

interface SubTeam { id: string; name: string; slug: string }
interface Manager { id: string; first_name: string; last_name: string }

interface RosterMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  department: string | null;
  job_title: string | null;
  digest_cadence: string;
  on_leave_from: string | null;
  on_leave_until: string | null;
  sub_team: SubTeam | null;
  manager: Manager | null;
}

interface Team { id: string; name: string; slug: string; kind: string }

interface Props {
  members: RosterMember[];
  teams: Team[];
}

type ModalMode = "add" | "edit" | null;

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  on_leave: "On leave",
  former: "Former",
  hidden: "Hidden",
  pending_deletion: "Pending deletion",
};

const ROLE_LABELS: Record<string, string> = {
  user: "Member",
  manager: "Manager",
  admin: "Admin",
};

export default function RosterClient({ members: initial, teams }: Props) {
  const [members, setMembers] = useState<RosterMember[]>(initial);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<RosterMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formSubTeamId, setFormSubTeamId] = useState("");
  const [formRole, setFormRole] = useState<"user" | "manager" | "admin">("user");
  const [formManagerId, setFormManagerId] = useState("");
  const [formDigestCadence, setFormDigestCadence] = useState<"weekly" | "biweekly">("weekly");

  const filtered = members.filter((m) => {
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q
      || `${m.first_name} ${m.last_name}`.toLowerCase().includes(q)
      || m.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  function openAdd() {
    setFormFirstName(""); setFormLastName(""); setFormEmail("");
    setFormDepartment(""); setFormJobTitle(""); setFormSubTeamId("");
    setFormRole("user"); setFormManagerId(""); setFormDigestCadence("weekly");
    setEditTarget(null);
    setModalMode("add");
    setError(null);
  }

  function openEdit(m: RosterMember) {
    setFormFirstName(m.first_name); setFormLastName(m.last_name); setFormEmail(m.email);
    setFormDepartment(m.department ?? ""); setFormJobTitle(m.job_title ?? "");
    setFormSubTeamId(m.sub_team?.id ?? "");
    setFormRole(m.role as "user" | "manager" | "admin");
    setFormManagerId(m.manager?.id ?? "");
    setFormDigestCadence(m.digest_cadence as "weekly" | "biweekly");
    setEditTarget(m);
    setModalMode("edit");
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    if (modalMode === "add") {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formFirstName, last_name: formLastName, email: formEmail,
          department: formDepartment || undefined,
          job_title: formJobTitle || undefined,
          sub_team_id: formSubTeamId || undefined,
          role: formRole,
          manager_id: formManagerId || undefined,
          digest_cadence: formDigestCadence,
        }),
      });
      if (res.ok) {
        const fresh = await fetch("/api/admin/members").then((r) => r.json() as Promise<RosterMember[]>);
        setMembers(fresh);
        setModalMode(null);
      } else {
        const e = await res.json() as { error?: string };
        setError(e.error ?? "Failed to add member.");
      }
    } else if (modalMode === "edit" && editTarget) {
      const res = await fetch(`/api/admin/members/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formFirstName, last_name: formLastName,
          department: formDepartment || null,
          job_title: formJobTitle || null,
          sub_team_id: formSubTeamId || null,
          manager_id: formManagerId || null,
          digest_cadence: formDigestCadence,
        }),
      });
      if (res.ok) {
        const fresh = await fetch("/api/admin/members").then((r) => r.json() as Promise<RosterMember[]>);
        setMembers(fresh);
        setModalMode(null);
      } else {
        const e = await res.json() as { error?: string };
        setError(e.error ?? "Failed to update member.");
      }
    }
    setSaving(false);
  }

  async function handleDeactivate(m: RosterMember) {
    if (!confirm(`Deactivate ${m.first_name} ${m.last_name}? This sets their status to "Former".`)) return;
    const res = await fetch(`/api/admin/members/${m.id}/deactivate`, { method: "POST" });
    if (res.ok) {
      setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, status: "former" } : x));
    } else {
      const e = await res.json() as { error?: string };
      alert(e.error ?? "Failed to deactivate.");
    }
  }

  async function handleLeaveToggle(m: RosterMember) {
    if (m.status === "on_leave") {
      const res = await fetch(`/api/admin/members/${m.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return" }),
      });
      if (res.ok) setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, status: "active", on_leave_from: null, on_leave_until: null } : x));
      else { const e = await res.json() as { error?: string }; alert(e.error ?? "Failed."); }
    } else {
      const res = await fetch(`/api/admin/members/${m.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (res.ok) setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, status: "on_leave", on_leave_from: new Date().toISOString() } : x));
      else { const e = await res.json() as { error?: string }; alert(e.error ?? "Failed."); }
    }
  }

  async function handleRoleChange(m: RosterMember, newRole: "user" | "manager" | "admin") {
    const label = ROLE_LABELS[newRole] ?? newRole;
    if (!confirm(`Change ${m.first_name} ${m.last_name}'s role to ${label}?`)) return;
    const res = await fetch(`/api/admin/members/${m.id}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, role: newRole } : x));
    else { const e = await res.json() as { error?: string }; alert(e.error ?? "Failed."); }
  }

  const inputStyle = {
    borderColor: "var(--wood-walnut-deep)",
    background: "var(--lib-cream)",
    font: "var(--text-app-ui)",
    color: "var(--lib-ink)",
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded border px-3 py-2 flex-1 min-w-48"
          style={inputStyle}
          aria-label="Search roster"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border px-3 py-2"
          style={inputStyle}
          aria-label="Filter by status"
        >
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="former">Former</option>
          <option value="all">All statuses</option>
        </select>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 rounded-sm text-sm"
          style={{ background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 600 }}
        >
          Add member
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border" style={{ borderColor: "var(--wood-walnut-deep)" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--inst-navy)", color: "var(--inst-white)" }}>
              {["Name", "Email", "Department", "Job title", "Sub-team", "Role", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-3 py-2" style={{ font: "var(--text-app-ui)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center" style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)" }}>
                  No members match your filters.
                </td>
              </tr>
            )}
            {filtered.map((m, i) => (
              <tr
                key={m.id}
                style={{ background: i % 2 === 0 ? "var(--lib-cream)" : "var(--lib-parchment)", borderTop: "1px solid var(--wood-walnut-deep)" }}
              >
                <td className="px-3 py-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", whiteSpace: "nowrap" }}>
                  {m.first_name} {m.last_name}
                </td>
                <td className="px-3 py-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)" }}>{m.email}</td>
                <td className="px-3 py-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)" }}>{m.department ?? "—"}</td>
                <td className="px-3 py-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)" }}>{m.job_title ?? "—"}</td>
                <td className="px-3 py-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)" }}>{m.sub_team?.name ?? "—"}</td>
                <td className="px-3 py-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)" }}>
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m, e.target.value as "user" | "manager" | "admin")}
                    className="rounded border px-1 py-0.5 text-xs"
                    style={inputStyle}
                    aria-label={`Role for ${m.first_name} ${m.last_name}`}
                  >
                    <option value="user">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-3 py-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)" }}>
                  {STATUS_LABELS[m.status] ?? m.status}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="text-xs underline"
                      style={{ color: "var(--inst-navy)", font: "var(--text-app-ui)" }}
                    >
                      Edit
                    </button>
                    {(m.status === "active" || m.status === "on_leave") && (
                      <button
                        type="button"
                        onClick={() => handleLeaveToggle(m)}
                        className="text-xs underline"
                        style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)" }}
                      >
                        {m.status === "on_leave" ? "Return" : "Leave"}
                      </button>
                    )}
                    {m.status !== "former" && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(m)}
                        className="text-xs underline"
                        style={{ color: "var(--state-error-text)", font: "var(--text-app-ui)" }}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      {modalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={modalMode === "add" ? "Add team member" : "Edit team member"}
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="rounded-sm p-6 w-full max-w-md max-h-screen overflow-y-auto"
            style={{ background: "var(--lib-cream)" }}
          >
            <h2 className="mb-4" style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}>
              {modalMode === "add" ? "Add team member" : `Edit ${editTarget?.first_name} ${editTarget?.last_name}`}
            </h2>

            {error && (
              <p className="rounded px-3 py-2 text-sm mb-4" role="alert"
                style={{ background: "var(--state-error-bg)", color: "var(--state-error-text)" }}>
                {error}
              </p>
            )}

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block mb-1 text-sm" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>
                    First name *
                  </label>
                  <input type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)}
                    required className="w-full rounded border px-3 py-2" style={inputStyle} />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-sm" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>
                    Last name *
                  </label>
                  <input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)}
                    required className="w-full rounded border px-3 py-2" style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>
                  Email {modalMode === "add" ? "*" : "(not editable)"}
                </label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                  required={modalMode === "add"} readOnly={modalMode === "edit"}
                  className="w-full rounded border px-3 py-2" style={{ ...inputStyle, opacity: modalMode === "edit" ? 0.6 : 1 }} />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block mb-1 text-sm" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>Department</label>
                  <input type="text" value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full rounded border px-3 py-2" style={inputStyle} />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-sm" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>Job title</label>
                  <input type="text" value={formJobTitle} onChange={(e) => setFormJobTitle(e.target.value)}
                    className="w-full rounded border px-3 py-2" style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>Sub-team</label>
                <select value={formSubTeamId} onChange={(e) => setFormSubTeamId(e.target.value)}
                  className="w-full rounded border px-3 py-2" style={inputStyle}>
                  <option value="">None</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block mb-1 text-sm" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>Role</label>
                  <select value={formRole} onChange={(e) => setFormRole(e.target.value as typeof formRole)}
                    className="w-full rounded border px-3 py-2" style={inputStyle}>
                    <option value="user">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-sm" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>Digest cadence</label>
                  <select value={formDigestCadence} onChange={(e) => setFormDigestCadence(e.target.value as typeof formDigestCadence)}
                    className="w-full rounded border px-3 py-2" style={inputStyle}>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-sm text-sm disabled:opacity-60"
                style={{ background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 600 }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="flex-1 px-4 py-2 rounded-sm text-sm border"
                style={{ borderColor: "var(--wood-walnut-deep)", color: "var(--lib-ink)", font: "var(--text-app-ui)" }}
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
