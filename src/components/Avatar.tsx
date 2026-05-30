import Image from "next/image";
import { avatarColorForUsername, getInitials } from "@/lib/utils";

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

const px = { sm: 36, md: 44, lg: 64 };

export function Avatar({
  username,
  avatarUrl,
  size = "md",
  className = "",
}: AvatarProps) {
  const color = avatarColorForUsername(username);

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={username}
        width={px[size]}
        height={px[size]}
        className={`shrink-0 rounded-full object-cover ring-2 ring-slate-800 ${sizes[size]} ${className}`}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-slate-800 ${sizes[size]} ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {getInitials(username)}
    </div>
  );
}
