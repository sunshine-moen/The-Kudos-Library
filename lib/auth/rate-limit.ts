import { prisma } from "@/lib/db/prisma";
import { RateLimitError } from "@/lib/errors/app-error";

// In-memory IP counter — good enough for v1 single-instance Vercel deployment.
// Replace with Redis/Upstash for multi-instance or v1.5+.
const ipHits = new Map<string, { count: number; resetAt: number }>();

const IP_LIMIT = 5;
const IP_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_WINDOW_MS = 5 * 60 * 1000;

export async function checkLoginRateLimit(ip: string, email: string): Promise<void> {
  const now = Date.now();

  // IP rate limit
  const ipEntry = ipHits.get(ip);
  if (ipEntry && now < ipEntry.resetAt) {
    if (ipEntry.count >= IP_LIMIT) {
      throw new RateLimitError(Math.ceil((ipEntry.resetAt - now) / 1000));
    }
    ipEntry.count++;
  } else {
    ipHits.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
  }

  // Per-email rate limit using DB (survives restarts)
  const emailWindowStart = new Date(now - EMAIL_WINDOW_MS);
  const emailCount = await prisma.magicLinkToken.count({
    where: { email, kind: "login", created_at: { gte: emailWindowStart } },
  });
  if (emailCount >= 1) {
    throw new RateLimitError(Math.ceil(EMAIL_WINDOW_MS / 1000));
  }
}
