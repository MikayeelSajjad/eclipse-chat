import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserByUsername, rowToPublicUser } from "@/lib/db";

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

  const response = NextResponse.json({ user: rowToPublicUser(user) });
  setSessionCookie(response, user.id);
  return response;
}
