import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { giftIdSchema, giftPayloadSchema } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  let session;
  try {
    session = await getSession();
  } catch (error) {
    console.error("Session error on PUT /api/gifts/[id]", error);
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
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
      },
    });
    return NextResponse.json({ gift });
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
  let session;
  try {
    session = await getSession();
  } catch (error) {
    console.error("Session error on DELETE /api/gifts/[id]", error);
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
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
