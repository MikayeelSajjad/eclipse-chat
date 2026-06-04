"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEclipse } from "@/context/EclipseProvider";
import { nitroLabel, NITRO_BASIC_PRICE_USD, NITRO_PLUS_PRICE_USD } from "@/lib/nitro";

function NitroContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { hydrated, currentUser, startCheckout, refreshUser } = useEclipse();
  const canceled = params.get("canceled");

  useEffect(() => {
    if (hydrated && currentUser) void refreshUser();
  }, [hydrated, currentUser, refreshUser]);

  const handlePlan = async (plan: "basic" | "plus") => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    const err = await startCheckout(plan);
    if (err) alert(err);
  };

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← Eclipse home
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Nitro</h1>
        <p className="mt-2 text-slate-400">
          {currentUser
            ? `Current plan: ${nitroLabel(currentUser.nitro_tier)} · ${currentUser.friend_count}/${currentUser.friend_limit} friends`
            : "Sign in to subscribe with Lemon Squeezy."}
        </p>
        {canceled && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
            Checkout canceled. You can try again anytime.
          </p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold text-indigo-300">Nitro Basic</h2>
            <p className="mt-2 text-3xl font-bold">
              ${NITRO_BASIC_PRICE_USD}
              <span className="text-base text-slate-500">/month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Friend limit: 20 → 40</li>
              <li>Create encrypted private groups</li>
            </ul>
            <button
              type="button"
              onClick={() => handlePlan("basic")}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500"
            >
              Subscribe to Basic
            </button>
          </div>

          <div className="glass rounded-2xl border border-cyan-500/30 p-6">
            <h2 className="text-xl font-bold text-cyan-300">Nitro+</h2>
            <p className="mt-2 text-3xl font-bold">
              ${NITRO_PLUS_PRICE_USD}
              <span className="text-base text-slate-500">/month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Friend limit: 40 → 60</li>
              <li>All Nitro Basic features</li>
            </ul>
            <button
              type="button"
              onClick={() => handlePlan("plus")}
              className="mt-6 w-full rounded-xl bg-cyan-600 py-3 font-semibold text-white hover:bg-cyan-500"
            >
              Subscribe to Nitro+
            </button>
          </div>
        </div>

        {currentUser && (
          <Link
            href="/chat"
            className="mt-8 inline-block text-sm text-slate-400 hover:text-slate-200"
          >
            Back to chat →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function NitroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-slate-400">
          Loading…
        </div>
      }
    >
      <NitroContent />
    </Suspense>
  );
}
