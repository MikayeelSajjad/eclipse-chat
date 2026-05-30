import type { Row } from "@libsql/client";
import type { DbFriend, DbMessage, DbUser } from "./types";

function str(row: Row, key: string): string {
  const v = row[key];
  return v == null ? "" : String(v);
}

function num(row: Row, key: string): number {
  const v = row[key];
  return typeof v === "number" ? v : Number(v);
}

export function rowToUser(row: Row): DbUser {
  const avatar = row.avatar_url;
  return {
    id: str(row, "id"),
    username: str(row, "username"),
    password: str(row, "password"),
    avatar_url: avatar == null ? null : String(avatar),
  };
}

export function rowToMessage(row: Row): DbMessage {
  return {
    id: str(row, "id"),
    sender_id: str(row, "sender_id"),
    receiver_id: str(row, "receiver_id"),
    content: str(row, "content"),
    created_at: num(row, "created_at"),
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
