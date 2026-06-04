import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { createUser, findUserByUsername } from "@/lib/db";
import { buildSessionUser } from "@/lib/session-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const body = await request.json().catch(() => ({}));
  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const avatar_url =
    typeof body.avatar_url === "string" && body.avatar_url.trim()
      ? body.avatar_url.trim()
      : null;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username may only contain lowercase letters, numbers, and underscores",
      },
      { status: 400 }
    );
  }

  if (await findUserByUsername(username)) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const public_key =
    typeof body.public_key === "string" ? body.public_key.trim() : null;

  const id = randomUUID();
  await createUser(id, username, password, avatar_url, public_key);
  const user = await buildSessionUser(id);
  const response = NextResponse.json({ user });
  setSessionCookie(response, id);
  return response;
}
