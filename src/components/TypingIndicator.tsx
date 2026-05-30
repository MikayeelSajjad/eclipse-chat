interface TypingIndicatorProps {
  name: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-400/90">
      <span className="font-medium">{name}</span>
      <span>is typing</span>
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-typing-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
    </div>
  );
}
