import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dbPath = path.join(root, "data", "eclipse.db").replace(/\\/g, "/");
const client = createClient({ url: `file:${dbPath}` });

const migrations = [
  "ALTER TABLE messages ADD COLUMN group_id TEXT",
  "ALTER TABLE users ADD COLUMN public_key TEXT",
  "ALTER TABLE users ADD COLUMN nitro_tier TEXT DEFAULT 'none'",
  "ALTER TABLE users ADD COLUMN ls_customer_id TEXT",
  "ALTER TABLE users ADD COLUMN ls_subscription_id TEXT",
  "ALTER TABLE group_keys ADD COLUMN wrapped_by TEXT",
];

for (const sql of migrations) {
  try {
    await client.execute(sql);
    console.log("OK:", sql);
  } catch (e) {
    console.log("skip:", e.message);
  }
}

try {
  await client.execute(
    "CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id, created_at)"
  );
  console.log("OK: index");
} catch (e) {
  console.log("index skip:", e.message);
}

const info = await client.execute("PRAGMA table_info(messages)");
console.log(
  "messages columns:",
  info.rows.map((r) => r.name).join(", ")
);
