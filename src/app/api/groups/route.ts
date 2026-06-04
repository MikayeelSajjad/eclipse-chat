import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserById } from "@/lib/db";
import { getAcceptedFriendIds } from "@/lib/db/friends";
import { createGroup, getUserGroups } from "@/lib/db/groups";
import { canCreateGroups } from "@/lib/nitro";

export const runtime = "nodejs";

export async function GET() {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const groups = await getUserGroups(userId);
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await findUserById(userId);
  if (!user || !canCreateGroups(user.nitro_tier)) {
    return NextResponse.json(
      {
        error:
          "Nitro Basic or Nitro+ required to create groups. Upgrade at /nitro",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const memberIds: string[] = Array.isArray(body.member_ids)
    ? body.member_ids.filter((x: unknown): x is string => typeof x === "string")
    : [];
  const wrappedKeys: { user_id: string; wrapped_key: string }[] =
    Array.isArray(body.wrapped_keys)
      ? body.wrapped_keys.filter(
          (x: unknown): x is { user_id: string; wrapped_key: string } =>
            typeof x === "object" &&
            x !== null &&
            typeof (x as { user_id?: string }).user_id === "string" &&
            typeof (x as { wrapped_key?: string }).wrapped_key === "string"
        )
      : [];

  if (!name || name.length > 64) {
    return NextResponse.json({ error: "Invalid group name" }, { status: 400 });
  }

  const friends = new Set(await getAcceptedFriendIds(userId));
  for (const mid of memberIds) {
    if (mid === userId) continue;
    if (!friends.has(mid)) {
      return NextResponse.json(
        { error: "Can only add friends to groups" },
        { status: 400 }
      );
    }
    if (!(await findUserById(mid))) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
  }

  const id = randomUUID();
  await createGroup(id, name, userId, memberIds, wrappedKeys, userId);
  const groups = await getUserGroups(userId);
  const group = groups.find((g) => g.id === id);
  return NextResponse.json({ group }, { status: 201 });
}
