import { NextResponse } from "next/server";
import { getSessionWithResponse } from "@/lib/session";

export async function POST() {
  try {
    const { session, res: sessionRes } = await getSessionWithResponse();
    await session.destroy();
    const response = NextResponse.json({ ok: true });
    sessionRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append(key, value);
      }
    });
    return response;
  } catch (error) {
    console.error("Session error on POST /api/admin/logout", error);
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }
}
