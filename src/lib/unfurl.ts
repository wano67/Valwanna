import { env } from "@/lib/env";

type UnfurlResult = {
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
  currency?: string;
  mainImage?: string;
};

function pickImages(data: any): string[] {
  const urls: string[] = [];
  const maybePush = (val?: string | null) => {
    if (val && typeof val === "string") urls.push(val);
  };

  maybePush(data?.image?.url);
  maybePush(data?.logo?.url);
  maybePush(data?.screenshot?.url);

  if (Array.isArray(data?.links)) {
    data.links.forEach((link: any) => maybePush(link?.url));
  }

  return Array.from(new Set(urls.filter(Boolean))).slice(0, 6);
}

export async function unfurlWithMicrolink(url: string): Promise<UnfurlResult> {
  const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false&palette=false&audio=false&video=false`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: env.MICROLINK_API_KEY
        ? { "x-api-key": env.MICROLINK_API_KEY }
        : undefined,
    });
    const json = (await response.json()) as any;
    if (!response.ok || !json?.data) return {};

    const images = pickImages(json.data);
    const mainImage = images[0];
    return {
      title: json.data.title ?? undefined,
      description: json.data.description ?? undefined,
      images: images.length ? images : undefined,
      mainImage,
      price: json.data.price ? Number(json.data.price) : undefined,
      currency: json.data.priceCurrency ?? undefined,
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}
