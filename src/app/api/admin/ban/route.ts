import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { buildSessionUser } from "@/lib/session-user";
import { findUserByUsername, updateUserBanned } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const currentUser = await buildSessionUser(userId);
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({} as any));
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const action = body.action === "unban" ? "unban" : body.action === "ban" ? "ban" : null;

  if (!username || !action) {
    return NextResponse.json({ error: "Username and action are required" }, { status: 400 });
  }

  const targetUser = await findUserByUsername(username);
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ban = action === "ban";
  await updateUserBanned(targetUser.id, ban);

  return NextResponse.json({ success: true, username: targetUser.username, banned: ban });
}
