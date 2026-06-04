import type { Row } from "@libsql/client";
import type { DbFriend, DbMessage, DbUser, NitroTier } from "./types";

function str(row: Row, key: string): string {
  const v = row[key];
  return v == null ? "" : String(v);
}

function num(row: Row, key: string): number {
  const v = row[key];
  return typeof v === "number" ? v : Number(v);
}

function optStr(row: Row, key: string): string | null {
  const v = row[key];
  return v == null ? null : String(v);
}

export function rowToUser(row: Row): DbUser {
  const avatar = row.avatar_url;
  const tier = str(row, "nitro_tier") || "none";
  const role = str(row, "role") || "member";
  return {
    id: str(row, "id"),
    username: str(row, "username"),
    password: str(row, "password"),
    avatar_url: avatar == null ? null : String(avatar),
    public_key: optStr(row, "public_key"),
    nitro_tier: (tier === "basic" || tier === "plus" ? tier : "none") as NitroTier,
    role: (role === "admin" ? "admin" : "member"),
    ls_customer_id:
      optStr(row, "ls_customer_id") ?? optStr(row, "stripe_customer_id"),
    ls_subscription_id:
      optStr(row, "ls_subscription_id") ?? optStr(row, "stripe_subscription_id"),
  };
}

export function rowToMessage(row: Row): DbMessage {
  const gid = row.group_id;
  return {
    id: str(row, "id"),
    sender_id: str(row, "sender_id"),
    receiver_id: str(row, "receiver_id"),
    content: str(row, "content"),
    created_at: num(row, "created_at"),
    group_id: gid == null ? null : String(gid),
  };
}

export function rowToFriend(row: Row): DbFriend {
  return {
    id: str(row, "id"),
    sender_id: str(row, "sender_id"),
    receiver_id: str(row, "receiver_id"),
    status: str(row, "status") as DbFriend["status"],
  };
}
