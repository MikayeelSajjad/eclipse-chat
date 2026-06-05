"use client";

import { useEclipse } from "@/context/EclipseProvider";
import { Avatar } from "./Avatar";
import { IconEclipse } from "./icons";

interface ProfileCardProps {
  showLogout?: boolean;
}

export function ProfileCard({ showLogout = true }: ProfileCardProps) {
  const { currentUser, logout, notificationsEnabled, enableNotifications } =
    useEclipse();
  const tier = currentUser?.nitro_tier ?? "none";
  if (!currentUser) return null;

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
