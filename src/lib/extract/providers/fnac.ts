import { load } from "cheerio";
import { assertUrlIsSafe } from "@/lib/ssrf";
import { ExtractResult, ProviderResponse } from "./types";

export function matchesFnac(url: URL) {
  return url.hostname.includes("fnac.");
}

function parsePrice(str: string | undefined): number | undefined {
  if (!str) return undefined;
  const cleaned = str.replace(/\s|€|€/g, "").replace(",", ".");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

function extractFromHtml(html: string, base: URL): ExtractResult {
  const $ = load(html);
  const title = $("h1").first().text().trim() || $("meta[property='og:title']").attr("content") || undefined;
  const description =
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='description']").attr("content") ||
    undefined;

  const images: string[] = [];
  $(".ThumbnailSlider__thumbnail img, .f-productVisualsCarousel-list img, .f-visualsCarousel img, [data-product-visual] img")
    .each((_, el) => {
      const src = $(el).attr("data-src") || $(el).attr("src");
      if (src) {
        try {
          images.push(new URL(src, base).toString());
        } catch {
          /* ignore */
        }
      }
    });
  const ogImg = $("meta[property='og:image']").attr("content");
  if (ogImg) {
    try {
      images.unshift(new URL(ogImg, base).toString());
    } catch {
      /* ignore */
    }
  }

  let price: number | undefined;
  const ldJson = $("script[type='application/ld+json']")
    .map((_, el) => $(el).contents().text())
    .get();
  for (const script of ldJson) {
    try {
      const parsed = JSON.parse(script);
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of entries) {
        const offers = entry.offers
          ? Array.isArray(entry.offers)
            ? entry.offers
            : [entry.offers]
          : [];
        for (const offer of offers) {
          if (offer.price && !price) {
            price = Number(offer.price);
          }
        }
      }
    } catch {
      continue;
    }
  }

  if (!price) {
    const priceText = $("body").text();
    const match = priceText.match(/Prix\s+Fnac\s+([\d\s,]+)€?/i);
    if (match?.[1]) {
      price = parsePrice(match[1]);
    }
  }

  const uniqueImages = Array.from(new Set(images)).slice(0, 6);

  return {
    title: title || undefined,
    description: description || undefined,
    price: price ?? undefined,
    currency: price ? "EUR" : undefined,
    images: uniqueImages.length ? uniqueImages : undefined,
    mainImage: uniqueImages[0],
  };
}

export async function fnacProvider(url: URL): Promise<ProviderResponse> {
  await assertUrlIsSafe(url.toString());
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "user-agent": "ValwannaBot/1.1 (+https://example.com)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      return { result: {}, source: response.status === 403 ? "blocked" : "error", blocked: response.status === 403 };
    }
    const html = await response.text();
    const result = extractFromHtml(html, url);
    const source = Object.values(result).some(Boolean) ? "fnac" : "empty";
    return { result, source, blocked: false };
  } catch (error) {
    console.error("fnacProvider error", error);
    return { result: {}, source: "error" };
  }
}
