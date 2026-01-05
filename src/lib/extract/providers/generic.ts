import { load, type CheerioAPI } from "cheerio";
import { assertUrlIsSafe } from "@/lib/ssrf";
import { ExtractResult, ProviderResponse } from "./types";

class BlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedError";
  }
}

function normalizeUrl(src: string, base: URL): string | null {
  try {
    const resolved = new URL(src, base);
    return resolved.toString();
  } catch {
    return null;
  }
}

function unique(arr: (string | null | undefined)[]): string[] {
  return Array.from(new Set(arr.filter(Boolean) as string[]));
}

function parseOg($: CheerioAPI, base: URL) {
  const images = $("meta[property='og:image']")
    .map((_, el) => normalizeUrl($(el).attr("content") ?? "", base))
    .get();
  const price = $("meta[property='product:price:amount']").attr("content");
  const currency = $("meta[property='product:price:currency']").attr("content");
  return {
    title: $("meta[property='og:title']").attr("content") ?? undefined,
    description: $("meta[property='og:description']").attr("content") ?? undefined,
    images: images.length ? images : undefined,
    price: price ? Number(price) : undefined,
    currency: currency ?? undefined,
  };
}

function parseTwitter($: CheerioAPI, base: URL) {
  const images = $("meta[name='twitter:image']")
    .map((_, el) => normalizeUrl($(el).attr("content") ?? "", base))
    .get();
  return {
    title: $("meta[name='twitter:title']").attr("content") ?? undefined,
    description: $("meta[name='twitter:description']").attr("content") ?? undefined,
    images: images.length ? images : undefined,
  };
}

function extractFromJsonLd($: CheerioAPI, base: URL): ExtractResult {
  const scripts = $("script[type='application/ld+json']")
    .map((_, el) => $(el).contents().text())
    .get();

  const aggregate: ExtractResult = {};

  for (const script of scripts) {
    try {
      const json = JSON.parse(script);
      const entries = Array.isArray(json) ? json : [json];
      for (const entry of entries) {
        if (!entry || typeof entry !== "object") continue;
        const type = Array.isArray(entry["@type"])
          ? entry["@type"]
          : entry["@type"]
            ? [entry["@type"]]
            : [];
        const isProduct = type.includes("Product");

        if (isProduct) {
          aggregate.title ??= entry.name;
          aggregate.description ??= entry.description;
          if (entry.image) {
            const imgs = Array.isArray(entry.image) ? entry.image : [entry.image];
            const normalized = imgs
              .map((img: string) => normalizeUrl(img, base))
              .filter(Boolean) as string[];
            if (normalized.length) {
              aggregate.images = [...(aggregate.images ?? []), ...normalized];
            }
          }
          const offers = entry.offers
            ? Array.isArray(entry.offers)
              ? entry.offers
              : [entry.offers]
            : [];
          for (const offer of offers) {
            if (!offer) continue;
            if (offer.price && !aggregate.price) {
              aggregate.price = Number(offer.price);
            }
            if (offer.priceCurrency && !aggregate.currency) {
              aggregate.currency = String(offer.priceCurrency);
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  return aggregate;
}

async function fetchHtmlWithLimit(url: URL, timeoutMs = 8000, maxSize = 1_500_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "user-agent": "ValwannaBot/1.1 (+https://example.com)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      if ([401, 403, 429].includes(response.status)) {
        throw new BlockedError(`HTTP ${response.status}`);
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Flux de réponse indisponible");
    }
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.length;
        if (received > maxSize) {
          throw new Error("Réponse trop volumineuse");
        }
        chunks.push(value);
      }
    }
    const decoder = new TextDecoder("utf-8");
    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    return decoder.decode(buffer);
  } finally {
    clearTimeout(timeout);
  }
}

function bestEffortCurrency(url: URL, currency?: string | null) {
  if (currency) return currency;
  const host = url.hostname;
  if (host.endsWith(".fr")) return "EUR";
  return undefined;
}

export function parseGenericHtml(html: string, url: URL): ExtractResult {
  const $ = load(html);

  const og = parseOg($, url);
  const tw = parseTwitter($, url);
  const ld = extractFromJsonLd($, url);

  const title = og.title ?? tw.title ?? ld.title;
  const description = og.description ?? tw.description ?? ld.description;
  const price = og.price ?? ld.price;
  const currency = bestEffortCurrency(url, og.currency ?? ld.currency);
  const images = unique([...(og.images ?? []), ...(tw.images ?? []), ...(ld.images ?? [])]).slice(0, 6);

  return {
    title: title ?? undefined,
    description: description ?? undefined,
    price: price ?? undefined,
    currency: currency ?? undefined,
    images: images.length ? images : undefined,
    mainImage: images[0],
  };
}

export async function genericExtract(url: URL): Promise<ProviderResponse> {
  await assertUrlIsSafe(url.toString());
  const result: ExtractResult = {};
  let source = "empty";
  try {
    const html = await fetchHtmlWithLimit(url);
    const parsed = parseGenericHtml(html, url);
    Object.assign(result, parsed);
    source = Object.values(result).some(Boolean) ? "html" : "empty";
  } catch (error) {
    if (error instanceof BlockedError) {
      source = "blocked";
    } else {
      source = "error";
      console.error("genericExtract error", error);
    }
  }

  return { result, source, blocked: source === "blocked" };
}
