import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export async function prepareDb(): Promise<NextResponse | null> {
  try {
    await ensureSchema();
    return null;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Database connection failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
