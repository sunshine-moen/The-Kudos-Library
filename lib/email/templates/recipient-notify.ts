import type { AuthorQuote, Kudos, KudosValue, User, ValueTag } from "@prisma/client";

export interface RecipientNotifyData {
  kudos: Kudos & { kudos_values: (KudosValue & { value_tag: ValueTag })[] };
  giver: Pick<User, "first_name" | "last_name">;
  recipient: Pick<User, "first_name" | "last_name" | "email">;
  deepLinkUrl: string;
  quote: AuthorQuote;
  contextCategoryLabel?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderRecipientNotify(data: RecipientNotifyData): { subject: string; html: string } {
  const { kudos, giver, recipient, deepLinkUrl, quote } = data;
  const giverName = `${giver.first_name} ${giver.last_name}`;
  const recipientFirstName = recipient.first_name;

  const valueTags = kudos.kudos_values.map((kv) => kv.value_tag.label);
  const valueTagsHtml =
    valueTags.length > 0
      ? `<p style="margin:12px 0 0;font-size:13px;color:#6b5c45;">
          ${valueTags.map((t) => `<span style="background:#f5efe6;padding:2px 8px;border-radius:3px;margin-right:6px;">${escapeHtml(t)}</span>`).join("")}
        </p>`
      : "";

  const contextHtml =
    kudos.context_text
      ? `<p style="margin:12px 0 0;font-size:14px;color:#6b5c45;font-style:italic;">
          ${data.contextCategoryLabel ? `<strong>${escapeHtml(data.contextCategoryLabel)}:</strong> ` : ""}${escapeHtml(kudos.context_text)}
        </p>`
      : "";

  const subject = `${giverName} gave you kudos`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5efe6;font-family:Georgia,serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(giverName)} wrote something for you — read it in The Kudos Library.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fffdf8;border-radius:4px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a2e4a;padding:24px 32px;">
              <p style="margin:0;color:#d4a843;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:sans-serif;">The Kudos Library</p>
            </td>
          </tr>

          <!-- Book visual -->
          <tr>
            <td align="center" style="padding:32px 32px 0;">
              <div style="width:80px;height:110px;background:#1a2e4a;border-radius:2px 4px 4px 2px;display:inline-block;box-shadow:2px 2px 6px rgba(0,0,0,0.2);">
                <div style="width:8px;height:100%;background:rgba(255,255,255,0.1);border-radius:2px 0 0 2px;float:left;"></div>
              </div>
            </td>
          </tr>

          <!-- From line -->
          <tr>
            <td style="padding:24px 32px 0;text-align:center;">
              <p style="margin:0;font-size:13px;color:#6b5c45;font-family:sans-serif;">A kudos from</p>
              <p style="margin:4px 0 0;font-size:22px;color:#1a2e4a;font-weight:bold;">${escapeHtml(giverName)}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6b5c45;font-family:sans-serif;">to ${escapeHtml(recipientFirstName)}</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:16px;line-height:1.7;color:#2c1e0f;white-space:pre-wrap;">${escapeHtml(kudos.message_text)}</p>
              ${valueTagsHtml}
              ${contextHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:8px 32px 32px;">
              <a href="${escapeHtml(deepLinkUrl)}"
                 style="display:inline-block;background:#1a2e4a;color:#d4a843;font-family:sans-serif;font-size:14px;font-weight:600;padding:12px 28px;border-radius:3px;text-decoration:none;letter-spacing:0.5px;">
                Read it here →
              </a>
              <p style="margin:12px 0 0;font-size:11px;color:#9e8c78;font-family:sans-serif;">Link expires in 14 days.</p>
            </td>
          </tr>

          <!-- Quote footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e8dfd0;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b5c45;font-style:italic;">
                &ldquo;${escapeHtml(quote.quote_text)}&rdquo;
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#9e8c78;font-family:sans-serif;">— ${escapeHtml(quote.author_name)}${quote.author_country ? `, ${escapeHtml(quote.author_country)}` : ""}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
