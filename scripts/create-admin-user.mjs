import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, randomBytes } from "node:crypto";

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(root, "..", "data", "eclipse.db").replace(/\\/g, "/");
const client = createClient({ url: `file:${dbPath}` });

const username = "admin";
const password = randomBytes(18).toString("base64").replace(/[^a-zA-Z0-9]/g, "A0").slice(0, 24);

const existing = await client.execute({
  sql: "SELECT id FROM users WHERE username = ?",
  args: [username],
});

if (existing.rows.length === 0) {
  const id = randomUUID();
  await client.execute({
    sql: `INSERT INTO users (id, username, password, avatar_url, public_key, nitro_tier, role)
         VALUES (?, ?, ?, ?, ?, 'none', 'admin')`,
    args: [id, username, password, null, null],
  });
  console.log(JSON.stringify({ username, password, created: true, role: "admin" }, null, 2));
} else {
  const id = existing.rows[0].id;
  await client.execute({
    sql: "UPDATE users SET password = ?, role = 'admin' WHERE id = ?",
    args: [password, id],
  });
  console.log(JSON.stringify({ username, password, updated: true, role: "admin" }, null, 2));
}
