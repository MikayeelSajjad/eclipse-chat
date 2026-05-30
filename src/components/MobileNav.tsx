"use client";

import { useEclipse } from "@/context/EclipseProvider";
import type { MobileTab } from "@/lib/types";
import { IconChats, IconFriends, IconProfile } from "./icons";

const tabs: { id: MobileTab; label: string; Icon: typeof IconChats }[] = [
  { id: "chats", label: "Chats", Icon: IconChats },
  { id: "friends", label: "Friends", Icon: IconFriends },
  { id: "profile", label: "Profile", Icon: IconProfile },
];

export function MobileNav() {
  const { mobileTab, setMobileTab, friends } = useEclipse();
  const requestCount = friends.incoming.length;

  return (
    <nav
      className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl lg:hidden"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-around px-2 pt-1 pb-2">
        {tabs.map(({ id, label, Icon }) => {
          const active = mobileTab === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => setMobileTab(id)}
                className={`relative flex w-full flex-col items-center gap-0.5 rounded-xl py-2.5 min-h-[56px] transition active:scale-95 ${
                  active ? "text-indigo-400" : "text-slate-500"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {id === "friends" && requestCount > 0 && (
                  <span className="absolute top-1 right-1/4 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                    {requestCount}
                  </span>
                )}
                <Icon
                  className={`w-6 h-6 ${active ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" : ""}`}
                />
                <span className="text-[11px] font-medium">{label}</span>
                {active && (
                  <span className="absolute bottom-1 h-0.5 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
