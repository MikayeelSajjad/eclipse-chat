"use client";

import { useEclipse } from "@/context/EclipseProvider";
import { Avatar } from "./Avatar";
import { IconBack } from "./icons";

interface ChatHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
}

export function ChatHeader({ showBack, onBack }: ChatHeaderProps) {
  const { getActiveFriend, activePeerId } = useEclipse();
  const friend = getActiveFriend();

  if (!activePeerId || !friend) {
    return (
      <header className="flex shrink-0 items-center border-b border-slate-800 px-4 py-3 md:py-3">
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-300 transition active:bg-slate-800 md:hidden"
          aria-label="Back to conversations"
        >
          <IconBack />
        </button>
      )}
      <Avatar
        username={friend.username}
        avatarUrl={friend.avatar_url}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-slate-100">{friend.username}</h2>
        <p className="text-xs text-slate-500">@{friend.username}</p>
      </div>
    </header>
  );
}
