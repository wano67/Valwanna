import { assertUrlIsSafe } from "@/lib/ssrf";
import { env } from "@/lib/env";
import { fnacProvider, matchesFnac } from "./providers/fnac";
import { galeriesProvider, matchesGaleries } from "./providers/galerieslafayette";
import { genericExtract } from "./providers/generic";
import type { ExtractResult } from "./providers/types";
import { extractWithHeadless } from "./headless";
import { unfurlWithMicrolink } from "@/lib/unfurl";
import { matchesScraperApi, scraperApiProvider } from "./providers/scraperapi";
import { matchesSerper, serperProvider } from "./providers/serper";

type ExtractResponse = {
  result: ExtractResult;
  source: string;
  blocked: boolean;
  warnings?: string[];
};

function hasData(result: ExtractResult) {
  return Object.values(result).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v)));
}

function mergeResult(base: ExtractResult, incoming: ExtractResult): ExtractResult {
  const images =
    base.images && base.images.length
      ? base.images
      : incoming.images && incoming.images.length
        ? incoming.images
        : undefined;

  return {
    ...base,
    title: base.title ?? incoming.title,
    description: base.description ?? incoming.description,
    price: base.price ?? incoming.price,
    currency: base.currency ?? incoming.currency,
    images,
    mainImage: base.mainImage ?? incoming.mainImage ?? images?.[0] ?? incoming.images?.[0],
  };
}

export async function extractListingData(rawUrl: string): Promise<ExtractResponse> {
  await assertUrlIsSafe(rawUrl);
  const url = new URL(rawUrl);

  const sources = new Set<string>();
  const warnings: string[] = [];
  let result: ExtractResult = {};
  let blocked = false;
  let flaggedHeadless = false;

  const providers = [];
  if (matchesFnac(url)) providers.push(fnacProvider);
  if (matchesGaleries(url)) providers.push(galeriesProvider);
  providers.push(genericExtract);
  if (matchesScraperApi()) providers.push(scraperApiProvider);
  if (matchesSerper()) providers.push(serperProvider);

  for (const provider of providers) {
    const response = await provider(url);
    if (response.blocked) blocked = true;
    if (response.needsHeadless) flaggedHeadless = true;

    if (response.source !== "empty" && response.source !== "error") {
      sources.add(response.source);
    }

    result = mergeResult(result, response.result);

    if (hasData(result) && !response.needsHeadless && !response.blocked) {
      break;
    }

    if (response.blocked) {
      break;
    }
  }

  const hasHtmlData = hasData(result);

  // Microlink fallback si site bloqué ou données insuffisantes
  let microlinkUsed = false;
  if (!hasHtmlData || blocked) {
    const micro = await unfurlWithMicrolink(rawUrl);
    if (hasData(micro)) {
      result = mergeResult(result, {
        title: micro.title,
        description: micro.description,
        price: micro.price,
        currency: micro.currency,
        images: micro.images,
        mainImage: micro.mainImage ?? micro.images?.[0],
      });
      sources.add(hasHtmlData ? "mixed" : "microlink");
      microlinkUsed = true;
    }
  }

  const shouldTryHeadless =
    process.env.ENABLE_PLAYWRIGHT_PREVIEW === "true" &&
    (!microlinkUsed && (!hasData(result) || blocked || flaggedHeadless));

  if (shouldTryHeadless) {
    const headlessResult = await extractWithHeadless(rawUrl);
    if (hasData(headlessResult)) {
      result = mergeResult(result, headlessResult);
      sources.add(sources.size ? "mixed" : "headless");
    } else {
      warnings.push("Le fallback navigateur n'a pas permis d'extraire cette page (page fermée ou bloquée).");
    }
  } else if ((blocked || flaggedHeadless) && !microlinkUsed && !hasData(result)) {
    warnings.push("Site bloque l'extraction sans navigateur (activez ENABLE_PLAYWRIGHT_PREVIEW).");
  }

  const finalSourceArr = Array.from(sources).filter(Boolean);
  const source =
    finalSourceArr.length === 0
      ? "empty"
      : finalSourceArr.length === 1
        ? finalSourceArr[0]
        : "mixed";

  if (!hasData(result) && warnings.length === 0) {
    warnings.push("Extraction impossible sur ce site, remplissez les champs manuellement.");
  }

  return {
    result,
    source,
    blocked,
    warnings: warnings.length ? warnings : undefined,
  };
}
