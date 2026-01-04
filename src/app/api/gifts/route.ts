import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { giftPayloadSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ gifts });
  } catch (error) {
    console.error("GET /api/gifts", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les cadeaux" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let session;
  try {
    session = await getSession();
  } catch (error) {
    console.error("Session error on POST /api/gifts", error);
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
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
      },
    });
    return NextResponse.json({ gift }, { status: 201 });
  } catch (error) {
    console.error("POST /api/gifts", error);
    return NextResponse.json(
      { error: "Impossible de créer le cadeau" },
      { status: 500 },
    );
  }
}
