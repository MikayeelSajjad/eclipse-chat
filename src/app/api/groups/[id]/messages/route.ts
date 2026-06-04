import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { getGroupMessages, insertMessage } from "@/lib/db/messages";
import { isGroupMember } from "@/lib/db/groups";

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

  const messages = await getGroupMessages(groupId, userId);
  return NextResponse.json({ messages });
}

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

  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const message = await insertMessage(
    randomUUID(),
    userId,
    groupId,
    content,
    groupId
  );
  return NextResponse.json({ message }, { status: 201 });
}
