export interface OverlookedRecipientData {
  managerFirstName: string;
  overlookedNames: string[];
  windowDays: number;
  baseUrl: string;
  quoteText: string;
  quoteAuthor: string;
}

export function renderOverlookedRecipient(data: OverlookedRecipientData): { subject: string; html: string } {
  const subject = "A chance to recognise someone on your team";

  const nameList = data.overlookedNames
    .map((n) => `<li style="margin:4px 0;color:#3a3028;">${escHtml(n)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5eddd;font-family:Georgia,serif;">
  <span style="display:none;max-height:0;overflow:hidden;">
    A gentle reminder about someone on your team who hasn't been recognised recently.
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
            <p style="margin:0 0 12px;color:#3a3028;">
              ${data.overlookedNames.length > 1
                ? "A few members of your team haven't had a kudos in the library for a while:"
                : "One of your team members hasn't had a kudos in the library recently:"}
            </p>
            <ul style="margin:0 0 16px;padding-left:20px;">
              ${nameList}
            </ul>
            <p style="margin:0 0 20px;color:#3a3028;">
              This is just a gentle nudge — an invitation to pause and notice.
              If something worth celebrating has happened, even something small,
              the library is a good place to keep it. A kudos doesn't have to be a grand gesture.
              It just has to be true.
            </p>
            <div style="text-align:center;">
              <a href="${data.baseUrl}/celebrate"
                style="display:inline-block;background:#002145;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:3px;font-size:14px;font-weight:600;">
                Give a kudos
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e8dcc8;">
            <p style="margin:0;font-style:italic;color:#6b5c4a;font-size:13px;">
              "${escHtml(data.quoteText)}" — ${escHtml(data.quoteAuthor)}
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#aaa;">
              You can update your email preferences in your
              <a href="${data.baseUrl}/profile" style="color:#6b5c4a;">profile settings</a>.
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
