"use client";

import { useEclipse } from "@/context/EclipseProvider";
import { Avatar } from "./Avatar";
import { IconBack } from "./icons";

interface ChatHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
}

export function ChatHeader({ showBack, onBack }: ChatHeaderProps) {
  const {
    getActiveFriend,
    getActiveGroup,
    activePeerId,
    activeGroupId,
    liveConnected,
  } = useEclipse();
  const friend = getActiveFriend();
  const group = getActiveGroup();

  if (!activePeerId && !activeGroupId) {
    return (
      <header className="flex shrink-0 items-center border-b border-slate-800 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-200">Messages</h2>
      </header>
    );
  }

  if (activeGroupId && group) {
    return (
      <header className="safe-top flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-950/90 px-3 py-3 backdrop-blur-md md:px-4">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-300 md:hidden"
            aria-label="Back"
          >
            <IconBack />
          </button>
        )}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/40 font-bold text-indigo-200">
          {group.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-slate-100">{group.name}</h2>
          <p className="text-xs text-emerald-400/90">
            🔒 E2E group · {group.members.length} members
          </p>
        </div>
        {liveConnected && (
          <span className="h-2 w-2 rounded-full bg-emerald-400" title="Live" />
        )}
      </header>
    );
  }

  if (!friend) {
    return (
      <header className="flex shrink-0 items-center border-b border-slate-800 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-200">Messages</h2>
      </header>
    );
  }

  return (
    <header className="safe-top flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-950/90 px-3 py-3 backdrop-blur-md md:px-4">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-300 md:hidden"
          aria-label="Back to conversations"
        >
          <IconBack />
        </button>
      )}
      <Avatar username={friend.username} avatarUrl={friend.avatar_url} size="sm" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-slate-100">{friend.username}</h2>
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="text-emerald-400/80">🔒 E2E</span>
          {liveConnected && (
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          )}
          {liveConnected ? "Live" : "Connecting..."}
        </p>
      </div>
    </header>
  );
}
