"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// CSS custom property spine colour map
const SPINE_CSS_VARS: Record<string, string> = {
  "classic-navy": "var(--spine-navy)",
  "forest-green": "var(--spine-green)",
  "burgundy": "var(--spine-oxblood)",
  "slate-blue": "var(--spine-royal)",
  "warm-terracotta": "var(--spine-brick)",
  "midnight-black": "var(--spine-ink)",
};

const FOIL_CSS_VARS: Record<string, string> = {
  "classic-navy": "var(--foil-light)",
  "forest-green": "var(--foil-light)",
  "burgundy": "var(--foil-light)",
  "slate-blue": "var(--foil-light)",
  "warm-terracotta": "var(--foil-light)",
  "midnight-black": "var(--foil-light)",
};

interface Props {
  id: string;
  bookDesign: string;
  recipientName: string;
  messageSnippet: string;
}

export default function BookSpine({ id, bookDesign, recipientName, messageSnippet }: Props) {
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const bgColor = SPINE_CSS_VARS[bookDesign] ?? "var(--spine-navy)";
  const textColor = FOIL_CSS_VARS[bookDesign] ?? "var(--foil-light)";
  const snippet = messageSnippet.length > 60 ? `${messageSnippet.slice(0, 60)}…` : messageSnippet;

  return (
    <Link
      href={`/book/${id}`}
      aria-label={`Kudos for ${recipientName}: ${snippet}`}
      className="relative block focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <motion.div
        animate={
          reducedMotion
            ? { opacity: hovered ? 0.85 : 1 }
            : {
                y: hovered ? -4 : 0,
                rotateX: hovered ? 4 : 0,
                opacity: hovered ? 0.9 : 1,
              }
        }
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          width: 36,
          height: 140,
          background: bgColor,
          borderRadius: "2px 4px 4px 2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: hovered ? "2px 4px 12px rgba(0,0,0,0.25)" : "1px 2px 4px rgba(0,0,0,0.15)",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {/* Vertical recipient name */}
        <span
          style={{
            color: textColor,
            fontSize: 10,
            fontFamily: "Georgia, serif",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            maxHeight: 120,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "4px 0",
          }}
        >
          {recipientName}
        </span>

        {/* Tooltip on hover */}
        {hovered && (
          <div
            role="tooltip"
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--inst-navy)",
              color: "var(--inst-white)",
              fontSize: 11,
              padding: "6px 10px",
              borderRadius: 3,
              whiteSpace: "nowrap",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              zIndex: 10,
              pointerEvents: "none",
              fontFamily: "Georgia, serif",
            }}
          >
            {snippet}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
