"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useEclipse } from "@/context/EclipseProvider";
import { nitroLabel, type NitroTier } from "@/lib/nitro";

const TIERS: NitroTier[] = ["none", "basic", "plus"];

export default function AdminPage() {
  const { hydrated, currentUser } = useEclipse();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; username: string; avatar_url: string | null; nitro_tier: NitroTier }>>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [tier, setTier] = useState<NitroTier>("basic");
  const [status, setStatus] = useState<string>("");
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
      setStatus("Please select a user to grant Nitro.");
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
        setStatus(payload.error || "Failed to grant Nitro.");
      } else {
        setStatus(`Granted ${nitroLabel(payload.tier)} to ${payload.username}.`);
      }
    } catch (error) {
      setStatus("Server error while granting Nitro.");
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
        <h1 className="text-3xl font-semibold text-white">Admin Nitro Panel</h1>
        <p className="mt-2 text-sm text-slate-400">
          Grant any user Nitro Basic, Nitro+, or revoke Nitro.
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
                    <span className="text-xs text-slate-500">{nitroLabel(user.nitro_tier)}</span>
                  </div>
                </button>
              ))}
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
            {loading ? "Granting…" : "Grant Nitro"}
          </button>

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
