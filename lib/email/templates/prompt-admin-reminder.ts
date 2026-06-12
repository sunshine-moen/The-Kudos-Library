interface PromptAdminReminderData {
  recipientFirstName: string;
  queuedCount: number;
  threshold: number;
  adminPromptsUrl: string;
  quoteText: string;
  quoteAuthor: string;
}

export function renderPromptAdminReminder(data: PromptAdminReminderData): string {
  const urgency = data.queuedCount === 0 ? "The queue is empty" : `Only ${data.queuedCount} prompt${data.queuedCount === 1 ? "" : "s"} left`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Featured prompt queue is running low</title>
</head>
<body style="margin:0;padding:0;background:#F5EEDD;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B7355;margin:0 0 8px;">
        The Kudos Library — Admin Notice
      </p>
      <h1 style="font-size:20px;color:#002145;margin:0;">
        Time to add more prompts, ${escapeHtml(data.recipientFirstName)}
      </h1>
    </div>

    <div style="background:#fff;border-left:4px solid #E69400;padding:20px 24px;border-radius:2px;margin-bottom:24px;">
      <p style="font-size:15px;color:#3D2B1F;margin:0 0 8px;line-height:1.7;">
        <strong>${escapeHtml(urgency)}</strong> in the featured prompt queue
        (threshold: ${data.threshold}).
      </p>
      <p style="font-size:14px;color:#5C4A3D;margin:0;line-height:1.7;">
        A good prompt helps the whole team notice and celebrate the people who might otherwise
        go unrecognized. Keep the queue full so every week gets a fresh spark.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="${escapeHtml(data.adminPromptsUrl)}"
         style="display:inline-block;background:#002145;color:#E69400;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:2px;">
        Add prompts to the queue
      </a>
    </div>

    <div style="background:#F0E8D5;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
      <p style="font-size:13px;color:#5C4A3D;margin:0;line-height:1.6;">
        <strong>Quick tip:</strong> Prompts tied to a specific value tag tend to generate
        the most responses. Try writing one that spotlights a value the team has been
        living lately.
      </p>
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
