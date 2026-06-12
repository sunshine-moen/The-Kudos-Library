import BookSpine from "./BookSpine";

interface KudosItem {
  id: string;
  book_design: string;
  message_text: string;
  recipient: { first_name: string; last_name: string } | null;
  team_recipient: { name: string } | null;
}

interface Props {
  title: string;
  kudos: KudosItem[];
  emptyMessage?: string;
}

export default function BookShelf({ title, kudos, emptyMessage }: Props) {
  return (
    <section className="mb-10" aria-label={title}>
      <h2
        className="mb-3"
        style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}
      >
        {title}
      </h2>

      {/* Shelf surface */}
      <div
        className="relative rounded-sm px-4 pt-4 pb-6"
        style={{ background: "var(--wood-walnut)", minHeight: 180 }}
      >
        {kudos.length === 0 ? (
          <p style={{ color: "var(--wood-caramel)", font: "var(--text-app-ui)", fontSize: 13, fontStyle: "italic", paddingTop: 48, textAlign: "center" }}>
            {emptyMessage ?? "No kudos yet."}
          </p>
        ) : (
          <div
            className="flex flex-wrap gap-2 items-end"
            role="list"
            aria-label={`Books on ${title} shelf`}
          >
            {kudos.map((k) => {
              const recipientName = k.recipient
                ? `${k.recipient.first_name} ${k.recipient.last_name}`
                : (k.team_recipient?.name ?? "Team");
              return (
                <div key={k.id} role="listitem">
                  <BookSpine
                    id={k.id}
                    bookDesign={k.book_design}
                    recipientName={recipientName}
                    messageSnippet={k.message_text}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Shelf ledge */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 12,
            background: "var(--wood-walnut-deep)",
            borderRadius: "0 0 4px 4px",
          }}
          aria-hidden
        />
      </div>
    </section>
  );
}
