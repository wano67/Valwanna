import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { credentialsSchema } from "@/lib/validation";
import { getSessionWithResponse } from "@/lib/session";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  let sessionRes: Response;
  let session: Awaited<ReturnType<typeof getSessionWithResponse>>["session"];
  try {
    const result = await getSessionWithResponse(request);
    sessionRes = result.res;
    session = result.session;
  } catch (error) {
    console.error("Session error on POST /api/admin/login", error);
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

  const parsed = credentialsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Identifiants manquants ou invalides" },
      { status: 400 },
    );
  }

  if (parsed.data.username !== env.ADMIN_USERNAME) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const passwordOk = await bcrypt.compare(
    parsed.data.password,
    env.ADMIN_PASSWORD_HASH,
  );

  if (!passwordOk) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  session.isAdmin = true;
  await session.save();

  const response = NextResponse.json({ ok: true });
  sessionRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      response.headers.append(key, value);
    }
  });

  return response;
}
