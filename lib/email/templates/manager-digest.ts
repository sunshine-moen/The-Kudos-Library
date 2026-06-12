export interface DirectReportKudos {
  recipientFirstName: string;
  recipientLastName: string;
  giverFirstName: string;
  messageSnippet: string;
  valueLabels: string[];
}

export interface BadgeEarned {
  memberFirstName: string;
  badgeName: string;
}

export interface ManagerDigestData {
  managerFirstName: string;
  baseUrl: string;
  kudosList: DirectReportKudos[];
  badgesList: BadgeEarned[];
  quoteText: string;
  quoteAuthor: string;
}

export function renderManagerDigest(data: ManagerDigestData): { subject: string; html: string } {
  const subject = "Your team's week in kudos";

  const kudosRows = data.kudosList.map((k) => {
    const values = k.valueLabels.length > 0
      ? `<p style="margin:4px 0 0;font-size:12px;color:#666;">${k.valueLabels.join(" · ")}</p>`
      : "";
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e8dcc8;">
          <p style="margin:0;font-weight:600;color:#002145;">
            ${escHtml(k.recipientFirstName)} ${escHtml(k.recipientLastName)}
          </p>
          <p style="margin:4px 0 0;color:#3a3028;font-size:14px;">
            "${escHtml(k.messageSnippet)}" — ${escHtml(k.giverFirstName)}
          </p>
          ${values}
        </td>
      </tr>`;
  }).join("");

  const badgesSection = data.badgesList.length > 0
    ? `<tr><td style="padding:16px 0 8px;">
        <p style="margin:0;font-weight:600;color:#002145;font-size:14px;">Badges earned this week</p>
        ${data.badgesList.map((b) =>
          `<p style="margin:4px 0 0;color:#3a3028;font-size:14px;">
            ${escHtml(b.memberFirstName)} earned <strong>${escHtml(b.badgeName)}</strong>
          </p>`
        ).join("")}
      </td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5eddd;font-family:Georgia,serif;">
  <span style="display:none;max-height:0;overflow:hidden;">
    Your team gave and received kudos this week — here's what happened.
  </span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5eddd;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#002145;padding:24px 32px;">
            <p style="margin:0;color:#FFFFFF;font-size:20px;font-weight:600;">The Kudos Library</p>
            <p style="margin:4px 0 0;color:#A89565;font-size:14px;">Weekly Manager Digest</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 16px;color:#002145;font-size:16px;">
              Hi ${escHtml(data.managerFirstName)},
            </p>
            <p style="margin:0 0 20px;color:#3a3028;">
              Here's what your team was recognised for this week.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${kudosRows}
              ${badgesSection}
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="${data.baseUrl}/library"
                style="display:inline-block;background:#002145;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:3px;font-size:14px;font-weight:600;">
                View the library
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e8dcc8;">
            <p style="margin:0;font-style:italic;color:#6b5c4a;font-size:13px;">
              "${escHtml(data.quoteText)}" — ${escHtml(data.quoteAuthor)}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

export interface ManagerQuietWeekData {
  managerFirstName: string;
  baseUrl: string;
  quoteText: string;
  quoteAuthor: string;
}

export function renderManagerQuietWeek(data: ManagerQuietWeekData): { subject: string; html: string } {
  const subject = "A quiet week — and an invitation";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5eddd;font-family:Georgia,serif;">
  <span style="display:none;max-height:0;overflow:hidden;">
    A quiet week — the library is ready when you are.
  </span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5eddd;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#002145;padding:24px 32px;">
            <p style="margin:0;color:#FFFFFF;font-size:20px;font-weight:600;">The Kudos Library</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 16px;color:#002145;font-size:16px;">Hi ${escHtml(data.managerFirstName)},</p>
            <p style="margin:0 0 16px;color:#3a3028;">
              This was a quiet week for kudos in your team — no recognitions came through in the digest window.
            </p>
            <p style="margin:0 0 20px;color:#3a3028;">
              That's okay. Quiet weeks happen. If something worth recognising did happen,
              it's never too late to write it down — kudos in the library stay for good.
            </p>
            <div style="text-align:center;margin-bottom:8px;">
              <a href="${data.baseUrl}/celebrate"
                style="display:inline-block;background:#002145;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:3px;font-size:14px;font-weight:600;margin-right:8px;">
                Give a kudos
              </a>
              <a href="${data.baseUrl}/library"
                style="display:inline-block;background:transparent;color:#002145;text-decoration:none;padding:12px 28px;border-radius:3px;font-size:14px;font-weight:600;border:1px solid #002145;">
                View the library
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e8dcc8;">
            <p style="margin:0;font-style:italic;color:#6b5c4a;font-size:13px;">
              "${escHtml(data.quoteText)}" — ${escHtml(data.quoteAuthor)}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
