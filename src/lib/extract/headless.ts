import { chromium } from "playwright";
import { ExtractResult } from "./providers/types";

export async function extractWithHeadless(url: string): Promise<ExtractResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: "ValwannaBot/1.1 (+https://example.com)",
  });
  const page = await context.newPage();
  try {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    } catch (error: any) {
      console.warn("extractWithHeadless goto failed:", error?.message ?? "unknown error");
      return {};
    }
    if (page.isClosed()) return {};
    await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
    if (page.isClosed()) return {};
    await page.waitForTimeout(800).catch(() => {});
    if (page.isClosed()) return {};

    const data = await page.evaluate(() => {
      const meta = (name: string) =>
        document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.getAttribute("content") ||
        undefined;
      const ldScripts = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]'),
      ).map((el) => el.textContent || "");

      return {
        title:
          meta("og:title") ||
          document.querySelector("h1")?.textContent?.trim() ||
          document.title,
        description: meta("og:description") || meta("description") || undefined,
        ogImage: meta("og:image") || undefined,
        ldScripts,
        images: Array.from(document.images || [])
          .map((img) => img.src)
          .filter(Boolean),
      };
    });

    const images = Array.from(
      new Set(
        [data.ogImage, ...(data.images ?? [])].filter(
          (val): val is string => typeof val === "string" && val.length > 0,
        ),
      ),
    ).slice(0, 6);

    let price: number | undefined;
    let currency: string | undefined;
    for (const script of data.ldScripts ?? []) {
      try {
        const json = JSON.parse(script);
        const entries = Array.isArray(json) ? json : [json];
        for (const entry of entries) {
          const offers = entry.offers
            ? Array.isArray(entry.offers)
              ? entry.offers
              : [entry.offers]
            : [];
          for (const offer of offers) {
            if (!price && offer.price) price = Number(offer.price);
            if (!currency && offer.priceCurrency) currency = offer.priceCurrency;
          }
        }
      } catch {
        continue;
      }
    }

    return {
      title: data.title ?? undefined,
      description: data.description ?? undefined,
      images: images.length ? images : undefined,
      mainImage: images[0],
      price,
      currency,
    };
  } catch (error) {
    console.error("extractWithHeadless error", (error as any)?.message ?? error);
    return {};
  } finally {
    await browser.close().catch(() => {});
  }
}
