"use client";

import { useEclipse } from "@/context/EclipseProvider";
import { ChatFeed } from "./ChatFeed";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";

export function MobileChatOverlay() {
  const {
    activePeerId,
    setActivePeer,
    sendMessage,
    setMobileTab,
    setTyping,
  } = useEclipse();

  if (!activePeerId) return null;

  const handleBack = () => {
    setActivePeer(null);
    setMobileTab("chats");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 lg:hidden">
      <ChatHeader showBack onBack={handleBack} />
      <ChatFeed />
      <ChatInput
        onSend={sendMessage}
        onTyping={() => setTyping(activePeerId, true)}
      />
    </div>
  );
}
