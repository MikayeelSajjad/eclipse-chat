import crypto from "node:crypto";
import type { NitroTier } from "./nitro";
import { tierFromPlan } from "./nitro";

const API_BASE = "https://api.lemonsqueezy.com/v1";

export function lemonsqueezyConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_VARIANT_BASIC_ID &&
      process.env.LEMONSQUEEZY_VARIANT_PLUS_ID
  );
}

export function variantIdForPlan(plan: "basic" | "plus"): string | null {
  if (plan === "plus") return process.env.LEMONSQUEEZY_VARIANT_PLUS_ID ?? null;
  if (plan === "basic") return process.env.LEMONSQUEEZY_VARIANT_BASIC_ID ?? null;
  return null;
}

export function tierFromVariantId(variantId: string | number | undefined): NitroTier {
  const id = String(variantId ?? "");
  if (id && id === process.env.LEMONSQUEEZY_VARIANT_PLUS_ID) return "plus";
  if (id && id === process.env.LEMONSQUEEZY_VARIANT_BASIC_ID) return "basic";
  return "none";
}

export async function createLemonCheckout(options: {
  variantId: string;
  userId: string;
  plan: "basic" | "plus";
  redirectUrl: string;
}): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) {
    throw new Error("Lemon Squeezy is not configured");
  }

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              user_id: options.userId,
              plan: options.plan,
            },
          },
          product_options: {
            redirect_url: options.redirectUrl,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: storeId },
          },
          variant: {
            data: { type: "variants", id: options.variantId },
          },
        },
      },
    }),
  });

  const json = (await res.json()) as {
    data?: { attributes?: { url?: string } };
    errors?: { detail?: string }[];
  };

  if (!res.ok) {
    const detail = json.errors?.[0]?.detail ?? res.statusText;
    throw new Error(detail || "Checkout creation failed");
  }

  const url = json.data?.attributes?.url;
  if (!url) throw new Error("No checkout URL returned");
  return url;
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  if (!signatureHeader) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(digest, signature);
}

export interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
      plan?: string;
    };
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      customer_id?: number | string;
      variant_id?: number | string;
      product_id?: number | string;
    };
  };
}

export function resolveTierFromWebhook(payload: LemonWebhookPayload): NitroTier {
  const plan = payload.meta?.custom_data?.plan;
  if (plan === "basic" || plan === "plus") return tierFromPlan(plan);
  return tierFromVariantId(payload.data?.attributes?.variant_id);
}

export function isActiveSubscriptionStatus(status: string | undefined): boolean {
  return status === "active" || status === "on_trial" || status === "paused";
}

export function isEndedSubscriptionStatus(status: string | undefined): boolean {
  return (
    status === "cancelled" ||
    status === "expired" ||
    status === "unpaid" ||
    status === "past_due"
  );
}
