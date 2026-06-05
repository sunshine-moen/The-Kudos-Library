"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCT_COPY } from "@/lib/content/hardcoded";

interface ValueTag {
  label: string;
}

interface KudosData {
  id: string;
  message_text: string;
  book_design: string;
  giphy_id: string | null;
  context_text: string | null;
  deleted_at: string | null;
  giver: { first_name: string; last_name: string };
  recipient: { first_name: string; last_name: string } | null;
  context_category: { label: string } | null;
  kudos_values: { value_tag: ValueTag }[];
}

interface Props {
  kudos: KudosData;
  isFirstEverRead: boolean;
  isModal?: boolean;
  isAdmin?: boolean;
}

// Book spine colour map — keyed by book_design preset
const SPINE_COLORS: Record<string, string> = {
  "classic-navy": "var(--spine-navy)",
  "forest-green": "var(--spine-green)",
  "burgundy": "var(--spine-oxblood)",
  "slate-blue": "var(--spine-royal)",
  "warm-terracotta": "var(--spine-brick)",
  "midnight-black": "var(--spine-ink)",
};

export default function BookModal({ kudos, isFirstEverRead, isModal = false, isAdmin = false }: Props) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);

  const spineColor = SPINE_COLORS[kudos.book_design] ?? SPINE_COLORS["classic-navy"]!;
  const giverName = `${kudos.giver.first_name} ${kudos.giver.last_name}`;
  const recipientFirstName = kudos.recipient?.first_name ?? "you";

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/kudos/${kudos.id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      if (isModal) {
        router.back();
      } else {
        router.push("/library");
      }
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  }

  const content = (
    <article
      className="w-full max-w-lg mx-auto rounded-sm overflow-hidden"
      style={{ background: "var(--lib-cream)", boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}
    >
      {/* Teaching moment */}
      {isFirstEverRead && (
        <div
          className="px-6 py-4"
          style={{ background: "var(--inst-navy)", color: "var(--inst-gold)" }}
          role="note"
        >
          <p style={{ font: "var(--text-app-body-sm)", fontStyle: "italic" }}>
            {PRODUCT_COPY.teachingMoments?.individual
              ? PRODUCT_COPY.teachingMoments.individual(kudos.giver.first_name)
              : `This is what ${kudos.giver.first_name} saw. The library keeps things like this.`}
          </p>
        </div>
      )}

      {/* Book visual */}
      <div className="flex justify-center pt-8 pb-4">
        <div
          style={{
            width: 80,
            height: 110,
            background: spineColor,
            borderRadius: "2px 4px 4px 2px",
            boxShadow: "2px 2px 8px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 8, height: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "2px 0 0 2px", float: "left" }} />
        </div>
      </div>

      {/* From / to header */}
      <div className="px-6 pb-2 text-center">
        <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)" }}>from</p>
        <p style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}>{giverName}</p>
        <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)" }}>
          to {kudos.recipient ? `${kudos.recipient.first_name} ${kudos.recipient.last_name}` : recipientFirstName}
        </p>
      </div>

      {/* Deleted indicator */}
      {kudos.deleted_at && (
        <div className="mx-6 mb-2 rounded px-3 py-1 text-sm text-center"
          style={{ background: "var(--state-error-bg)", color: "var(--state-error-text)" }}>
          This kudos has been removed by an admin.
        </div>
      )}

      {/* Message */}
      <div className="px-6 py-4">
        <p style={{ font: "var(--text-app-body)", color: "var(--lib-ink)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {kudos.message_text}
        </p>
      </div>

      {/* Value tags */}
      {kudos.kudos_values.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {kudos.kudos_values.map((kv, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-sm text-sm"
              style={{ background: "var(--lib-parchment)", color: "var(--lib-ink)", font: "var(--text-app-ui)" }}
            >
              {kv.value_tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Context */}
      {kudos.context_text && (
        <div className="px-6 pb-4">
          <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-parchment)", fontStyle: "italic" }}>
            {kudos.context_category?.label && <strong>{kudos.context_category.label}: </strong>}
            {kudos.context_text}
          </p>
        </div>
      )}

      {/* GIF */}
      {kudos.giphy_id && (
        <div className="px-6 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://media.giphy.com/media/${kudos.giphy_id}/giphy.gif`}
            alt="Kudos GIF"
            className="rounded max-w-full"
            style={{ maxHeight: 200 }}
          />
        </div>
      )}

      {/* Pay-it-forward nudge placeholder (Phase C2) */}
      {!isFirstEverRead && <div aria-hidden className="pb-4" />}

      {/* Controls */}
      <div className="px-6 pb-6 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--lib-parchment)", font: "var(--text-app-ui)" }}>
          <input
            type="checkbox"
            checked={motionEnabled}
            onChange={(e) => setMotionEnabled(e.target.checked)}
          />
          Animation
        </label>

        {isAdmin && !kudos.deleted_at && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm px-3 py-1 rounded-sm"
            style={{ background: "var(--state-error-bg)", color: "var(--state-error-text)", font: "var(--text-app-ui)" }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-sm p-6 w-full max-w-sm"
            style={{ background: "var(--lib-cream)" }}
          >
            <p className="mb-4" style={{ font: "var(--text-app-body)", color: "var(--lib-ink)" }}>
              Remove this kudos? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-sm"
                style={{ background: "var(--state-error-text)", color: "var(--inst-white)", font: "var(--text-app-ui)", fontWeight: 600 }}
              >
                {deleting ? "Removing…" : "Yes, remove it"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-sm border"
                style={{ borderColor: "var(--lib-ink)", color: "var(--lib-ink)", font: "var(--text-app-ui)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );

  if (!isModal) return <div className="px-4 py-8">{content}</div>;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) router.back(); }}
    >
      <AnimatePresence>
        <motion.div
          initial={motionEnabled ? { rotateY: -90, opacity: 0 } : false}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ width: "100%", maxWidth: 560 }}
        >
          <button
            onClick={() => router.back()}
            className="mb-2 text-sm underline block ml-auto"
            style={{ color: "var(--inst-white)", font: "var(--text-app-ui)" }}
          >
            ← Back
          </button>
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
