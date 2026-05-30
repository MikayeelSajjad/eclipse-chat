import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserById, rowToPublicUser } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await findUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({ user: rowToPublicUser(user) });
}
