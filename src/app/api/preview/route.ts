import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/session";
import { extractListingData } from "@/lib/extract";

const previewSchema = z.object({
  url: z.string().url("URL invalide"),
});

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
  } catch (response) {
    if (response instanceof Response) return response;
    console.error("Session error on POST /api/preview", response);
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

  const parsed = previewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const { result, source, blocked, warnings } = await extractListingData(parsed.data.url);
    return NextResponse.json({
      result,
      data: result,
      source,
      blocked,
      warning: warnings?.[0],
      warnings,
    });
  } catch (error) {
    console.error("POST /api/preview", error);
    return NextResponse.json({
      result: {},
      data: {},
      source: "empty",
      blocked: false,
      warning: "Impossible de récupérer les informations. Remplissez les champs manuellement.",
    });
  }
}
