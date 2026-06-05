"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEclipse } from "@/context/EclipseProvider";
import { nitroLabel, NITRO_BASIC_PRICE_USD, NITRO_PLUS_PRICE_USD } from "@/lib/nitro";

const USDT_WALLET = "TK7ocUhAAqm2AW7T5Rxq79aA2qj5QDLftG";
const ACTIVATION_EMAIL = "eclipse.activation@proton.me";

function NitroContent() {
  const router = useRouter();
  const { hydrated, currentUser, refreshUser } = useEclipse();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (hydrated && currentUser) void refreshUser();
  }, [hydrated, currentUser, refreshUser]);

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(USDT_WALLET);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← Eclipse home
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Nitro</h1>
        <p className="mt-2 text-slate-400">
          {currentUser
            ? `Current plan: ${nitroLabel(currentUser.nitro_tier)} · ${currentUser.friend_count}/${currentUser.friend_limit} friends`
            : "Sign in and pay via USDT to upgrade your Nitro tier."}
        </p>

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
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
          <h2 className="text-xl font-bold text-white">Pay with USDT (TRC-20)</h2>
          <p className="mt-3 text-slate-300">
            Send USDT on the Tron network to the wallet address below. After payment, email a screenshot to{' '}
            <strong className="text-indigo-300">{ACTIVATION_EMAIL}</strong> with your account email/username and the Nitro plan you purchased.
          </p>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-slate-500">USDT wallet address</p>
          <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-slate-700/80 bg-slate-950 p-4 text-sm text-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <span className="break-all">{USDT_WALLET}</span>
            <button
              type="button"
              onClick={copyWallet}
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {copied ? "Copied" : "Copy address"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950 p-4 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(USDT_WALLET)}`}
                alt="USDT TRC-20 wallet QR code"
                className="h-52 w-52 object-contain"
              />
            </div>
            <div className="text-sm text-slate-300">
              <p>Scan this QR code to pay the same USDT TRC-20 wallet address.</p>
              <p className="mt-2">Ensure your wallet is configured for Tron network USDT.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm text-slate-400">
            <p>
              Use Tron network USDT (TRC-20) only. Do not send ERC-20 or other chains.
            </p>
            <p>
              Nitro will be granted within a few hours after payment confirmation.
            </p>
            <p>
              If you are not signed in,{' '}
              <button onClick={handleLogin} className="text-indigo-300 underline">
                log in first
              </button>{' '}
              so your payment can be matched to your account.
            </p>
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
