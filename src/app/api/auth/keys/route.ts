import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { updateUserPublicKey } from "@/lib/db/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const publicKey =
    typeof body.public_key === "string" ? body.public_key.trim() : "";

  if (!publicKey || publicKey.length > 8192) {
    return NextResponse.json({ error: "Invalid public key" }, { status: 400 });
  }

  await updateUserPublicKey(userId, publicKey);
  return NextResponse.json({ ok: true });
}
