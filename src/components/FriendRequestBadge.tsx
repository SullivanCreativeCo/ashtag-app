import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface FriendRequestBadgeProps {
  count: number;
  onClick?: () => void;
}

export function FriendRequestBadge({ count, onClick }: FriendRequestBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
      )}
    >
      <Users className="h-4 w-4" />
      <span className="text-sm font-medium">{count} pending</span>
      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-pulse">
        {count}
      </span>
    </button>
  );
}
