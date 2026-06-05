"use client";

import Link from "next/link";
import { useState } from "react";
import { useCrypto } from "@/context/CryptoProvider";
import { useEclipse } from "@/context/EclipseProvider";
import { apiFetch } from "@/lib/api";
import { IconEclipse } from "@/components/icons";

export default function SettingsPage() {
  const { currentUser, logout } = useEclipse();
  const crypto = useCrypto();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-xl shadow-slate-950/20">
          <h1 className="text-2xl font-semibold">Account settings</h1>
          <p className="mt-3 text-slate-400">Sign in to manage your account settings.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setStatus("");
    if (!currentPassword.trim() || !newPassword.trim()) {
      setStatus("Please complete both fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      if (!res.ok) {
        setStatus(res.error || "Unable to reset password.");
      } else {
        const rotateError = await crypto.rotatePrivateKeyPassword(
          currentUser.id,
          currentPassword.trim(),
          newPassword.trim()
        );
        if (rotateError) {
          setStatus(
            `Password updated, but local encryption keys could not be re-encrypted: ${rotateError}`
          );
        } else {
          setStatus("Password updated successfully.");
          setCurrentPassword("");
          setNewPassword("");
        }
      }
    } catch (err) {
      setStatus("Server error while resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <IconEclipse className="h-8 w-8" />
              <h1 className="text-2xl font-semibold">Settings</h1>
            </div>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Manage your profile, password, and account preferences from one page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/chat"
              className="inline-flex rounded-2xl border border-slate-700 bg-slate-950/80 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Back to chat
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex rounded-2xl border border-slate-700 bg-slate-950/80 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Username</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">{currentUser.username}</p>
            <p className="mt-1 text-sm text-slate-500">@{currentUser.username}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Change password</h2>
            <p className="mt-2 text-sm text-slate-400">
              Update your login password and re-encrypt your local private key.
            </p>

            <div className="mt-6 grid gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                  placeholder="Enter new password"
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-3xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
              {status && (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-200">
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
