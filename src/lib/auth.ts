import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { findUserById } from "@/lib/db";

export const SESSION_COOKIE = "eclipse_user_id";

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value ?? null;
  if (!userId) return null;

  const user = await findUserById(userId);
  if (!user || user.banned) return null;

  return userId;
}

export function setSessionCookie(response: NextResponse, userId: string): void {
  response.cookies.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}
