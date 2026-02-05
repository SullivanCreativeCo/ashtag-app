import { useState } from "react";
import { UserPlus, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFriendships } from "@/hooks/useFriendships";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FriendButtonProps {
  userId: string;
  size?: "sm" | "default";
  onAuthRequired?: () => void;
}

export function FriendButton({ userId, size = "default", onAuthRequired }: FriendButtonProps) {
  const { user } = useAuth();
  const { getFriendshipStatus, sendFriendRequest, removeFriend, friends, sentRequests } = useFriendships();
  const [loading, setLoading] = useState(false);

  // Don't show button for own profile
  if (user?.id === userId) return null;

  const status = getFriendshipStatus(userId);

  const handleClick = async () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    setLoading(true);
    try {
      if (status === "none") {
        const { error } = await sendFriendRequest(userId);
        if (error) throw error;
        toast.success("Friend request sent!");
      } else if (status === "friends") {
        const friendship = friends.find(f => f.friend?.id === userId);
        if (friendship) {
          const { error } = await removeFriend(friendship.id);
          if (error) throw error;
          toast.success("Friend removed");
        }
      } else if (status === "pending_sent") {
        const request = sentRequests.find(f => f.friend?.id === userId);
        if (request) {
          const { error } = await removeFriend(request.id);
          if (error) throw error;
          toast.success("Request cancelled");
        }
      }
    } catch (error) {
      console.error("Friend action error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case "friends":
        return (
          <>
            <UserCheck className={cn("h-4 w-4", size === "sm" && "h-3 w-3")} />
            <span>Friends</span>
          </>
        );
      case "pending_sent":
        return (
          <>
            <Clock className={cn("h-4 w-4", size === "sm" && "h-3 w-3")} />
            <span>Pending</span>
          </>
        );
      case "pending_received":
        return (
          <>
            <UserPlus className={cn("h-4 w-4", size === "sm" && "h-3 w-3")} />
            <span>Respond</span>
          </>
        );
      default:
        return (
          <>
            <UserPlus className={cn("h-4 w-4", size === "sm" && "h-3 w-3")} />
            <span>Add Friend</span>
          </>
        );
    }
  };

  return (
    <Button
      variant={status === "friends" ? "secondary" : status === "pending_sent" ? "outline" : "default"}
      size={size}
      onClick={handleClick}
      disabled={loading || status === "pending_received"}
      className={cn(
        "gap-1.5",
        size === "sm" && "h-7 text-xs px-2"
      )}
    >
      {getButtonContent()}
    </Button>
  );
}
