"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEclipse } from "@/context/EclipseProvider";
import { ChatFeed } from "./ChatFeed";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ConversationList } from "./ConversationList";
import { FriendsPanel } from "./FriendsPanel";
import { GroupsPanel } from "./GroupsPanel";
import { MobileChatOverlay } from "./MobileChatOverlay";
import { MobileNav } from "./MobileNav";
import { ProfileCard } from "./ProfileCard";
import { IconChats, IconFriends, IconGroups, IconProfile, IconEclipse } from "./icons";
import { CryptoUnlockBanner } from "./CryptoUnlockBanner";

export function EclipseApp() {
  const router = useRouter();
  const {
    hydrated,
    currentUser,
    mobileTab,
    activePeerId,
    activeGroupId,
    cryptoReady,
    sendMessage,
    pingTyping,
  } = useEclipse();
  const [panel, setPanel] = useState<"chats" | "groups" | "friends">("chats");

  useEffect(() => {
    if (hydrated && !currentUser) {
      router.replace("/login?next=/chat");
    }
  }, [hydrated, currentUser, router]);

  if (!hydrated || !currentUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-slate-950">
      <CryptoUnlockBanner />
      <div className="hidden lg:grid lg:grid-cols-[84px_minmax(360px,420px)_1fr] lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-slate-800 bg-slate-950">
          <div className="flex h-full flex-col items-center justify-between gap-4 px-2 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 text-slate-100">
              <IconEclipse className="w-6 h-6" />
            </div>
            <nav className="flex flex-1 flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPanel("chats")}
                className={`flex h-14 w-14 items-center justify-center rounded-3xl transition ${
                  panel === "chats"
                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                    : "text-slate-500 hover:bg-slate-900"
                }`}
                aria-label="Chats"
              >
                <IconChats className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => setPanel("groups")}
                className={`flex h-14 w-14 items-center justify-center rounded-3xl transition ${
                  panel === "groups"
                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                    : "text-slate-500 hover:bg-slate-900"
                }`}
                aria-label="Groups"
              >
                <IconGroups className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => setPanel("friends")}
                className={`flex h-14 w-14 items-center justify-center rounded-3xl transition ${
                  panel === "friends"
                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                    : "text-slate-500 hover:bg-slate-900"
                }`}
                aria-label="Friends"
              >
                <IconFriends className="w-6 h-6" />
              </button>
            </nav>
            <Link
              href="/profile"
              className="flex h-14 w-14 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 text-slate-500 transition hover:bg-slate-900/80 hover:text-white"
              aria-label="Profile"
            >
              <IconProfile className="w-6 h-6" />
            </Link>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col border-r border-slate-800 bg-slate-950/80">
          <div className="border-b border-slate-800 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {panel === "chats" ? "Chats" : panel === "groups" ? "Groups" : "Friends"}
                </p>
                <h2 className="text-2xl font-semibold text-slate-100">
                  {panel === "chats"
                    ? "Direct messages"
                    : panel === "groups"
                    ? "Encrypted groups"
                    : "Friends & invites"}
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-900 p-2">
                <button
                  type="button"
                  onClick={() => setPanel("chats")}
                  className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    panel === "chats" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-900"
                  }`}
                >
                  Chats
                </button>
                <button
                  type="button"
                  onClick={() => setPanel("groups")}
                  className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    panel === "groups" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-900"
                  }`}
                >
                  Groups
                </button>
                <button
                  type="button"
                  onClick={() => setPanel("friends")}
                  className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    panel === "friends" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-900"
                  }`}
                >
                  Friends
                </button>
              </div>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {panel === "chats" && <ConversationList onSelect={() => setPanel("chats")} />}
            {panel === "groups" && <GroupsPanel />}
            {panel === "friends" && <FriendsPanel />}
          </div>
        </section>

        <main className="flex min-h-0 flex-col bg-slate-950">
          <ChatHeader />
          <ChatFeed />
          <ChatInput
            onSend={sendMessage}
            onTyping={() => activePeerId && pingTyping(activePeerId)}
            disabled={(!activePeerId && !activeGroupId) || !cryptoReady}
          />
        </main>
      </div>

      <div className="flex min-h-0 flex-1 flex-col pb-[72px] lg:hidden">
        {mobileTab === "chats" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <header className="safe-top border-b border-slate-800 px-4 py-4">
              <h1 className="text-xl font-bold text-slate-100">Chats</h1>
            </header>
            <ConversationList />
          </div>
        )}

        {mobileTab === "friends" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <FriendsPanel />
          </div>
        )}

        {mobileTab === "groups" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <GroupsPanel />
          </div>
        )}

        {mobileTab === "profile" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <ProfileCard showLogout />
            <div className="px-4 py-6 text-sm text-slate-500">
              <p className="mb-2">
                Friends: {currentUser.friend_count}/{currentUser.friend_limit}
              </p>
              <a href="/nitro" className="text-indigo-400 underline">
                Nitro plans
              </a>
              <p className="mt-4">E2E encrypted · server cannot read messages.</p>
            </div>
          </div>
        )}
      </div>

      <MobileNav />
      <MobileChatOverlay />
    </div>
  );
}
