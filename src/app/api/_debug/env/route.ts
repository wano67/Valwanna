import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasAdminUser: Boolean(process.env.ADMIN_USERNAME),
    hasAdminHash: Boolean(process.env.ADMIN_PASSWORD_HASH),
    hasAdminPasswordPlain: Boolean(process.env.ADMIN_PASSWORD),
    hasSessionPassword: Boolean(process.env.SESSION_PASSWORD),
    adminHashLooksBcrypt: Boolean(
      process.env.ADMIN_PASSWORD_HASH &&
        /^(?:\$2[aby]\$)/.test(process.env.ADMIN_PASSWORD_HASH),
    ),
    adminMode: process.env.ADMIN_PASSWORD_HASH
      ? "hash"
      : process.env.ADMIN_PASSWORD
        ? "plain"
        : "missing",
  });
}
