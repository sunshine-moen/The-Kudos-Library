interface InactiveNudgeData {
  recipientFirstName: string;
  weeksSinceLastKudos: number;
  featuredPromptText: string | null;
  celebrateUrl: string;
  quoteText: string;
  quoteAuthor: string;
}

export function renderInactiveNudge(data: InactiveNudgeData): string {
  const promptSection = data.featuredPromptText
    ? `
    <div style="background:#F5EEDD;border:1px solid #D4C5A9;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
      <p style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B7355;margin:0 0 8px;">
        This week's prompt
      </p>
      <p style="font-size:15px;color:#3D2B1F;margin:0;font-style:italic;line-height:1.6;">
        "${escapeHtml(data.featuredPromptText)}"
      </p>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The library misses your voice</title>
</head>
<body style="margin:0;padding:0;background:#F5EEDD;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B7355;margin:0 0 8px;">
        The Kudos Library
      </p>
      <h1 style="font-size:22px;color:#002145;margin:0;">
        The library misses your voice, ${escapeHtml(data.recipientFirstName)}
      </h1>
    </div>

    <div style="background:#fff;border-left:4px solid #A89565;padding:20px 24px;border-radius:2px;margin-bottom:24px;">
      <p style="font-size:15px;color:#3D2B1F;margin:0;line-height:1.7;">
        It's been a while since your last kudos — and that's okay. Life gets busy.
        But if there's something you've noticed about a colleague lately, this is your gentle nudge to say it.
        The library keeps things like this. Your words matter more than you know.
      </p>
    </div>

    ${promptSection}

    <div style="text-align:center;margin-bottom:32px;">
      <a href="${escapeHtml(data.celebrateUrl)}"
         style="display:inline-block;background:#E69400;color:#002145;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:2px;">
        Give a kudos
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
