interface KudosReadItem {
  recipientName: string;
  messageSnippet: string;
}

interface KudosWasReadDigestData {
  giverFirstName: string;
  readItems: KudosReadItem[];
  libraryUrl: string;
  quoteText: string;
  quoteAuthor: string;
}

export function renderKudosWasReadDigest(data: KudosWasReadDigestData): string {
  const itemRows = data.readItems
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #EDE0CC;">
        <p style="margin:0 0 4px;font-size:14px;color:#002145;font-weight:bold;">
          ${escapeHtml(item.recipientName)}
        </p>
        <p style="margin:0;font-size:13px;color:#5C4A3D;font-style:italic;line-height:1.5;">
          &ldquo;${escapeHtml(item.messageSnippet)}&rdquo;
        </p>
      </td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your words made it to them</title>
</head>
<body style="margin:0;padding:0;background:#F5EEDD;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B7355;margin:0 0 8px;">
        The Kudos Library
      </p>
      <h1 style="font-size:20px;color:#002145;margin:0;">
        Your words made it to them, ${escapeHtml(data.giverFirstName)}
      </h1>
    </div>

    <div style="background:#fff;border-radius:4px;padding:8px 24px 0;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <div style="background:#002145;border-radius:4px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <p style="color:#F5EEDD;font-size:14px;margin:0 0 4px;line-height:1.7;">
        Recognition matters most when it lands. These kudos were opened and read this week.
      </p>
      <p style="color:#A89565;font-size:13px;margin:0;font-style:italic;">
        Keep celebrating the people around you.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="${escapeHtml(data.libraryUrl)}"
         style="display:inline-block;background:#E69400;color:#002145;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:2px;">
        Visit the library
      </a>
    </div>

    <div style="border-top:1px solid #D4C5A9;padding-top:20px;text-align:center;">
      <p style="font-size:13px;font-style:italic;color:#8B7355;margin:0 0 4px;line-height:1.6;">
        &ldquo;${escapeHtml(data.quoteText)}&rdquo;
      </p>
      <p style="font-size:11px;color:#A89565;margin:0;">— ${escapeHtml(data.quoteAuthor)}</p>
    </div>

  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
