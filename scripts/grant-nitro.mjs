import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const username = process.argv[2] ?? "test_alice";
const tier = process.argv[3] ?? "basic";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dbPath = path.join(root, "data", "eclipse.db").replace(/\\/g, "/");
const client = createClient({ url: `file:${dbPath}` });

const result = await client.execute({
  sql: "UPDATE users SET nitro_tier = ? WHERE username = ?",
  args: [tier, username.toLowerCase()],
});

const check = await client.execute({
  sql: "SELECT username, nitro_tier FROM users WHERE username = ?",
  args: [username.toLowerCase()],
});

if (check.rows.length === 0) {
  console.error(`User not found: ${username}`);
  process.exit(1);
}

console.log(`Updated ${result.rowsAffected} row(s):`);
console.log(check.rows[0]);
