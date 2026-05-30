"use client";

import { useEffect, useState } from "react";
import { useEclipse } from "@/context/EclipseProvider";
import type { SearchUser } from "@/lib/types";
import { Avatar } from "./Avatar";
import { IconSearch } from "./icons";

export function FriendsPanel() {
  const {
    searchUsers,
    searchResults,
    sendFriendRequest,
    friends,
    acceptFriendRequest,
    declineFriendRequest,
    openConversation,
    setMobileTab,
  } = useEclipse();

  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  const handleAdd = async (user: SearchUser) => {
    const ok = await sendFriendRequest(user.id);
    setFeedback(
      ok ? `Request sent to @${user.username}` : "Could not send request"
    );
    if (ok) searchUsers(query);
    setTimeout(() => setFeedback(""), 3000);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-800 px-4 py-4 md:py-3">
        <h2 className="text-lg font-semibold text-slate-100 md:text-base">Social</h2>
        <p className="text-sm text-slate-500">Friends & requests</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-6">
        <section className="w-full min-w-0">
          <label
            htmlFor="friend-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Search users
          </label>
          <div className="relative w-full">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <IconSearch className="text-slate-400" />
            </div>
            <input
              id="friend-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Click here and type: happy"
              className="glow-ring block w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-3 text-[15px] text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          {!query.trim() && (
            <p className="mt-2 text-xs text-slate-500">
              Type your friend&apos;s username in the box above, then click{" "}
              <span className="text-indigo-400">Add</span>.
            </p>
          )}
          {feedback && (
            <p className="mt-2 text-sm text-cyan-400/90">{feedback}</p>
          )}
          {searchResults.length > 0 && (
            <ul className="mt-3 space-y-2">
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                >
                  <Avatar username={user.username} avatarUrl={user.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-100 truncate">
                      {user.username}
                    </p>
                    <p className="text-sm text-slate-500">@{user.username}</p>
                  </div>
                  {user.friendshipStatus === "accepted" ? (
                    <span className="text-xs text-emerald-400 font-medium">Friends</span>
                  ) : user.friendshipStatus === "pending" ? (
                    <span className="text-xs text-slate-500">
                      {user.isIncoming ? "Requested you" : "Pending"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(user)}
                      className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-glow active:scale-95"
                    >
                      Add
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {friends.incoming.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Incoming requests
              <span className="rounded-full bg-indigo-600/30 px-2 py-0.5 text-indigo-300">
                {friends.incoming.length}
              </span>
            </h3>
            <ul className="space-y-2">
              {friends.incoming.map(({ id, user }) => (
                <li
                  key={id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3"
                >
                  <Avatar username={user.username} avatarUrl={user.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-100">{user.username}</p>
                    <p className="text-sm text-slate-500">@{user.username}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => acceptFriendRequest(id)}
                      className="flex-1 sm:flex-none rounded-lg bg-emerald-600/90 px-3 py-2 text-sm font-medium text-white active:scale-95"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => declineFriendRequest(id)}
                      className="flex-1 sm:flex-none rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 active:scale-95"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Friends ({friends.accepted.length})
          </h3>
          {friends.accepted.length === 0 ? (
            <p className="text-sm text-slate-500">No friends yet. Search to add someone.</p>
          ) : (
            <ul className="space-y-1">
              {friends.accepted.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => {
                      openConversation(user.id);
                      setMobileTab("chats");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-900/60 active:bg-slate-800/60"
                  >
                    <Avatar username={user.username} avatarUrl={user.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100">{user.username}</p>
                      <p className="text-sm text-slate-500">@{user.username}</p>
                    </div>
                    <span className="text-xs text-indigo-400">Message</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
