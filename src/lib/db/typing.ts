import { getClient } from "./client";

const TYPING_TTL_MS = 4000;

export async function setTypingStatus(userId: string, peerId: string) {
  const updated_at = Date.now();
  await getClient().execute({
    sql: `INSERT INTO typing_status (user_id, peer_id, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, peer_id) DO UPDATE SET updated_at = excluded.updated_at`,
    args: [userId, peerId, updated_at],
  });
}

export async function getTypingFromPeer(
  userId: string,
  peerId: string
): Promise<boolean> {
  const cutoff = Date.now() - TYPING_TTL_MS;
  const result = await getClient().execute({
    sql: `SELECT user_id FROM typing_status
          WHERE peer_id = ? AND user_id = ? AND updated_at > ?`,
    args: [userId, peerId, cutoff],
  });
  return result.rows.length > 0;
}

export async function clearTypingStatus(userId: string, peerId: string) {
  await getClient().execute({
    sql: "DELETE FROM typing_status WHERE user_id = ? AND peer_id = ?",
    args: [userId, peerId],
  });
}
