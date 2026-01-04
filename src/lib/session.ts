import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export type SessionData = {
  isAdmin?: boolean;
};

const baseSessionOptions: SessionOptions = {
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
  const session = await getIronSession<SessionData>(req, res, baseSessionOptions);
  return { session, res };
}
