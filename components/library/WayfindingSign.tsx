import Link from "next/link";

interface Props {
  promptText: string | null;
  pickupCount: number;
  showPickupIndicator: boolean;
}

export default function WayfindingSign({ promptText, pickupCount, showPickupIndicator }: Props) {
  if (!promptText && (!showPickupIndicator || pickupCount === 0)) {
    return null;
  }

  return (
    <div
      className="mb-10"
      style={{
        background: "var(--wood-walnut)",
        borderRadius: 4,
        padding: "24px 28px",
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.2)",
      }}
      role="complementary"
      aria-label="Library notices"
    >
      {promptText && (
        <div className="mb-4">
          <p
            style={{
              font: "var(--text-app-ui)",
              fontSize: 11,
              color: "var(--wood-caramel)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 8px",
            }}
          >
            This week we&apos;re noticing
          </p>
          <p
            style={{
              color: "var(--inst-gold)",
              fontFamily: "Georgia, serif",
              fontSize: 16,
              fontStyle: "italic",
              margin: "0 0 12px",
              lineHeight: 1.6,
            }}
          >
            &ldquo;{promptText}&rdquo;
          </p>
          <Link
            href="/celebrate"
            style={{
              display: "inline-block",
              background: "var(--inst-gold)",
              color: "var(--inst-navy)",
              font: "var(--text-app-ui)",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: 2,
            }}
          >
            Write a kudos
          </Link>
        </div>
      )}

      {showPickupIndicator && pickupCount > 0 && (
        <p
          style={{
            font: "var(--text-app-ui)",
            fontSize: 13,
            color: "var(--wood-caramel)",
            margin: 0,
            borderTop: promptText ? "1px solid rgba(255,255,255,0.1)" : "none",
            paddingTop: promptText ? 16 : 0,
          }}
        >
          📚 Your books have been picked up{" "}
          <strong style={{ color: "var(--inst-gold-heritage)" }}>{pickupCount}</strong>{" "}
          {pickupCount === 1 ? "time" : "times"} this week
        </p>
      )}
    </div>
  );
}
