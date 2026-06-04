import { countAcceptedFriends } from "./db/friends";
import { findUserById } from "./db";
import { rowToSessionUser } from "./db/types";
import type { SessionUser } from "./types";

export async function buildSessionUser(
  userId: string
): Promise<SessionUser | null> {
  const user = await findUserById(userId);
  if (!user) return null;
  const friendCount = await countAcceptedFriends(userId);
  return rowToSessionUser(user, friendCount);
}
