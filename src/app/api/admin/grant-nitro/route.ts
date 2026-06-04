import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { buildSessionUser } from "@/lib/session-user";
import { findUserByUsername, updateUserNitro } from "@/lib/db";
import type { NitroTier } from "@/lib/nitro";

const ALLOWED_TIERS: NitroTier[] = ["none", "basic", "plus"];

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
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const tier =
    typeof body.tier === "string" && ALLOWED_TIERS.includes(body.tier)
      ? (body.tier as NitroTier)
      : "none";

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const targetUser = await findUserByUsername(username);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await updateUserNitro(targetUser.id, tier, null, null);
  return NextResponse.json({
    success: true,
    username: targetUser.username,
    tier,
  });
}
