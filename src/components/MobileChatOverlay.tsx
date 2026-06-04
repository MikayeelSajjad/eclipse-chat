"use client";

import { useEclipse } from "@/context/EclipseProvider";
import { ChatFeed } from "./ChatFeed";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";

export function MobileChatOverlay() {
  const {
    activePeerId,
    activeGroupId,
    setActivePeer,
    setActiveGroup,
    sendMessage,
    setMobileTab,
    pingTyping,
  } = useEclipse();

  if (!activePeerId && !activeGroupId) return null;

  const handleBack = () => {
    setActivePeer(null);
    setActiveGroup(null);
    setMobileTab("chats");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 lg:hidden">
      <ChatHeader showBack onBack={handleBack} />
      <ChatFeed />
      <ChatInput
        onSend={sendMessage}
        onTyping={() => activePeerId && pingTyping(activePeerId)}
      />
    </div>
  );
}
