import { db } from "@/db";
import type { Contribution } from "@/db/schema/contributions";
import { Feed } from "feed";
import { cacheLife, cacheTag } from "next/cache";

const IGNORED_FIELDS = new Set(["id", "logoChecksum"]);

async function getApprovedContributions() {
  "use cache";
  cacheTag("contributions");
  cacheLife("hours");

  return db.query.contributions.findMany({
    where: (c, { eq }) => eq(c.status, "approved"),
    with: {
      user: { columns: { name: true } },
      coAuthor: { columns: { name: true } },
    },
    orderBy: (c, { desc }) => [desc(c.updatedAt)],
    limit: 50,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "–";
  if (Array.isArray(value)) {
    if (value.length === 0) return "–";
    return value
      .map((v) => (typeof v === "object" && v && "name" in v ? v.name : v))
      .join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, v]) => `${key}: ${formatValue(v)}`)
      .join("; ");
  }
  return String(value);
}

function stripChecksums(value: unknown): unknown {
  return JSON.stringify(value, (key, v) =>
    key === "iconChecksum" ? undefined : v,
  );
}

function buildContent(
  contribution: Contribution,
  coAuthorName: string | undefined,
): string {
  const data = contribution.data as Record<string, unknown>;
  const previous = contribution.previousData as Record<string, unknown> | null;
  const rows: string[] = [];

  if (contribution.action === "edit" && previous) {
    for (const key of Object.keys(data)) {
      if (IGNORED_FIELDS.has(key)) continue;
      if (stripChecksums(data[key]) === stripChecksums(previous[key])) continue;
      rows.push(
        `<li><strong>${escapeHtml(key)}</strong>: ${escapeHtml(formatValue(previous[key]))} → ${escapeHtml(formatValue(data[key]))}</li>`,
      );
    }
  } else {
    for (const [key, value] of Object.entries(data)) {
      if (IGNORED_FIELDS.has(key)) continue;
      rows.push(
        `<li><strong>${escapeHtml(key)}</strong>: ${escapeHtml(formatValue(value))}</li>`,
      );
    }
  }

  const parts: string[] = [];
  if (contribution.reason) {
    parts.push(`<p>${escapeHtml(contribution.reason)}</p>`);
  }
  if (rows.length > 0) parts.push(`<ul>${rows.join("")}</ul>`);
  // JSON Feed only renders the first author, so mention the co-author in the body too
  if (coAuthorName) {
    parts.push(`<p>Co-authored by ${escapeHtml(coAuthorName)}</p>`);
  }
  return parts.join("");
}

export async function buildFeed(request: Request): Promise<Feed> {
  const origin = new URL(request.url).origin;
  const contributions = await getApprovedContributions();

  const feed = new Feed({
    id: `${origin}/`,
    title: "Wero Tracker - Changes",
    description: "Changes to banks and merchants on the Wero Tracker",
    link: `${origin}/`,
    feedLinks: {
      atom: `${origin}/atom`,
      rss: `${origin}/rss`,
      json: `${origin}/json`,
    },
    updated: contributions[0]?.updatedAt ?? new Date(0),
    generator: false,
  });

  for (const c of contributions) {
    const type = c.type === "bank" ? "Bank" : "Merchant";
    let action;
    switch (c.action) {
      case "add":
        action = "added";
        break;
      case "edit":
        action = "updated";
        break;
      case "delete":
        action = "removed";
        break;
    }
    const name =
      typeof c.data.name === "string" ? c.data.name : c.data.name.default;
    const coAuthorName = c.coAuthor?.name;
    feed.addItem({
      id: `urn:uuid:${c.id}`,
      title: `${type} ${action}: ${name}`,
      link: `${origin}/${c.type === "merchant" ? "?view=merchants" : "?view=banks"}`,
      date: c.updatedAt,
      published: c.createdAt,
      author: [
        { name: c.user?.name ?? "Unknown" },
        ...(coAuthorName ? [{ name: coAuthorName }] : []),
      ],
      category: [{ term: c.type }],
      content: buildContent(c, coAuthorName),
    });
  }

  return feed;
}
