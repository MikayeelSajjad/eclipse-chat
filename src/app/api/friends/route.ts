import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import {
  buildFriendsPayload,
  createFriendRequest,
  findFriendship,
} from "@/lib/db/friends";
import { findUserById } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json(await buildFriendsPayload(userId));
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

  if (!receiverId || receiverId === userId) {
    return NextResponse.json({ error: "Invalid receiver" }, { status: 400 });
  }

  if (!(await findUserById(receiverId))) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await findFriendship(userId, receiverId);
  if (existing) {
    return NextResponse.json(
      { error: "Friend request already exists" },
      { status: 409 }
    );
  }

  const id = randomUUID();
  await createFriendRequest(id, userId, receiverId);
  return NextResponse.json({ id, status: "pending" }, { status: 201 });
}
