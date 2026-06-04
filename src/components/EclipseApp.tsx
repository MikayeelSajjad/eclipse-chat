"use client";

import { useEffect } from "react";
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
import { CryptoUnlockBanner } from "./CryptoUnlockBanner";

export function EclipseApp() {
  const router = useRouter();
  const {
    hydrated,
    currentUser,
    mobileTab,
    activePeerId,
    activeGroupId,
    sendMessage,
    pingTyping,
  } = useEclipse();

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
      <div className="hidden lg:grid lg:grid-cols-[280px_320px_1fr] lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-slate-800 bg-slate-950">
          <ProfileCard />
          <ConversationList />
        </aside>

        <section className="flex min-h-0 flex-col border-r border-slate-800 bg-slate-950/80">
          <FriendsPanel />
          <GroupsPanel />
        </section>

        <main className="flex min-h-0 flex-col bg-slate-950">
          <ChatHeader />
          <ChatFeed />
          <ChatInput
            onSend={sendMessage}
            onTyping={() => activePeerId && pingTyping(activePeerId)}
            disabled={!activePeerId && !activeGroupId}
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
