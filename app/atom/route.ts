import { buildFeed } from "@/lib/feed";

export async function GET(request: Request) {
  const feed = await buildFeed(request);
  return new Response(feed.atom1(), {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
