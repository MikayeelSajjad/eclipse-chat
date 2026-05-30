import { getClient } from "./client";

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar_url TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_pair_rev ON messages(receiver_id, sender_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)`,
  `CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_friends_sender ON friends(sender_id)`,
  `CREATE INDEX IF NOT EXISTS idx_friends_receiver ON friends(receiver_id)`,
];

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = getClient();
      for (const sql of SCHEMA_STATEMENTS) {
        await client.execute(sql);
      }
    })();
  }
  return schemaReady;
}
