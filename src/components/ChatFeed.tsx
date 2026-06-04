"use client";

import { useEffect, useRef } from "react";
import { useEclipse } from "@/context/EclipseProvider";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export function ChatFeed() {
  const {
    activePeerId,
    activeGroupId,
    currentUser,
    messages,
    getActiveFriend,
    getActiveGroup,
    typingPeerId,
    getDisplayContent,
  } = useEclipse();
  const bottomRef = useRef<HTMLDivElement>(null);
  const friend = getActiveFriend();
  const group = getActiveGroup();
  const isTyping = activePeerId && typingPeerId === activePeerId;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  if ((!activePeerId && !activeGroupId) || !currentUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600/30 to-cyan-500/20 ring-1 ring-indigo-500/40" />
        <h2 className="text-lg font-semibold text-slate-200">Eclipse Chat</h2>
        <p className="max-w-xs text-sm text-slate-500">
          Select a DM or encrypted group to chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain py-4 space-y-2">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            content={getDisplayContent(m)}
            createdAt={m.created_at}
            isOwn={m.sender_id === currentUser.id}
          />
        ))}
        {isTyping && friend && <TypingIndicator name={friend.username} />}
        {activeGroupId && group && messages.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-8">
            Send the first encrypted message to {group.name}
          </p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
