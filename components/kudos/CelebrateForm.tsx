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

export default function CelebrateForm() {
  const [members, setMembers] = useState<Member[]>([]);
  const [valueTags, setValueTags] = useState<ValueTag[]>([]);
  const [contextCategories, setContextCategories] = useState<ContextCategory[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [bookDesign, setBookDesign] = useState("classic-navy");
  const [fontChoice, setFontChoice] = useState("garamond");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [contextCategoryId, setContextCategoryId] = useState<string | null>(null);
  const [contextText, setContextText] = useState("");
  const [giphyId, setGiphyId] = useState<string | null>(null);
  const [giphyUrl, setGiphyUrl] = useState<string | null>(null);
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
    ]).then(([m, vt, cc]) => {
      setMembers(m);
      setValueTags(vt);
      setContextCategories(cc);
    });
  }, []);

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
    if (!recipientId) { setError("Please select a recipient."); return; }
    if (!message.trim()) { setError("Please write a message."); return; }
    if (contextText.length > 200) { setError("Context text must be 200 characters or fewer."); return; }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/kudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "individual",
        recipient_id: recipientId,
        message_text: message,
        book_design: bookDesign,
        font_choice: fontChoice,
        value_tag_ids: selectedTagIds,
        context_category_id: contextCategoryId ?? null,
        context_text: contextCategoryId ? (contextText || null) : null,
        giphy_id: giphyId ?? null,
      }),
    });

    if (res.ok) {
      const data = await res.json() as { kudos_id: string; edit_window_expires_at: string };
      setConfirmed({
        kudosId: data.kudos_id,
        editWindowExpiresAt: new Date(data.edit_window_expires_at),
        recipientName,
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

      {/* Recipient */}
      <div>
        <label
          htmlFor="recipient-search"
          className="block mb-1"
          style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)", fontWeight: 600 }}
        >
          Who are you celebrating? <span aria-hidden>*</span>
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
      </div>

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={giphyUrl} alt="Selected GIF" className="rounded" style={{ maxHeight: 120 }} />
            <button
              type="button"
              onClick={() => { setGiphyId(null); setGiphyUrl(null); }}
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
                      onClick={() => { setGiphyId(gif.id); setGiphyUrl(gif.images.fixed_height.url); setShowGiphyPicker(false); }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={gif.images.fixed_height.url}
                        alt={gif.title}
                        className="rounded"
                        style={{ height: 80, width: "auto" }}
                      />
                    </button>
                  ))}
                </div>
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
