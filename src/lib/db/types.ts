export interface DbUser {
  id: string;
  username: string;
  password: string;
  avatar_url: string | null;
}

export interface DbMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: number;
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
  };
}
