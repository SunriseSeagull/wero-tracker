import { db } from "@/db";
import { BankingApp, CountryOverride, NewBank } from "@/db/schema/banks";
import type { Contribution } from "@/db/schema/contributions";
import { MerchantCategory, NewMerchant } from "@/db/schema/merchants";
import { SupportStatus } from "@/db/schema/support";
import {
  baseSupportStatusOptions,
  merchantCategoryOptions,
  PartnerSystem,
  partnerSystemOptions,
} from "@/lib/constants";
import { parseStatus } from "@/lib/status-helper";
import { Feed } from "feed";
import { cacheLife, cacheTag } from "next/cache";

// These fields are generated or not useful to the user
type IgnoredField =
  "id" | "logoUrl" | "logoChecksum" | "createdAt" | "updatedAt";

type LabeledField = Exclude<keyof NewBank | keyof NewMerchant, IgnoredField>;

type FieldValue<K extends PropertyKey> =
  | (K extends keyof NewBank ? NewBank[K] : never)
  | (K extends keyof NewMerchant ? NewMerchant[K] : never);

type FieldFormatter<K extends LabeledField> = {
  label: string;
  format: (value: NonNullable<FieldValue<K>>) => string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function text(value: string): string {
  return escapeHtml(value);
}

function link(url: string): string {
  let isHttp = false;
  try {
    isHttp = ["http:", "https:"].includes(new URL(url).protocol);
  } catch {}
  if (!isHttp) return escapeHtml(url);
  return `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`;
}

function list(values: string[]): string {
  return values.length > 0 ? escapeHtml(values.join(", ")) : "–";
}

function category(value: MerchantCategory): string {
  const option = merchantCategoryOptions.find((o) => o.value === value);
  return escapeHtml(option?.label ?? value);
}

function status(value: SupportStatus): string {
  const { base, partner } = parseStatus(value);
  const label =
    baseSupportStatusOptions.find((o) => o.value === base)?.label ?? base;
  if (!partner) return escapeHtml(label);
  const partnerLabel =
    partnerSystemOptions[partner as PartnerSystem]?.label ?? partner;
  return escapeHtml(`${label} via ${partnerLabel}`);
}

function overridable<T>(format: (value: NonNullable<T>) => string) {
  const single = (v: T) =>
    v === null || v === undefined || v === ""
      ? "–"
      : format(v as NonNullable<T>);
  return (value: T | CountryOverride<T>): string => {
    if (typeof value !== "object" || value === null || !("default" in value)) {
      return single(value as T);
    }
    const { default: fallback, ...overrides } = value as CountryOverride<T>;
    const entries = Object.entries(overrides);
    if (entries.length === 0) return single(fallback);
    const formatted = entries
      .map(([country, v]) => `${escapeHtml(country)}: ${single(v)}`)
      .join("; ");
    return `${single(fallback)} (${formatted})`;
  };
}

function bankingApps(apps: BankingApp[]): string {
  if (apps.length === 0) return "–";
  const items = apps.map(
    (app) =>
      `<li>${escapeHtml(app.name)}: Wero support: ${overridable<SupportStatus>(status)(app.weroSupport)}; Link: ${overridable<string>(link)(app.universalLink)}; Countries: ${list(app.supportedCountries)}</li>`,
  );
  return `<ul>${items.join("")}</ul>`;
}

const FIELDS: { [K in LabeledField]: FieldFormatter<K> } = {
  name: { label: "Name", format: overridable<string>(text) },
  aliases: { label: "Aliases", format: list },
  website: { label: "Website", format: overridable<string>(link) },
  countries: { label: "Countries", format: list },
  category: { label: "Category", format: category },
  weroSupport: { label: "Wero support", format: status },
  p2pPaymentsSupport: {
    label: "P2P payments",
    format: overridable<SupportStatus>(status),
  },
  eCommercePaymentsSupport: {
    label: "E-commerce payments",
    format: overridable<SupportStatus>(status),
  },
  posPaymentsSupport: {
    label: "POS payments",
    format: overridable<SupportStatus>(status),
  },
  standaloneAppSupport: {
    label: "Standalone Wero app",
    format: overridable<SupportStatus>(status),
  },
  bankingApps: { label: "Banking apps", format: bankingApps },
  notes: { label: "Notes", format: overridable<string | null>(text) },
};

function isLabeledField(key: string): key is LabeledField {
  return key in FIELDS;
}

function renderValue<K extends LabeledField>(key: K, value: unknown): string {
  if (value === null || value === undefined || value === "") return "–";
  return FIELDS[key].format(value as NonNullable<FieldValue<K>>);
}

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
      if (!isLabeledField(key)) continue;
      if (stripChecksums(data[key]) === stripChecksums(previous[key])) continue;
      rows.push(
        `<li><strong>${escapeHtml(FIELDS[key].label)}</strong>: ${renderValue(key, previous[key])} → ${renderValue(key, data[key])}</li>`,
      );
    }
  } else {
    for (const [key, value] of Object.entries(data)) {
      if (!isLabeledField(key)) continue;
      rows.push(
        `<li><strong>${escapeHtml(FIELDS[key].label)}</strong>: ${renderValue(key, value)}</li>`,
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
      category: [
        c.type === "bank"
          ? { term: c.type, name: "Bank" }
          : { term: c.type, name: "Merchant" },
      ],
      content: buildContent(c, coAuthorName),
    });
  }

  return feed;
}
