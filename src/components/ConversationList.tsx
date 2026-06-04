"use client";

import { useEclipse } from "@/context/EclipseProvider";
import { Avatar } from "./Avatar";
import { encryptedPreview, isEncryptedPayload } from "@/lib/crypto/e2e";

interface ConversationListProps {
  onSelect?: () => void;
}

export function ConversationList({ onSelect }: ConversationListProps) {
  const {
    currentUser,
    conversations,
    groups,
    activePeerId,
    activeGroupId,
    openConversation,
    openGroup,
    isPeerUnread,
  } = useEclipse();

  if (!currentUser) return null;

  const preview = (content: string | undefined) => {
    if (!content) return "Start a conversation";
    if (isEncryptedPayload(content)) return encryptedPreview();
    return content;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Direct messages
        </h2>
      </div>
      <ul className="overflow-y-auto overscroll-contain">
        {conversations.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            No DMs yet. Add friends and start messaging.
          </li>
        ) : (
          conversations.map((conv) => {
            const isActive = activePeerId === conv.peerId && !activeGroupId;
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
                      ? "bg-indigo-950/40 border-l-2 border-indigo-500"
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
                      {preview(last?.content)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="border-t border-b border-slate-800 px-4 py-3 mt-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Groups 🔒
        </h2>
      </div>
      <ul className="flex-1 overflow-y-auto overscroll-contain">
        {groups.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            {currentUser.can_create_groups
              ? "Create a group in the Groups tab."
              : "Get Nitro Basic to create groups."}
          </li>
        ) : (
          groups.map((g) => {
            const isActive = activeGroupId === g.id;
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => {
                    openGroup(g.id);
                    onSelect?.();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                    isActive
                      ? "bg-indigo-950/40 border-l-2 border-indigo-500"
                      : "border-l-2 border-transparent hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 font-bold text-indigo-300">
                    {g.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-100">{g.name}</p>
                    <p className="truncate text-sm text-slate-500">
                      {preview(g.lastMessage?.content)}
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
