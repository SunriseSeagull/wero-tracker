import { buildFeed } from "@/lib/feed";

export async function GET(request: Request) {
  const feed = await buildFeed(request);
  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
