import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserById } from "@/lib/db";
import { getAcceptedFriendIds } from "@/lib/db/friends";
import {
  addGroupMember,
  getGroupById,
  isGroupMember,
} from "@/lib/db/groups";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: groupId } = await params;
  if (!(await isGroupMember(groupId, userId))) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const group = await getGroupById(groupId);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const inviteeId =
    typeof body.user_id === "string" ? body.user_id.trim() : "";
  const wrappedKey =
    typeof body.wrapped_key === "string" ? body.wrapped_key.trim() : "";

  if (!inviteeId || !wrappedKey) {
    return NextResponse.json(
      { error: "user_id and wrapped_key required" },
      { status: 400 }
    );
  }

  if (await isGroupMember(groupId, inviteeId)) {
    return NextResponse.json({ error: "Already in group" }, { status: 409 });
  }

  const friends = new Set(await getAcceptedFriendIds(userId));
  if (!friends.has(inviteeId)) {
    return NextResponse.json(
      { error: "Can only invite friends" },
      { status: 400 }
    );
  }

  if (!(await findUserById(inviteeId))) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await addGroupMember(groupId, inviteeId, wrappedKey, userId);
  return NextResponse.json({ ok: true }, { status: 201 });
}
