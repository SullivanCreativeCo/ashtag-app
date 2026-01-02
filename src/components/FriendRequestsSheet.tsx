import { Check, X, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFriendships } from "@/hooks/useFriendships";
import { toast } from "sonner";

interface FriendRequestsSheetProps {
  children: React.ReactNode;
}

export function FriendRequestsSheet({ children }: FriendRequestsSheetProps) {
  const { pendingRequests, acceptFriendRequest, declineFriendRequest } = useFriendships();

  const handleAccept = async (id: string) => {
    const { error } = await acceptFriendRequest(id);
    if (error) {
      toast.error("Failed to accept request");
    } else {
      toast.success("Friend request accepted!");
    }
  };

  const handleDecline = async (id: string) => {
    const { error } = await declineFriendRequest(id);
    if (error) {
      toast.error("Failed to decline request");
    } else {
      toast.success("Friend request declined");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Friend Requests
          </SheetTitle>
          <SheetDescription>
            {pendingRequests.length === 0
              ? "No pending friend requests"
              : `You have ${pendingRequests.length} pending request${pendingRequests.length > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto max-h-[calc(70vh-120px)]">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={request.friend?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {(request.friend?.display_name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {request.friend?.display_name || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Wants to be your friend
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                  onClick={() => handleDecline(request.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => handleAccept(request.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
