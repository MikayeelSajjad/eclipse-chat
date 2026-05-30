import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import {
  deleteFriendRow,
  getFriendRowsForUser,
  updateFriendStatus,
} from "@/lib/db/friends";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as string;

  const rows = await getFriendRowsForUser(userId);
  const row = rows.find((r) => r.id === id);
  if (!row) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (row.receiver_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "accept") {
    await updateFriendStatus(id, "accepted");
    return NextResponse.json({ id, status: "accepted" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const rows = await getFriendRowsForUser(userId);
  const row = rows.find((r) => r.id === id);
  if (!row) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (row.receiver_id !== userId && row.sender_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteFriendRow(id);
  return NextResponse.json({ ok: true });
}
