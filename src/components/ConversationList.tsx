"use client";

import { useEclipse } from "@/context/EclipseProvider";
import { Avatar } from "./Avatar";

interface ConversationListProps {
  onSelect?: () => void;
}

export function ConversationList({ onSelect }: ConversationListProps) {
  const { currentUser, conversations, activePeerId, openConversation, isPeerUnread } =
    useEclipse();

  if (!currentUser) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Conversations
        </h2>
      </div>
      <ul className="flex-1 overflow-y-auto overscroll-contain">
        {conversations.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">
            No chats yet. Add friends and start messaging.
          </li>
        ) : (
          conversations.map((conv) => {
            const isActive = activePeerId === conv.peerId;
            const last = conv.lastMessage;
            const unread = isPeerUnread(conv.peerId);

            return (
              <li key={conv.peerId}>
                <button
                  type="button"
                  onClick={() => {
                    openConversation(conv.peerId);
                    onSelect?.();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-slate-800/60 md:py-3 ${
                    isActive
                      ? "bg-indigo-950/40 border-l-2 border-indigo-500 shadow-[inset_0_0_24px_rgba(99,102,241,0.08)]"
                      : "border-l-2 border-transparent hover:bg-slate-900/50"
                  }`}
                >
                  <Avatar
                    username={conv.peer.username}
                    avatarUrl={conv.peer.avatar_url}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-medium text-slate-100 flex items-center gap-2">
                      {conv.peer.username}
                      {unread && !isActive && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                      )}
                    </span>
                    <p className="truncate text-sm text-slate-500">
                      {last?.content ?? "Start a conversation"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
