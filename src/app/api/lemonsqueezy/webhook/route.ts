import { NextResponse } from "next/server";
import { prepareDb } from "@/lib/api-route";
import { findUserById, updateUserNitro } from "@/lib/db/users";
import {
  isActiveSubscriptionStatus,
  isEndedSubscriptionStatus,
  resolveTierFromWebhook,
  verifyWebhookSignature,
  type LemonWebhookPayload,
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "";
  const userId = payload.meta?.custom_data?.user_id;
  const status = payload.data?.attributes?.status;
  const customerId = payload.data?.attributes?.customer_id;
  const subscriptionId = payload.data?.id;

  const subscriptionEvents = [
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_expired",
    "subscription_resumed",
  ];

  if (!subscriptionEvents.includes(eventName)) {
    return NextResponse.json({ received: true });
  }

  if (!userId) {
    return NextResponse.json({ received: true, note: "no user_id in custom_data" });
  }

  const user = await findUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const lsCustomerId = customerId != null ? String(customerId) : null;
  const lsSubscriptionId =
    subscriptionId != null ? String(subscriptionId) : null;

  if (isActiveSubscriptionStatus(status)) {
    const tier = resolveTierFromWebhook(payload);
    if (tier !== "none") {
      await updateUserNitro(user.id, tier, lsCustomerId, lsSubscriptionId);
    }
  } else if (
    isEndedSubscriptionStatus(status) ||
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
  ) {
    await updateUserNitro(user.id, "none", null, null);
  }

  return NextResponse.json({ received: true });
}
