import { formatTime } from "@/lib/utils";

interface MessageBubbleProps {
  content: string;
  createdAt: number;
  isOwn: boolean;
}

export function MessageBubble({ content, createdAt, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3 md:px-4`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "rounded-br-md bg-indigo-600 text-white shadow-glow"
            : "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-100"
        }`}
      >
        <p className="text-[15px] leading-relaxed break-words">{content}</p>
        <p
          className={`mt-1 text-[10px] ${
            isOwn ? "text-indigo-200/70 text-right" : "text-slate-500"
          }`}
        >
          {formatTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
