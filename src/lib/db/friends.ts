import { findUserById } from "./users";
import { getClient } from "./client";
import { rowToFriend } from "./rows";
import { rowToPublicUser, type DbFriend } from "./types";

export async function getFriendRowsForUser(
  userId: string
): Promise<DbFriend[]> {
  const result = await getClient().execute({
    sql: `SELECT id, sender_id, receiver_id, status FROM friends
          WHERE sender_id = ? OR receiver_id = ?`,
    args: [userId, userId],
  });
  return result.rows.map(rowToFriend);
}

export async function findFriendship(
  userA: string,
  userB: string
): Promise<DbFriend | undefined> {
  const result = await getClient().execute({
    sql: `SELECT id, sender_id, receiver_id, status FROM friends
          WHERE (sender_id = ? AND receiver_id = ?)
             OR (sender_id = ? AND receiver_id = ?)
          LIMIT 1`,
    args: [userA, userB, userB, userA],
  });
  if (result.rows.length === 0) return undefined;
  return rowToFriend(result.rows[0]);
}

export async function createFriendRequest(
  id: string,
  senderId: string,
  receiverId: string
) {
  await getClient().execute({
    sql: `INSERT INTO friends (id, sender_id, receiver_id, status)
          VALUES (?, ?, ?, 'pending')`,
    args: [id, senderId, receiverId],
  });
}

export async function updateFriendStatus(id: string, status: "accepted") {
  await getClient().execute({
    sql: "UPDATE friends SET status = ? WHERE id = ?",
    args: [status, id],
  });
}

export async function deleteFriendRow(id: string) {
  await getClient().execute({
    sql: "DELETE FROM friends WHERE id = ?",
    args: [id],
  });
}

export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const rows = (await getFriendRowsForUser(userId)).filter(
    (r) => r.status === "accepted"
  );
  return rows.map((r) =>
    r.sender_id === userId ? r.receiver_id : r.sender_id
  );
}

export async function buildFriendsPayload(userId: string) {
  const rows = await getFriendRowsForUser(userId);
  const accepted: ReturnType<typeof rowToPublicUser>[] = [];
  const incoming: { id: string; user: ReturnType<typeof rowToPublicUser> }[] =
    [];
  const outgoing: { id: string; user: ReturnType<typeof rowToPublicUser> }[] =
    [];

  for (const row of rows) {
    const otherId = row.sender_id === userId ? row.receiver_id : row.sender_id;
    const other = await findUserById(otherId);
    if (!other) continue;
    const pub = rowToPublicUser(other);

    if (row.status === "accepted") {
      if (!accepted.some((u) => u.id === pub.id)) accepted.push(pub);
    } else if (row.status === "pending") {
      if (row.receiver_id === userId) {
        incoming.push({ id: row.id, user: pub });
      } else {
        outgoing.push({ id: row.id, user: pub });
      }
    }
  }

  accepted.sort((a, b) => a.username.localeCompare(b.username));
  return { accepted, incoming, outgoing };
}
