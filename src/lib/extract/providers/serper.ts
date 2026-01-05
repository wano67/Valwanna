import { env } from "@/lib/env";
import { ExtractResult, ProviderResponse } from "./types";
import { assertUrlIsSafe } from "@/lib/ssrf";

export function matchesSerper(): boolean {
  return Boolean(env.SERPER_API_KEY);
}

export async function serperProvider(url: URL): Promise<ProviderResponse> {
  const apiKey = env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY manquante");
  }

  await assertUrlIsSafe(url.toString());

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: url.toString() }),
    });

    if (!response.ok) {
      return { result: {}, source: "serper-error" };
    }

    const json = (await response.json()) as any;
    const organic = Array.isArray(json?.organic) ? json.organic : [];
    const best = organic[0];
    const images: string[] = [];
    if (best?.imageUrl) images.push(best.imageUrl);
    if (Array.isArray(best?.images)) {
      images.push(...best.images.filter((i: unknown) => typeof i === "string"));
    }

    const result: ExtractResult = {
      title: best?.title ?? undefined,
      description: best?.snippet ?? undefined,
      images: images.length ? Array.from(new Set(images)).slice(0, 6) : undefined,
      mainImage: images[0],
    };

    const hasData = Object.values(result).some((v) =>
      Array.isArray(v) ? v.length > 0 : Boolean(v),
    );

    return { result, source: hasData ? "serper" : "empty" };
  } catch (error) {
    console.error("serperProvider error", error);
    return { result: {}, source: "serper-error" };
  }
}
