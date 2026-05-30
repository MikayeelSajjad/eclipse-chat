"use client";

import { FormEvent, useState } from "react";
import { IconSend } from "./icons";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="safe-bottom flex shrink-0 items-end gap-2 border-t border-slate-800 bg-slate-950/95 px-3 py-3 md:px-4 md:py-3 backdrop-blur-md"
    >
      <div className="glow-ring flex min-h-[48px] flex-1 items-center rounded-2xl border border-slate-800 bg-slate-900/80 px-4">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onTyping?.();
          }}
          placeholder="Type a message..."
          disabled={disabled}
          className="w-full bg-transparent py-3 text-[15px] text-slate-100 placeholder:text-slate-500"
          autoComplete="off"
          enterKeyHint="send"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40 disabled:shadow-none shadow-glow active:scale-95"
        aria-label="Send message"
      >
        <IconSend />
      </button>
    </form>
  );
}
