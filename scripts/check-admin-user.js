import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(root, "..", "data", "eclipse.db").replace(/\\/g, "/");
const client = createClient({ url: `file:${dbPath}` });

const result = await client.execute({
  sql: "SELECT id, username, password, role, nitro_tier FROM users WHERE username = ?",
  args: ["admin"],
});
console.log(JSON.stringify(result.rows, null, 2));
