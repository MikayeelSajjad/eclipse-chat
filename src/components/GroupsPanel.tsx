"use client";

import { FormEvent, useState } from "react";
import { useEclipse } from "@/context/EclipseProvider";

export function GroupsPanel() {
  const {
    currentUser,
    friends,
    groups,
    createGroup,
    inviteToGroup,
    openGroup,
    setMobileTab,
  } = useEclipse();

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [inviteGroupId, setInviteGroupId] = useState("");
  const [inviteUserId, setInviteUserId] = useState("");

  if (!currentUser) return null;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser.can_create_groups) {
      setFeedback("Nitro Basic or Nitro+ required to create groups.");
      return;
    }
    const err = await createGroup(name, selected);
    setFeedback(err ?? "Group created");
    if (!err) {
      setName("");
      setSelected([]);
    }
    setTimeout(() => setFeedback(""), 6000);
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    const err = await inviteToGroup(inviteGroupId, inviteUserId);
    setFeedback(err ?? "Invited to group");
    setTimeout(() => setFeedback(""), 6000);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-800 px-4 py-4">
        <h2 className="text-lg font-semibold text-slate-100">Groups</h2>
        <p className="text-sm text-slate-500">E2E encrypted private groups</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {feedback && (
          <p className="text-sm text-cyan-400/90 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-2">
            {feedback}
          </p>
        )}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your groups ({groups.length})
          </h3>
          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">No groups yet.</p>
          ) : (
            <ul className="space-y-1">
              {groups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => {
                      openGroup(g.id);
                      setMobileTab("chats");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-900/60"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-300 font-bold">
                      {g.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100 truncate">{g.name}</p>
                      <p className="text-xs text-slate-500">
                        {g.members.length} members · 🔒 E2E
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {currentUser.can_create_groups && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Create group</h3>
            <form onSubmit={handleCreate} className="mt-3 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                required
                maxLength={64}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              />
              <p className="text-xs text-slate-500">Add friends (optional):</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {friends.accepted.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(f.id)}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, f.id]
                            : prev.filter((id) => id !== f.id)
                        );
                      }}
                    />
                    {f.username}
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
              >
                Create encrypted group
              </button>
            </form>
          </section>
        )}

        {!currentUser.can_create_groups && (
          <p className="text-sm text-slate-500">
            Upgrade to{" "}
            <a href="/nitro" className="text-indigo-400 underline">
              Nitro Basic
            </a>{" "}
            to create groups.
          </p>
        )}

        {groups.length > 0 && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Invite to group</h3>
            <form onSubmit={handleInvite} className="mt-3 space-y-3">
              <select
                value={inviteGroupId}
                onChange={(e) => setInviteGroupId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Select group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <select
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="">Select friend</option>
                {friends.accepted.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.username}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-xl border border-indigo-500/50 py-2.5 text-sm font-medium text-indigo-300"
              >
                Invite (E2E key delivery)
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
