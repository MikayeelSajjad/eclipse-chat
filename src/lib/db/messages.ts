import { findUserById } from "./users";
import { getClient } from "./client";
import { rowToMessage } from "./rows";
import { rowToPublicUser, type DbMessage } from "./types";
import { getAcceptedFriendIds } from "./friends";

export async function insertMessage(
  id: string,
  senderId: string,
  receiverId: string,
  content: string
): Promise<DbMessage> {
  const created_at = Date.now();
  await getClient().execute({
    sql: `INSERT INTO messages (id, sender_id, receiver_id, content, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, senderId, receiverId, content, created_at],
  });
  return {
    id,
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    created_at,
  };
}

export async function getMessagesBetween(
  userId: string,
  peerId: string
): Promise<DbMessage[]> {
  const result = await getClient().execute({
    sql: `SELECT id, sender_id, receiver_id, content, created_at FROM messages
          WHERE (sender_id = ? AND receiver_id = ?)
             OR (sender_id = ? AND receiver_id = ?)
          ORDER BY created_at ASC`,
    args: [userId, peerId, peerId, userId],
  });
  return result.rows.map(rowToMessage);
}

export async function getConversationSummaries(userId: string) {
  const result = await getClient().execute({
    sql: `SELECT
            CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS peer_id,
            MAX(created_at) AS last_at
          FROM messages
          WHERE sender_id = ? OR receiver_id = ?
          GROUP BY peer_id
          ORDER BY last_at DESC`,
    args: [userId, userId, userId],
  });

  const rows = result.rows.map((row) => ({
    peer_id: String(row.peer_id ?? ""),
    last_at: Number(row.last_at ?? 0),
  }));

  const friendIds = new Set(await getAcceptedFriendIds(userId));
  const peerIds = new Set<string>();
  rows.forEach((r) => peerIds.add(r.peer_id));
  friendIds.forEach((id) => peerIds.add(id));

  const summaries = await Promise.all(
    Array.from(peerIds).map(async (peerId) => {
      const peer = await findUserById(peerId);
      if (!peer) return null;
      const messages = await getMessagesBetween(userId, peerId);
      const lastMessage = messages[messages.length - 1] ?? null;
      const lastMessageAt = lastMessage?.created_at ?? 0;
      return {
        peerId,
        peer: rowToPublicUser(peer),
        lastMessage,
        lastMessageAt,
      };
    })
  );

  return summaries
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}
