"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEclipse } from "@/context/EclipseProvider";
import { ChatFeed } from "./ChatFeed";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ConversationList } from "./ConversationList";
import { FriendsPanel } from "./FriendsPanel";
import { MobileChatOverlay } from "./MobileChatOverlay";
import { MobileNav } from "./MobileNav";
import { ProfileCard } from "./ProfileCard";

export function EclipseApp() {
  const router = useRouter();
  const {
    hydrated,
    currentUser,
    mobileTab,
    activePeerId,
    sendMessage,
    setTyping,
  } = useEclipse();

  useEffect(() => {
    if (hydrated && !currentUser) {
      router.replace("/login");
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
      <div className="hidden lg:grid lg:grid-cols-[280px_320px_1fr] lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-slate-800 bg-slate-950">
          <ProfileCard />
          <ConversationList />
        </aside>

        <section className="flex min-h-0 flex-col border-r border-slate-800 bg-slate-950/80">
          <FriendsPanel />
        </section>

        <main className="flex min-h-0 flex-col bg-slate-950">
          <ChatHeader />
          <ChatFeed />
          <ChatInput
            onSend={sendMessage}
            onTyping={() => activePeerId && setTyping(activePeerId, true)}
            disabled={!activePeerId}
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

        {mobileTab === "profile" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <ProfileCard showLogout />
            <div className="px-4 py-6 text-sm text-slate-500">
              <p>Eclipse — messages and friends are stored in SQLite.</p>
            </div>
          </div>
        )}
      </div>

      <MobileNav />
      <MobileChatOverlay />
    </div>
  );
}
