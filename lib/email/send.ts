import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}

export interface SendEmailResult {
  delivered: boolean;
  providerMessageId?: string;
  error?: string;
}

export async function sendEmail(opts: SendEmailOpts): Promise<SendEmailResult> {
  try {
    const { data, error } = await getResend().emails.send(
      {
        from: process.env.RESEND_FROM_EMAIL ?? "kudos@example.com",
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      },
      { idempotencyKey: opts.idempotencyKey },
    );

    if (error) {
      return { delivered: false, error: error.message };
    }

    return { delivered: true, providerMessageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { delivered: false, error: message };
  }
}
