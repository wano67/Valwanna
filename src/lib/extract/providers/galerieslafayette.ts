import { load } from "cheerio";
import { assertUrlIsSafe } from "@/lib/ssrf";
import { ExtractResult, ProviderResponse } from "./types";

export function matchesGaleries(url: URL) {
  return url.hostname.includes("galerieslafayette");
}

function extractFromHtml(html: string, base: URL): ExtractResult {
  const $ = load(html);
  const title =
    $("meta[property='og:title']").attr("content") ||
    $("h1").first().text().trim() ||
    undefined;
  const description =
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='description']").attr("content") ||
    undefined;
  const ogImg = $("meta[property='og:image']").attr("content");
  const images: string[] = [];
  if (ogImg) {
    try {
      images.push(new URL(ogImg, base).toString());
    } catch {
      /* ignore */
    }
  }
  $(".slick-slide img, .product-gallery img").each((_, el) => {
    const src = $(el).attr("data-src") || $(el).attr("src");
    if (src) {
      try {
        images.push(new URL(src, base).toString());
      } catch {
        /* ignore */
      }
    }
  });
  const uniqueImages = Array.from(new Set(images)).slice(0, 6);
  return {
    title: title || undefined,
    description: description || undefined,
    images: uniqueImages.length ? uniqueImages : undefined,
    mainImage: uniqueImages[0],
  };
}

export async function galeriesProvider(url: URL): Promise<ProviderResponse> {
  await assertUrlIsSafe(url.toString());
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "user-agent": "ValwannaBot/1.1 (+https://example.com)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      return { result: {}, source: response.status === 403 ? "blocked" : "error", blocked: response.status === 403, needsHeadless: true };
    }
    const html = await response.text();
    const result = extractFromHtml(html, url);
    const source = Object.values(result).some(Boolean) ? "galerieslafayette" : "empty";
    return { result, source, needsHeadless: source === "empty" };
  } catch (error) {
    console.error("galeriesProvider error", error);
    return { result: {}, source: "error", needsHeadless: true };
  }
}
