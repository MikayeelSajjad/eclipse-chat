"use client";

import { FormEvent, useState } from "react";
import { CRYPTO_LOCKED, useCrypto } from "@/context/CryptoProvider";
import { useEclipse } from "@/context/EclipseProvider";

export function CryptoUnlockBanner() {
  const { currentUser, unlockEncryption } = useEclipse();
  const crypto = useCrypto();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!currentUser || crypto.cryptoReady) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const err = await unlockEncryption(password);
    setBusy(false);
    if (err) setError(err);
    else setPassword("");
  };

  const hasKeys = crypto.hasLocalKeys(currentUser.id);

  return (
    <div className="border-b border-amber-500/40 bg-amber-950/40 px-4 py-3">
      <p className="text-sm font-medium text-amber-200">
        🔒 Unlock encryption to chat and create groups
      </p>
      <p className="mt-1 text-xs text-amber-200/70">
        {hasKeys
          ? "Enter your account password (needed after refresh)."
          : "Enter your password once to set up E2E keys on this device."}
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Account password"
          required
          autoComplete="current-password"
          className="min-w-[140px] flex-1 rounded-lg border border-amber-500/30 bg-slate-950 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
        >
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-xs text-red-300">
          {error === CRYPTO_LOCKED
            ? "Encryption still locked. Try again."
            : error}
        </p>
      )}
    </div>
  );
}
