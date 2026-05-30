import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { getConversationSummaries } from "@/lib/db/messages";

export const runtime = "nodejs";

export async function GET() {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const conversations = await getConversationSummaries(userId);
  return NextResponse.json({ conversations });
}
