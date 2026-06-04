import { getClient } from "./client";

const BASE_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member'
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
  `CREATE TABLE IF NOT EXISTS typing_status (
    user_id TEXT NOT NULL,
    peer_id TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, peer_id)
  )`,
  `CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS group_keys (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    wrapped_key TEXT NOT NULL,
    wrapped_by TEXT,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
];

const MIGRATION_STATEMENTS = [
  "ALTER TABLE users ADD COLUMN public_key TEXT",
  "ALTER TABLE users ADD COLUMN nitro_tier TEXT DEFAULT 'none'",
  "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'",
  "ALTER TABLE users ADD COLUMN ls_customer_id TEXT",
  "ALTER TABLE users ADD COLUMN ls_subscription_id TEXT",
  "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT",
  "ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT",
  "ALTER TABLE messages ADD COLUMN group_id TEXT",
  "ALTER TABLE group_keys ADD COLUMN wrapped_by TEXT",
];

const POST_MIGRATION_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id, created_at)`,
];

let schemaReady: Promise<void> | null = null;

async function columnExists(
  table: string,
  column: string
): Promise<boolean> {
  const result = await getClient().execute({
    sql: `PRAGMA table_info(${table})`,
    args: [],
  });
  return result.rows.some((row) => String(row.name) === column);
}

async function runMigrations(): Promise<void> {
  const client = getClient();
  for (const sql of MIGRATION_STATEMENTS) {
    try {
      await client.execute(sql);
    } catch {
      /* column may already exist */
    }
  }

  if (!(await columnExists("users", "nitro_tier"))) {
    try {
      await client.execute(
        "ALTER TABLE users ADD COLUMN nitro_tier TEXT DEFAULT 'none'"
      );
    } catch {
      /* ignore */
    }
  }

  for (const sql of POST_MIGRATION_INDEXES) {
    try {
      await client.execute(sql);
    } catch {
      /* index may already exist or column still missing */
    }
  }
}

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = getClient();
      for (const sql of BASE_TABLES) {
        await client.execute(sql);
      }
      await runMigrations();
    })();
  }
  return schemaReady;
}

/** Reset cached schema promise (tests only). */
export function resetSchemaCache(): void {
  schemaReady = null;
}
