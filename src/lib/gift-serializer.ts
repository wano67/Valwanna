import type { Gift } from "@prisma/client";
import type { GiftDTO } from "@/types/gift";

function parseImages(images?: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    return [];
  }
  return [];
}

export function toGiftDTO(gift: Gift): GiftDTO {
  return {
    id: gift.id,
    title: gift.title,
    url: gift.url,
    description: gift.description ?? null,
    price: gift.price ?? null,
    currency: gift.currency ?? null,
    images: parseImages(gift.images),
    mainImage: gift.mainImage ?? null,
    createdAt: gift.createdAt.toISOString(),
    updatedAt: gift.updatedAt.toISOString(),
  };
}
