import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { searchUsers } from "@/lib/db/users";
import { findFriendship } from "@/lib/db/friends";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ users: [] });
  }

  const found = await searchUsers(q, userId);
  const users = await Promise.all(
    found.map(async (u) => {
      const friendship = await findFriendship(userId, u.id);
      return {
        ...u,
        friendshipStatus: friendship?.status ?? null,
        friendshipId: friendship?.id ?? null,
        isIncoming: friendship?.receiver_id === userId,
      };
    })
  );

  return NextResponse.json({ users });
}
