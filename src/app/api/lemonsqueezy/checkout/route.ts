import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserById } from "@/lib/db";
import {
  createLemonCheckout,
  lemonsqueezyConfigured,
  variantIdForPlan,
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  if (!lemonsqueezyConfigured()) {
    return NextResponse.json(
      { error: "Lemon Squeezy is not configured on the server" },
      { status: 503 }
    );
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await findUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = body.plan === "plus" ? "plus" : body.plan === "basic" ? "basic" : null;
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const variantId = variantIdForPlan(plan);
  if (!variantId) {
    return NextResponse.json(
      { error: "Variant not configured for this plan" },
      { status: 503 }
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  try {
    const url = await createLemonCheckout({
      variantId,
      userId,
      plan,
      redirectUrl: `${origin}/chat?nitro=success`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
