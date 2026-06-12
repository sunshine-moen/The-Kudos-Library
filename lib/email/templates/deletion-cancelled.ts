interface DeletionCancelledData {
  firstName: string;
}

export function renderDeletionCancelled(data: DeletionCancelledData): string {
  const { firstName } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Account deletion cancelled</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fffdf7;border-radius:4px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr><td style="background:#1a2744;padding:28px 40px;">
          <p style="margin:0;color:#f5f0e8;font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:.02em;">The Kudos Library</p>
        </td></tr>
        <tr><td style="padding:36px 40px 24px;">
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#1a2744;font-family:Georgia,serif;">Your account deletion has been cancelled</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3d2b1f;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3d2b1f;">
            Your account deletion request has been cancelled. Your account is active and nothing has changed.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3d2b1f;">
            Welcome back to the library.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="/library" style="display:inline-block;background:#1a2744;color:#f5f0e8;font-family:Georgia,serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:2px;text-decoration:none;">
              Go to library
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#7a6652;">
            If you did not cancel this deletion, please contact your administrator immediately.
          </p>
        </td></tr>
        <tr><td style="background:#f5f0e8;padding:20px 40px;border-top:1px solid #e8dcc8;">
          <p style="margin:0;font-size:12px;color:#7a6652;font-family:Georgia,serif;">The Kudos Library · AG Digital Experience</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
