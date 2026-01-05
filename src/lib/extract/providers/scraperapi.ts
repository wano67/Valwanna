import { parseGenericHtml } from "./generic";
import { ExtractResult, ProviderResponse } from "./types";
import { env } from "@/lib/env";
import { assertUrlIsSafe } from "@/lib/ssrf";

export function matchesScraperApi(): boolean {
  return Boolean(env.SCRAPER_API_KEY);
}

export async function scraperApiProvider(url: URL): Promise<ProviderResponse> {
  if (!env.SCRAPER_API_KEY) {
    return { result: {}, source: "empty" };
  }

  await assertUrlIsSafe(url.toString());

  const proxyUrl = new URL("https://api.scraperapi.com/");
  proxyUrl.searchParams.set("api_key", env.SCRAPER_API_KEY);
  proxyUrl.searchParams.set("url", url.toString());
  proxyUrl.searchParams.set("render", "false");

  try {
    const response = await fetch(proxyUrl.toString(), {
      headers: {
        "user-agent": "ValwannaBot/1.1 (+https://example.com)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      return {
        result: {},
        source: response.status === 403 ? "scraperapi-blocked" : "scraperapi-error",
        blocked: response.status === 403,
      };
    }
    const html = await response.text();
    const parsed: ExtractResult = parseGenericHtml(html, url);
    const source = Object.values(parsed).some(Boolean) ? "scraperapi" : "empty";
    return { result: parsed, source };
  } catch (error) {
    console.error("scraperApiProvider error", error);
    return { result: {}, source: "scraperapi-error" };
  }
}
