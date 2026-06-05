"use client";

import Link from "next/link";
import { useEclipse } from "@/context/EclipseProvider";
import { IconEclipse } from "@/components/icons";

export default function ProfilePage() {
  const { currentUser, logout } = useEclipse();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-xl shadow-slate-950/20">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="mt-3 text-slate-400">Sign in to view your profile.</p>
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

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <IconEclipse className="h-8 w-8" />
              <h1 className="text-2xl font-semibold">Profile</h1>
            </div>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Your account details, Nitro tier, and quick access to settings.
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

        <div className="mt-10 grid gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Username</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{currentUser.username}</p>
            <p className="mt-1 text-sm text-slate-500">@{currentUser.username}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Account overview</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              <p>
                Friends: <span className="text-slate-200">{currentUser.friend_count}</span> /{' '}
                <span className="text-slate-200">{currentUser.friend_limit}</span>
              </p>
              <p>
                Nitro tier: <span className="text-slate-200">{currentUser.nitro_tier === 'none' ? 'Free' : currentUser.nitro_tier === 'basic' ? 'Nitro Basic' : 'Nitro+'}</span>
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <Link
                href="/settings"
                className="block rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
              >
                Open settings
              </Link>
              <Link
                href="/nitro"
                className="block rounded-2xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
              >
                Upgrade Nitro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
