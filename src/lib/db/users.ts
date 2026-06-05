import { getClient } from "./client";
import { rowToUser } from "./rows";
import { rowToPublicUser, type DbUser, type NitroTier } from "./types";

const USER_SELECT = `SELECT id, username, password, avatar_url,
  public_key, nitro_tier, role,
  COALESCE(ls_customer_id, stripe_customer_id) AS ls_customer_id,
  COALESCE(ls_subscription_id, stripe_subscription_id) AS ls_subscription_id
  FROM users`;

export async function findUserByUsername(
  username: string
): Promise<DbUser | undefined> {
  const result = await getClient().execute({
    sql: `${USER_SELECT} WHERE username = ?`,
    args: [username.trim().toLowerCase()],
  });
  if (result.rows.length === 0) return undefined;
  return rowToUser(result.rows[0]);
}

export async function findUserById(id: string): Promise<DbUser | undefined> {
  const result = await getClient().execute({
    sql: `${USER_SELECT} WHERE id = ?`,
    args: [id],
  });
  if (result.rows.length === 0) return undefined;
  return rowToUser(result.rows[0]);
}

export async function createUser(
  id: string,
  username: string,
  password: string,
  avatarUrl: string | null,
  publicKey: string | null = null
) {
  const normalized = username.trim().toLowerCase();
  await getClient().execute({
    sql: `INSERT INTO users (id, username, password, avatar_url, public_key, nitro_tier, role)
          VALUES (?, ?, ?, ?, ?, 'none', 'member')`,
    args: [id, normalized, password, avatarUrl, publicKey],
  });
  return rowToPublicUser({
    id,
    username: normalized,
    avatar_url: avatarUrl,
    public_key: publicKey,
    nitro_tier: "none",
  });
}

export async function updateUserPublicKey(
  userId: string,
  publicKey: string
): Promise<void> {
  await getClient().execute({
    sql: "UPDATE users SET public_key = ? WHERE id = ?",
    args: [publicKey, userId],
  });
}

export async function updateUserNitro(
  userId: string,
  tier: NitroTier,
  lsCustomerId: string | null,
  lsSubscriptionId: string | null
): Promise<void> {
  await getClient().execute({
    sql: `UPDATE users SET nitro_tier = ?, ls_customer_id = ?, ls_subscription_id = ?
          WHERE id = ?`,
    args: [tier, lsCustomerId, lsSubscriptionId, userId],
  });
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "member"
): Promise<void> {
  await getClient().execute({
    sql: "UPDATE users SET role = ? WHERE id = ?",
    args: [role, userId],
  });
}

export async function findUserByLsSubscriptionId(
  subscriptionId: string
): Promise<DbUser | undefined> {
  const result = await getClient().execute({
    sql: `${USER_SELECT} WHERE ls_subscription_id = ?`,
    args: [subscriptionId],
  });
  if (result.rows.length === 0) return undefined;
  return rowToUser(result.rows[0]);
}

export async function searchUsers(query: string, excludeUserId: string) {
  const pattern = `%${query.trim().toLowerCase()}%`;
  const result = await getClient().execute({
    sql: `${USER_SELECT}
          WHERE id != ? AND username LIKE ?
          ORDER BY username ASC LIMIT 20`,
    args: [excludeUserId, pattern],
  });
  return result.rows.map((row) => rowToPublicUser(rowToUser(row)));
}

export async function getPublicKey(userId: string): Promise<string | null> {
  const user = await findUserById(userId);
  return user?.public_key ?? null;
}
