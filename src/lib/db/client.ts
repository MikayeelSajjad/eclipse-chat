import { createClient, type Client } from "@libsql/client";

const globalForDb = globalThis as unknown as { eclipseTurso?: Client };

export function getClient(): Client {
  if (!globalForDb.eclipseTurso) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error(
        "TURSO_DATABASE_URL is not set. See DEPLOY.md for setup instructions."
      );
    }
    globalForDb.eclipseTurso = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return globalForDb.eclipseTurso;
}
