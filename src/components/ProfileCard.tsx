"use client";

import { useState } from "react";
import { useCrypto } from "@/context/CryptoProvider";
import { useEclipse } from "@/context/EclipseProvider";
import { apiFetch } from "@/lib/api";
import { Avatar } from "./Avatar";
import { IconEclipse } from "./icons";

interface ProfileCardProps {
  showLogout?: boolean;
}

export function ProfileCard({ showLogout = true }: ProfileCardProps) {
  const { currentUser, logout, notificationsEnabled, enableNotifications } =
    useEclipse();
  const crypto = useCrypto();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const tier = currentUser?.nitro_tier ?? "none";
  if (!currentUser) return null;

  const handlePasswordReset = async () => {
    setStatus("");
    if (!currentPassword.trim() || !newPassword.trim()) {
      setStatus("Please fill in both password fields.");
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
        const rotateErr = await crypto.rotatePrivateKeyPassword(
          currentUser.id,
          currentPassword.trim(),
          newPassword.trim()
        );
        if (rotateErr) {
          setStatus(
            `Password updated, but local encryption keys must be reinitialized: ${rotateErr}`
          );
        } else {
          setStatus("Password updated successfully.");
          setCurrentPassword("");
          setNewPassword("");
        }
      }
    } catch (error) {
      setStatus("Server error while resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-slate-800 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <IconEclipse className="w-7 h-7" />
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Eclipse
        </span>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Avatar
            username={currentUser.username}
            avatarUrl={currentUser.avatar_url}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-100 truncate">
              {currentUser.username}
            </p>
            <p className="text-sm text-cyan-400/80">@{currentUser.username}</p>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.friend_count}/{currentUser.friend_limit} friends ·{" "}
              {tier === "none" ? "Free" : tier === "basic" ? "Nitro Basic" : "Nitro+"}
            </p>
          </div>
        </div>
        <a
          href="/nitro"
          className="mt-4 block w-full rounded-xl bg-gradient-to-r from-indigo-600/80 to-cyan-600/60 py-2.5 text-center text-sm font-semibold text-white"
        >
          Upgrade Nitro
        </a>
        {currentUser.role === "admin" && (
          <a
            href="/admin"
            className="mt-4 block w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-2.5 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
          >
            Admin Panel
          </a>
        )}
        {showLogout && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Change password
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Use your current password to set a new login password.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-200">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
              />
              <label className="block text-sm font-medium text-slate-200">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating…" : "Reset password"}
              </button>
              {status && (
                <p className="text-sm text-slate-200">{status}</p>
              )}
            </div>
          </div>
        )}
        {showLogout && !notificationsEnabled && (
          <button
            type="button"
            onClick={() => enableNotifications()}
            className="mt-4 w-full rounded-xl border border-indigo-500/40 bg-indigo-950/30 py-2.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-950/50 active:scale-[0.98]"
          >
            Enable message notifications
          </button>
        )}
        {showLogout && (
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 w-full rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/50 active:scale-[0.98]"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
