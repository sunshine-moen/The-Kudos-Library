interface AnniversaryReminderData {
  managerFirstName: string;
  memberFirstName: string;
  memberLastName: string;
  yearsCount: number;
  anniversaryKind: "ubc" | "ag";
  memberShelfUrl: string;
  celebrateUrl: string;
  quoteText: string;
  quoteAuthor: string;
}

export function renderAnniversaryReminder(data: AnniversaryReminderData): string {
  const orgLabel = data.anniversaryKind === "ubc" ? "UBC" : "AG Digital Experience";
  const milestone = `${data.yearsCount} ${data.yearsCount === 1 ? "year" : "years"}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Work anniversary coming up</title>
</head>
<body style="margin:0;padding:0;background:#F5EEDD;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B7355;margin:0 0 8px;">
        The Kudos Library
      </p>
      <h1 style="font-size:20px;color:#002145;margin:0;">
        A milestone worth noticing, ${escapeHtml(data.managerFirstName)}
      </h1>
    </div>

    <div style="background:#002145;border-radius:4px;padding:28px 32px;margin-bottom:24px;text-align:center;">
      <p style="color:#E69400;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">
        Work Anniversary
      </p>
      <p style="color:#F5EEDD;font-size:22px;font-weight:bold;margin:0 0 8px;">
        ${escapeHtml(data.memberFirstName)} ${escapeHtml(data.memberLastName)}
      </p>
      <p style="color:#A89565;font-size:15px;font-style:italic;margin:0;">
        ${escapeHtml(milestone)} with ${escapeHtml(orgLabel)}
      </p>
    </div>

    <div style="background:#fff;border-left:4px solid #A89565;padding:20px 24px;border-radius:2px;margin-bottom:24px;">
      <p style="font-size:15px;color:#3D2B1F;margin:0;line-height:1.7;">
        Anniversaries are a natural moment to pause and acknowledge someone&rsquo;s journey.
        A kudos from you could be exactly the recognition ${escapeHtml(data.memberFirstName)}
        carries with them into the next chapter.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="${escapeHtml(data.celebrateUrl)}"
         style="display:inline-block;background:#E69400;color:#002145;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:2px;margin-right:12px;">
        Write a kudos
      </a>
      <a href="${escapeHtml(data.memberShelfUrl)}"
         style="display:inline-block;background:transparent;color:#002145;text-decoration:none;font-size:14px;font-weight:400;padding:12px 16px;border:1px solid #002145;border-radius:2px;">
        Visit their shelf
      </a>
    </div>

    <div style="border-top:1px solid #D4C5A9;padding-top:20px;text-align:center;margin-top:24px;">
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
