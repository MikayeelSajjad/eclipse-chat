import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserById, updateUserPassword } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({} as any));
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required" },
      { status: 400 }
    );
  }

  const user = await findUserById(userId);
  if (!user || user.password !== currentPassword) {
    return NextResponse.json(
      { error: "Invalid current password" },
      { status: 401 }
    );
  }

  await updateUserPassword(userId, newPassword);
  return NextResponse.json({ success: true });
}
