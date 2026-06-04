import type { NitroTier } from "../nitro";
import { canCreateGroups, getFriendLimit } from "../nitro";

export type { NitroTier };

export interface DbUser {
  id: string;
  username: string;
  password: string;
  avatar_url: string | null;
  public_key: string | null;
  nitro_tier: NitroTier;
  ls_customer_id: string | null;
  ls_subscription_id: string | null;
}

export interface DbMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: number;
  group_id: string | null;
}

export interface DbFriend {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted";
}

export function rowToPublicUser(row: DbUser) {
  return {
    id: row.id,
    username: row.username,
    avatar_url: row.avatar_url,
    public_key: row.public_key,
    nitro_tier: row.nitro_tier,
  };
}

export function rowToSessionUser(row: DbUser, friendCount: number) {
  const tier = row.nitro_tier;
  return {
    id: row.id,
    username: row.username,
    avatar_url: row.avatar_url,
    public_key: row.public_key,
    nitro_tier: tier,
    friend_count: friendCount,
    friend_limit: getFriendLimit(tier),
    can_create_groups: canCreateGroups(tier),
  };
}
