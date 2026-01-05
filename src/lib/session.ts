import { getIronSession, type IronSessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export type SessionData = {
  isAdmin?: boolean;
};

// Helper used only by API routes that need to mutate the session.
const baseSessionOptions: IronSessionOptions = {
  cookieName: "gift_admin_session",
  password: env.SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
    path: "/",
  },
};

function buildRequestFromCookies(): Request {
  const cookieHeader = cookies().toString();
  return new Request("http://localhost", {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

export async function getSessionWithResponse(request?: Request) {
  const req = request ?? buildRequestFromCookies();
  const res = new Response();
  const session = await getIronSession(req, res, baseSessionOptions);
  return { session, res };
}

// Server components should consume a plain data shape to avoid IronSession typing issues.
export async function getSessionData(): Promise<SessionData> {
  const req = buildRequestFromCookies();
  const res = new Response();
  const session = await getIronSession(req, res, baseSessionOptions);
  // return only serializable data
  return { isAdmin: Boolean(session.isAdmin) };
}

export async function requireAdminSession(request?: Request) {
  const { session, res } = await getSessionWithResponse(request);
  if (!session.isAdmin) {
    const response = new Response(
      JSON.stringify({ error: "Accès refusé" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append(key, value);
      }
    });
    throw response;
  }
  return { session, res };
}
