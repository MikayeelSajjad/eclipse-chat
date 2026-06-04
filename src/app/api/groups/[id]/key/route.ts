import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { getGroupById, getGroupWrappedKey, isGroupMember } from "@/lib/db/groups";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
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

  const keyRow = await getGroupWrappedKey(groupId, userId);
  if (!keyRow) {
    return NextResponse.json({ error: "No key for user" }, { status: 404 });
  }

  return NextResponse.json({
    wrapped_key: keyRow.wrapped_key,
    wrapper_id: keyRow.wrapped_by || group.creator_id,
  });
}
