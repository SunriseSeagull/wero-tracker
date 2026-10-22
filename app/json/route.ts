import { buildFeed } from "@/lib/feed";

export async function GET(request: Request) {
  const feed = await buildFeed(request);
  return new Response(feed.json1(), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
