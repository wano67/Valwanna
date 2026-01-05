import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { toGiftDTO } from "@/lib/gift-serializer";
import { giftPayloadSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ gifts: gifts.map((g) => toGiftDTO(g)) });
  } catch (error) {
    console.error("GET /api/gifts", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les cadeaux" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
  } catch (response) {
    if (response instanceof Response) return response;
    console.error("Session error on POST /api/gifts", response);
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const parsed = giftPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides, vérifiez le titre et l'URL." },
      { status: 400 },
    );
  }

  try {
    const gift = await prisma.gift.create({
      data: {
        title: parsed.data.title,
        url: parsed.data.url ?? null,
        description: parsed.data.description ?? null,
        price: parsed.data.price ?? null,
        currency: parsed.data.currency ?? null,
        images: parsed.data.images ? JSON.stringify(parsed.data.images) : null,
        mainImage:
          parsed.data.images && parsed.data.images.length
            ? parsed.data.images[0]
            : null,
      },
    });
    return NextResponse.json({ gift: toGiftDTO(gift) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/gifts", error);
    return NextResponse.json(
      { error: "Impossible de créer le cadeau" },
      { status: 500 },
    );
  }
}
