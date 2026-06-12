import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { RateLimitError } from "@/lib/errors/app-error";

interface GiphyFixedHeight {
  url: string;
  width: string;
  height: string;
}

interface GiphyGifRaw {
  id: string;
  title: string;
  images: { fixed_height: GiphyFixedHeight };
}

// In-memory rate limiter: 10 requests per user per 60 seconds
const requestLog = new Map<string, number[]>();

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 10;

  const timestamps = (requestLog.get(userId) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    throw new RateLimitError(60);
  }
  timestamps.push(now);
  requestLog.set(userId, timestamps);
}

export const GET = withTenantContext(async (req, ctx) => {
  checkRateLimit(ctx.userId);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const apiKey = process.env.GIPHY_API_KEY;

  if (!apiKey || !q.trim()) {
    return NextResponse.json({ data: [] });
  }

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "12");
  url.searchParams.set("rating", "g");
  url.searchParams.set("lang", "en");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json({ data: [] });
  }

  const json = await res.json() as { data: GiphyGifRaw[] };
  // Strip all Giphy metadata — return only what the UI needs
  const data = (json.data ?? []).map((gif) => ({
    id: gif.id,
    title: gif.title,
    images: {
      fixed_height: {
        url: gif.images.fixed_height.url,
        width: gif.images.fixed_height.width,
        height: gif.images.fixed_height.height,
      },
    },
  }));

  return NextResponse.json({ data });
});
