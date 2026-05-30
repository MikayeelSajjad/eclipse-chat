import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserById } from "@/lib/db";
import { getMessagesBetween, insertMessage } from "@/lib/db/messages";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const peerId = searchParams.get("peerId") ?? "";
  if (!peerId) {
    return NextResponse.json({ error: "peerId is required" }, { status: 400 });
  }

  if (!(await findUserById(peerId))) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const messages = await getMessagesBetween(userId, peerId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const receiverId =
    typeof body.receiver_id === "string" ? body.receiver_id : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!receiverId || !content) {
    return NextResponse.json(
      { error: "receiver_id and content are required" },
      { status: 400 }
    );
  }

  if (!(await findUserById(receiverId))) {
    return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
  }

  const message = await insertMessage(
    randomUUID(),
    userId,
    receiverId,
    content
  );
  return NextResponse.json({ message }, { status: 201 });
}
