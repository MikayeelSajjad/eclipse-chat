import { getClient } from "./client";
import { rowToUser } from "./rows";
import { rowToPublicUser, type DbUser } from "./types";

export async function findUserByUsername(
  username: string
): Promise<DbUser | undefined> {
  const result = await getClient().execute({
    sql: "SELECT id, username, password, avatar_url FROM users WHERE username = ?",
    args: [username.trim().toLowerCase()],
  });
  if (result.rows.length === 0) return undefined;
  return rowToUser(result.rows[0]);
}

export async function findUserById(id: string): Promise<DbUser | undefined> {
  const result = await getClient().execute({
    sql: "SELECT id, username, password, avatar_url FROM users WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return undefined;
  return rowToUser(result.rows[0]);
}

export async function createUser(
  id: string,
  username: string,
  password: string,
  avatarUrl: string | null
) {
  const normalized = username.trim().toLowerCase();
  await getClient().execute({
    sql: "INSERT INTO users (id, username, password, avatar_url) VALUES (?, ?, ?, ?)",
    args: [id, normalized, password, avatarUrl],
  });
  return rowToPublicUser({
    id,
    username: normalized,
    password,
    avatar_url: avatarUrl,
  });
}

export async function searchUsers(query: string, excludeUserId: string) {
  const pattern = `%${query.trim().toLowerCase()}%`;
  const result = await getClient().execute({
    sql: `SELECT id, username, password, avatar_url FROM users
          WHERE id != ? AND username LIKE ?
          ORDER BY username ASC LIMIT 20`,
    args: [excludeUserId, pattern],
  });
  return result.rows.map((row) => rowToPublicUser(rowToUser(row)));
}
