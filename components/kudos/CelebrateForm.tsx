"use client";

import { useState, useEffect, useRef } from "react";
import ConfirmationModal from "./ConfirmationModal";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  kind: string;
  description: string;
}

interface ValueTag {
  id: string;
  key: string;
  label: string;
  group_label: string;
}

interface ContextCategory {
  id: string;
  key: string;
  label: string;
}

interface GiphyResult {
  id: string;
  images: { fixed_height: { url: string } };
  title: string;
}

const BOOK_DESIGNS = [
  { key: "classic-navy", label: "Navy" },
  { key: "forest-green", label: "Forest" },
  { key: "burgundy", label: "Burgundy" },
  { key: "slate-blue", label: "Slate" },
  { key: "warm-terracotta", label: "Terracotta" },
  { key: "midnight-black", label: "Midnight" },
];

const FONT_CHOICES = [
  { key: "garamond", label: "Garamond" },
  { key: "crimson-pro", label: "Crimson Pro" },
  { key: "special-elite", label: "Special Elite" },
  { key: "open-sans", label: "Open Sans" },
  { key: "caveat", label: "Caveat" },
];

export default function CelebrateForm({
  activePromptText,
  preTagValueId,
}: {
  activePromptText: string | null;
  preTagValueId: string | null;
}) {
  const [kudosMode, setKudosMode] = useState<"individual" | "team">("individual");
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [valueTags, setValueTags] = useState<ValueTag[]>([]);
  const [contextCategories, setContextCategories] = useState<ContextCategory[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [teamRecipientId, setTeamRecipientId] = useState("");
  const [teamRecipientName, setTeamRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [bookDesign, setBookDesign] = useState("classic-navy");
  const [fontChoice, setFontChoice] = useState("garamond");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [contextCategoryId, setContextCategoryId] = useState<string | null>(null);
  const [contextText, setContextText] = useState("");
  const [giphyId, setGiphyId] = useState<string | null>(null);
  const [giphyUrl, setGiphyUrl] = useState<string | null>(null);
  const [gifAltText, setGifAltText] = useState<string | null>(null);
  const [giphySearch, setGiphySearch] = useState("");
  const [giphyResults, setGiphyResults] = useState<GiphyResult[]>([]);
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    kudosId: string;
    editWindowExpiresAt: Date;
    recipientName: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/me/members").then((r) => r.json() as Promise<Member[]>),
      fetch("/api/value-tags").then((r) => r.json() as Promise<ValueTag[]>),
      fetch("/api/context-categories").then((r) => r.json() as Promise<ContextCategory[]>),
      fetch("/api/teams").then((r) => r.json() as Promise<Team[]>),
    ]).then(([m, vt, cc, t]) => {
      setMembers(m);
      setValueTags(vt);
      setContextCategories(cc);
      setTeams(t);
      // Pre-select the active prompt's value tag (user can deselect)
      if (preTagValueId && vt.some((tag) => tag.id === preTagValueId)) {
        setSelectedTagIds((prev) =>
          prev.includes(preTagValueId) ? prev : [...prev, preTagValueId]
        );
      }
    });
  }, [preTagValueId]);

  const filteredMembers = memberSearch.length > 0
    ? members.filter((m) =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

  async function searchGiphy(q: string) {
    if (!q.trim()) return;
    const res = await fetch(`/api/giphy/search?q=${encodeURIComponent(q)}`);
    const json = await res.json() as { data: GiphyResult[] };
    setGiphyResults(json.data ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (kudosMode === "individual" && !recipientId) {
      setError("Please select a recipient."); return;
    }
    if (kudosMode === "team" && !teamRecipientId) {
      setError("Please select a team."); return;
    }
    if (!message.trim()) { setError("Please write a message."); return; }
    if (contextText.length > 200) { setError("Context text must be 200 characters or fewer."); return; }

    setSubmitting(true);
    setError(null);

    const commonFields = {
      message_text: message,
      book_design: bookDesign,
      font_choice: fontChoice,
      value_tag_ids: selectedTagIds,
      context_category_id: contextCategoryId ?? null,
      context_text: contextCategoryId ? (contextText || null) : null,
      giphy_id: giphyId ?? null,
      gif_alt_text: gifAltText ?? null,
    };

    const body = kudosMode === "individual"
      ? { mode: "individual" as const, recipient_id: recipientId, ...commonFields }
      : { mode: "team" as const, team_recipient_id: teamRecipientId, ...commonFields };

    const res = await fetch("/api/kudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json() as { kudos_id: string; edit_window_expires_at: string };
      setConfirmed({
        kudosId: data.kudos_id,
        editWindowExpiresAt: new Date(data.edit_window_expires_at),
        recipientName: kudosMode === "individual" ? recipientName : teamRecipientName,
      });
    } else {
      const err = await res.json() as { error?: string };
      setError(err.error ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  async function handleEdit(updates: {
    message_text?: string;
    book_design?: string;
    font_choice?: string;
    value_tag_ids?: string[];
    context_category_id?: string | null;
    context_text?: string | null;
    giphy_id?: string | null;
  }) {
    if (!confirmed) return;
    const res = await fetch(`/api/kudos/${confirmed.kudosId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      setError(err.error ?? "Edit failed.");
    }
  }

  if (confirmed) {
    return (
      <ConfirmationModal
        recipientName={confirmed.recipientName}
        editWindowExpiresAt={confirmed.editWindowExpiresAt}
        onEdit={() => {
          setConfirmed(null);
        }}
        kudosId={confirmed.kudosId}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      {error && (
        <p
          className="rounded px-3 py-2 text-sm"
          style={{ background: "var(--state-error-bg)", color: "var(--state-error-text)" }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Mode toggle */}
      <div>
        <p className="mb-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>
          Celebrating an individual or a whole team?
        </p>
        <div className="flex gap-2" role="group" aria-label="Kudos mode">
          {(["individual", "team"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setKudosMode(mode)}
              aria-pressed={kudosMode === mode}
              className="px-4 py-2 rounded-sm text-sm border capitalize"
              style={{
                borderColor: kudosMode === mode ? "var(--inst-navy)" : "var(--wood-walnut-deep)",
                background: kudosMode === mode ? "var(--inst-navy)" : "transparent",
                color: kudosMode === mode ? "var(--inst-white)" : "var(--lib-ink)",
                font: "var(--text-app-ui)",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Recipient — individual mode */}
      {kudosMode === "individual" && <div>
        <label
          htmlFor="recipient-search"
          className="block mb-1"
          style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}
        >
          Search by name <span aria-hidden>*</span>
        </label>
        <div className="relative" ref={dropdownRef}>
          <input
            id="recipient-search"
            type="text"
            value={recipientId ? recipientName : memberSearch}
            onChange={(e) => {
              if (recipientId) {
                setRecipientId("");
                setRecipientName("");
              }
              setMemberSearch(e.target.value);
              setShowMemberDropdown(true);
            }}
            onFocus={() => setShowMemberDropdown(true)}
            placeholder="Search by name…"
            autoComplete="off"
            required
            className="w-full rounded border px-3 py-2"
            style={{
              borderColor: "var(--wood-walnut-deep)",
              background: "var(--lib-cream)",
              font: "var(--text-app-ui)",
              color: "var(--lib-ink)",
            }}
          />
          {showMemberDropdown && filteredMembers.length > 0 && !recipientId && (
            <ul
              className="absolute z-10 w-full rounded border mt-1 max-h-48 overflow-y-auto"
              style={{ background: "var(--lib-cream)", borderColor: "var(--wood-walnut-deep)" }}
            >
              {filteredMembers.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:opacity-80"
                    style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)" }}
                    onClick={() => {
                      setRecipientId(m.id);
                      setRecipientName(`${m.first_name} ${m.last_name}`);
                      setMemberSearch("");
                      setShowMemberDropdown(false);
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{m.first_name} {m.last_name}</span>
                    {m.job_title && (
                      <span style={{ fontSize: 12, color: "var(--lib-parchment)", marginLeft: 8 }}>
                        {m.job_title}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>}

      {/* Team picker — team mode */}
      {kudosMode === "team" && (
        <div>
          <label
            htmlFor="team-recipient"
            className="block mb-1"
            style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}
          >
            Which team? <span aria-hidden>*</span>
          </label>
          <select
            id="team-recipient"
            value={teamRecipientId}
            onChange={(e) => {
              const selected = teams.find((t) => t.id === e.target.value);
              setTeamRecipientId(e.target.value);
              setTeamRecipientName(selected?.name ?? "");
            }}
            required={kudosMode === "team"}
            className="w-full rounded border px-3 py-2"
            style={{
              borderColor: "var(--wood-walnut-deep)",
              background: "var(--lib-cream)",
              font: "var(--text-app-ui)",
              color: teamRecipientId ? "var(--lib-ink)" : "var(--lib-parchment)",
            }}
          >
            <option value="">Choose a team…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{t.description ? ` — ${t.description}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Featured prompt card */}
      {activePromptText && (
        <div
          className="rounded-sm p-4"
          style={{ background: "var(--inst-navy)", border: "1px solid var(--inst-gold)" }}
        >
          <p style={{ font: "var(--text-app-ui)", fontSize: 11, color: "var(--inst-gold)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
            This week&apos;s prompt
          </p>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "var(--lib-cream)", fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>
            &ldquo;{activePromptText}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setMessage(activePromptText)}
            className="text-sm px-3 py-1 rounded-sm"
            style={{ background: "var(--inst-gold)", color: "var(--inst-navy)", font: "var(--text-app-ui)", fontWeight: 600 }}
          >
            Use this prompt
          </button>
        </div>
      )}

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block mb-1"
          style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}
        >
          Your message <span aria-hidden>*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          required
          className="w-full rounded border px-3 py-2 resize-y"
          style={{
            borderColor: "var(--wood-walnut-deep)",
            background: "var(--lib-cream)",
            font: "var(--text-app-ui)",
            color: "var(--lib-ink)",
          }}
        />
        <p
          className="text-right text-xs mt-1"
          style={{ color: message.length > 1900 ? "var(--state-error-text)" : "var(--lib-parchment)" }}
          aria-live="polite"
        >
          {message.length} / 2000
        </p>
      </div>

      {/* Book design */}
      <div>
        <p className="mb-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>
          Book design <span style={{ fontWeight: 400, color: "var(--lib-parchment)" }}>(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {BOOK_DESIGNS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setBookDesign(d.key)}
              className="px-3 py-1 rounded-sm text-sm border"
              style={{
                borderColor: bookDesign === d.key ? "var(--inst-navy)" : "var(--wood-walnut-deep)",
                background: bookDesign === d.key ? "var(--inst-navy)" : "transparent",
                color: bookDesign === d.key ? "var(--inst-white)" : "var(--lib-ink)",
                font: "var(--text-app-ui)",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font */}
      <div>
        <p className="mb-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>
          Font <span style={{ fontWeight: 400, color: "var(--lib-parchment)" }}>(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {FONT_CHOICES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFontChoice(f.key)}
              className="px-3 py-1 rounded-sm text-sm border"
              style={{
                borderColor: fontChoice === f.key ? "var(--inst-navy)" : "var(--wood-walnut-deep)",
                background: fontChoice === f.key ? "var(--inst-navy)" : "transparent",
                color: fontChoice === f.key ? "var(--inst-white)" : "var(--lib-ink)",
                font: "var(--text-app-ui)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Value tags */}
      {valueTags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>
              Values <span style={{ fontWeight: 400, color: "var(--lib-parchment)" }}>(optional)</span>
            </p>
            {selectedTagIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTagIds([])}
                className="text-xs underline"
                style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)" }}
              >
                Skip for now
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {valueTags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTagIds((prev) =>
                      selected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    )
                  }
                  className="px-3 py-1 rounded-sm text-sm border"
                  style={{
                    borderColor: selected ? "var(--inst-navy)" : "var(--wood-walnut-deep)",
                    background: selected ? "var(--inst-navy)" : "transparent",
                    color: selected ? "var(--inst-white)" : "var(--lib-ink)",
                    font: "var(--text-app-ui)",
                  }}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Context */}
      {contextCategories.length > 0 && (
        <div>
          <label
            htmlFor="context-category"
            className="block mb-1"
            style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}
          >
            Context <span style={{ fontWeight: 400, color: "var(--lib-parchment)" }}>(optional)</span>
          </label>
          <select
            id="context-category"
            value={contextCategoryId ?? ""}
            onChange={(e) => { setContextCategoryId(e.target.value || null); setContextText(""); }}
            className="w-full rounded border px-3 py-2 mb-2"
            style={{
              borderColor: "var(--wood-walnut-deep)",
              background: "var(--lib-cream)",
              font: "var(--text-app-ui)",
              color: contextCategoryId ? "var(--lib-ink)" : "var(--lib-parchment)",
            }}
          >
            <option value="">Choose a context…</option>
            {contextCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          {contextCategoryId && (
            <>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Add a little more context (optional)…"
                className="w-full rounded border px-3 py-2 resize-none"
                style={{
                  borderColor: contextText.length > 200 ? "var(--state-error-text)" : "var(--wood-walnut-deep)",
                  background: "var(--lib-cream)",
                  font: "var(--text-app-ui)",
                  color: "var(--lib-ink)",
                }}
              />
              <p className="text-right text-xs mt-1" style={{ color: "var(--lib-parchment)" }}>
                {contextText.length} / 200
              </p>
            </>
          )}
        </div>
      )}

      {/* Giphy */}
      <div>
        <p className="mb-2" style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}>
          GIF <span style={{ fontWeight: 400, color: "var(--lib-parchment)" }}>(optional)</span>
        </p>
        {giphyUrl ? (
          <div className="flex items-start gap-3">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={giphyUrl} alt={gifAltText ?? "Selected GIF"} loading="lazy" className="rounded" style={{ maxHeight: 120 }} />
              <p style={{ font: "var(--text-app-ui)", fontSize: 10, color: "var(--lib-parchment)", marginTop: 2 }}>
                Powered by GIPHY
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setGiphyId(null); setGiphyUrl(null); setGifAltText(null); }}
              className="text-xs underline"
              style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)" }}
            >
              Remove GIF
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowGiphyPicker(!showGiphyPicker)}
              className="text-sm underline"
              style={{ color: "var(--inst-navy)", font: "var(--text-app-ui)" }}
            >
              {showGiphyPicker ? "Hide GIF picker" : "Add a GIF"}
            </button>
            {showGiphyPicker && (
              <div className="mt-2">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={giphySearch}
                    onChange={(e) => setGiphySearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchGiphy(giphySearch); } }}
                    placeholder="Search GIFs…"
                    className="flex-1 rounded border px-3 py-1"
                    style={{ borderColor: "var(--wood-walnut-deep)", background: "var(--lib-cream)", font: "var(--text-app-ui)", color: "var(--lib-ink)" }}
                  />
                  <button
                    type="button"
                    onClick={() => searchGiphy(giphySearch)}
                    className="px-3 py-1 rounded-sm text-sm"
                    style={{ background: "var(--inst-navy)", color: "var(--inst-white)", font: "var(--text-app-ui)" }}
                  >
                    Search
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {giphyResults.map((gif) => (
                    <button
                      key={gif.id}
                      type="button"
                      onClick={() => {
                        setGiphyId(gif.id);
                        setGiphyUrl(gif.images.fixed_height.url);
                        setGifAltText(gif.title || "GIF");
                        setShowGiphyPicker(false);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={gif.images.fixed_height.url}
                        alt={gif.title}
                        loading="lazy"
                        className="rounded"
                        style={{ height: 80, width: "auto" }}
                      />
                    </button>
                  ))}
                </div>
                <p style={{ font: "var(--text-app-ui)", fontSize: 10, color: "var(--lib-parchment)", marginTop: 6 }}>
                  Powered by GIPHY
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-sm px-4 py-3 disabled:opacity-60"
        style={{
          background: "var(--btn-primary-bg)",
          color: "var(--btn-primary-text)",
          font: "var(--text-app-ui)",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        {submitting ? "Sending…" : "Give kudos"}
      </button>
    </form>
  );
}
