import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserById } from "@/lib/db";
import { setTypingStatus } from "@/lib/db/typing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const peerId = typeof body.peer_id === "string" ? body.peer_id : "";

  if (!peerId || !(await findUserById(peerId))) {
    return NextResponse.json({ error: "Invalid peer" }, { status: 400 });
  }

  await setTypingStatus(userId, peerId);
  return NextResponse.json({ ok: true });
}
