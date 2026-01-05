import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { toGiftDTO } from "@/lib/gift-serializer";
import { giftIdSchema, giftPayloadSchema } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminSession(request);
  } catch (response) {
    if (response instanceof Response) return response;
    console.error("Session error on PUT /api/gifts/[id]", response);
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }

  const idParsed = giftIdSchema.safeParse(params.id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
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
    const gift = await prisma.gift.update({
      where: { id: idParsed.data },
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
    return NextResponse.json({ gift: toGiftDTO(gift) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Cadeau introuvable" }, { status: 404 });
    }

    console.error(`PUT /api/gifts/${params.id}`, error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le cadeau" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminSession();
  } catch (response) {
    if (response instanceof Response) return response;
    console.error("Session error on DELETE /api/gifts/[id]", response);
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }

  const idParsed = giftIdSchema.safeParse(params.id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  try {
    await prisma.gift.delete({
      where: { id: idParsed.data },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Cadeau introuvable" }, { status: 404 });
    }

    console.error(`DELETE /api/gifts/${params.id}`, error);
    return NextResponse.json(
      { error: "Impossible de supprimer le cadeau" },
      { status: 500 },
    );
  }
}
