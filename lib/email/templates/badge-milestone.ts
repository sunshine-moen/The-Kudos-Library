interface BadgeMilestoneData {
  recipientFirstName: string;
  badgeName: string;
  badgeDescription: string;
  badgeVisualAsset: string;
  profileUrl: string;
  quoteText: string;
  quoteAuthor: string;
}

export function renderBadgeMilestone(data: BadgeMilestoneData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You earned a badge — ${data.badgeName}</title>
</head>
<body style="margin:0;padding:0;background:#F5EEDD;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B7355;margin:0 0 8px;">
        The Kudos Library
      </p>
      <h1 style="font-size:22px;color:#002145;margin:0;">
        You earned a badge, ${escapeHtml(data.recipientFirstName)}
      </h1>
    </div>

    <!-- Badge visual -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#002145;border-radius:50%;width:80px;height:80px;line-height:80px;font-size:32px;color:#E69400;">
        ★
      </div>
      <h2 style="font-size:20px;color:#002145;margin:16px 0 4px;">
        ${escapeHtml(data.badgeName)}
      </h2>
      <p style="font-size:14px;color:#5C4A2A;margin:0;line-height:1.6;">
        ${escapeHtml(data.badgeDescription)}
      </p>
    </div>

    <!-- Personal note -->
    <div style="background:#fff;border-left:4px solid #E69400;padding:20px 24px;border-radius:2px;margin-bottom:24px;">
      <p style="font-size:15px;color:#3D2B1F;margin:0;line-height:1.7;">
        This badge recognises something real about the way you show up for your colleagues.
        It lives in your profile — a small record of the care you put into this team.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${escapeHtml(data.profileUrl)}"
         style="display:inline-block;background:#E69400;color:#002145;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:2px;letter-spacing:0.02em;">
        View your badge collection
      </a>
    </div>

    <!-- Author quote footer -->
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
