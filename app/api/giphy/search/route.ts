import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";

export const GET = withTenantContext(async (req, _ctx) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const apiKey = process.env.GIPHY_API_KEY;

  if (!apiKey) {
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

  const json = await res.json() as { data: unknown[] };
  return NextResponse.json({ data: json.data });
});
