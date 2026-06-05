import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserByUsername } from "@/lib/db";
import { buildSessionUser } from "@/lib/session-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const body = await request.json().catch(() => ({}));
  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = await findUserByUsername(username);
  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  if (user.banned) {
    return NextResponse.json({ error: "Account banned" }, { status: 403 });
  }

  const sessionUser = await buildSessionUser(user.id);
  const response = NextResponse.json({ user: sessionUser });
  setSessionCookie(response, user.id);
  return response;
}
