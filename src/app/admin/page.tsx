"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useEclipse } from "@/context/EclipseProvider";
import { nitroLabel, type NitroTier } from "@/lib/nitro";

const TIERS: NitroTier[] = ["none", "basic", "plus"];

export default function AdminPage() {
  const { hydrated, currentUser } = useEclipse();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; username: string; avatar_url: string | null; nitro_tier: NitroTier; role: string; banned: boolean }>>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [tier, setTier] = useState<NitroTier>("basic");
  const [status, setStatus] = useState<string>("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    const controller = new AbortController();
    const search = async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (response.ok) {
          setUsers(payload.users || []);
        } else {
          setStatus(payload.error || "Could not search users");
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setStatus("User search failed");
        }
      }
    };

    const timeout = window.setTimeout(search, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const selectedUser = useMemo(
    () => users.find((user) => user.username === selectedUsername) ?? null,
    [selectedUsername, users]
  );

  const handleGrant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");

    if (!selectedUser) {
      setStatus("Please select a user.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/grant-nitro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedUser.username, tier }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error || "Failed to update Nitro.");
      } else {
        setStatus(`Updated ${payload.username} to ${nitroLabel(payload.tier)}.`);
      }
    } catch (error) {
      setStatus("Server error while updating Nitro.");
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (ban: boolean) => {
    setStatus("");
    if (!selectedUser) {
      setStatus("Please select a user to ban/unban.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedUser.username, action: ban ? "ban" : "unban" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error || "Failed to update ban status.");
      } else {
        setStatus(`${payload.username} is now ${payload.banned ? "banned" : "unbanned"}.`);
        // update local users list
        setUsers((prev) => prev.map(u => u.username === payload.username ? { ...u, banned: payload.banned } : u));
      }
    } catch (error) {
      setStatus("Server error while updating ban status.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setStatus("");
    if (!selectedUser) {
      setStatus("Please select a user to reset.");
      return;
    }
    if (!password.trim()) {
      setStatus("Please enter a new password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedUser.username, password: password.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error || "Failed to reset password.");
      } else {
        setStatus(`Password for ${payload.username} was updated.`);
        setPassword("");
      }
    } catch (error) {
      setStatus("Server error while resetting password.");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return <div className="p-8 text-slate-300">Loading admin panel…</div>;
  }

  if (!currentUser) {
    return <div className="p-8 text-slate-300">Please sign in to access the admin panel.</div>;
  }

  if (!isAdmin) {
    return <div className="p-8 text-slate-300">Admin access is required for this page.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
      <div className="rounded-3xl border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
        <h1 className="text-3xl font-semibold text-white">Admin Panel</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage user Nitro tiers, password resets, bans, and moderation tools.
        </p>

        <form onSubmit={handleGrant} className="mt-8 space-y-6">
          <label className="block text-sm font-medium text-slate-200">
            Search users
          </label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            placeholder="Type username to search"
          />

          {users.length > 0 && (
            <div className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUsername(user.username)}
                  className={`text-left rounded-xl px-4 py-3 transition ${
                    selectedUsername === user.username
                      ? "bg-cyan-500/20 ring-1 ring-cyan-400"
                      : "bg-slate-950 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-100">{user.username}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{nitroLabel(user.nitro_tier)}</span>
                      {user.role === "admin" ? (
                        <span className="text-xs rounded-full bg-amber-500/10 px-2 py-1 text-amber-200">ADMIN</span>
                      ) : user.banned ? (
                        <span className="text-xs rounded-full bg-red-500/10 px-2 py-1 text-red-300">BANNED</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h2 className="text-sm font-semibold text-slate-100">Selected user</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-400">Username</p>
                  <p className="mt-1 text-base font-medium text-slate-100">{selectedUser.username}</p>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-400">Role</p>
                  <p className="mt-1 text-base font-medium text-slate-100">{selectedUser.role}</p>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-400">Nitro</p>
                  <p className="mt-1 text-base font-medium text-slate-100">{nitroLabel(selectedUser.nitro_tier)}</p>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-400">Status</p>
                  <p className="mt-1 text-base font-medium text-slate-100">
                    {selectedUser.banned ? "Banned" : "Active"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-200">Select Nitro tier</label>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {TIERS.map((option) => (
                <label
                  key={option}
                  className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm transition ${
                    tier === option
                      ? "border-cyan-400 bg-cyan-500/10 text-white"
                      : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={option}
                    checked={tier === option}
                    onChange={() => setTier(option)}
                    className="hidden"
                  />
                  {option === "none" ? "Revoke" : option === "basic" ? "Nitro Basic" : "Nitro+"}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update Nitro"}
          </button>

          {selectedUser && (
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <label className="block text-sm font-medium text-slate-200">
                  Set new password
                </label>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="New password"
                  className="mt-3 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading || !password.trim()}
                  className="mt-3 w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset Password
                </button>
                <p className="mt-3 text-xs text-slate-500">
                  Note: resetting a password changes login credentials only. If a user has local encryption keys stored in their browser, they may need to reinitialize their crypto identity if the old password is no longer available.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleBanToggle(true)}
                  disabled={loading || selectedUser.role === "admin"}
                  className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                >
                  Ban User
                </button>
                <button
                  type="button"
                  onClick={() => handleBanToggle(false)}
                  disabled={loading}
                  className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  Unban User
                </button>
              </div>
            </div>
          )}

          {status && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
              {status}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
