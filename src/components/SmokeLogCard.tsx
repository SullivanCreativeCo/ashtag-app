import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MoreHorizontal, Flag } from "lucide-react";
import { LitMatchDisplay } from "./LitMatchRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SmokeLogCardProps {
  log: {
    id: string;
    smoked_at: string;
    notes: string;
    photo_url: string | null;
    overall_score: number;
    construction: number;
    flavor: number;
    strength: number;
    burn: number;
    created_at: string;
    user_id: string;
    cigar: {
      id: string;
      brand: string;
      line: string;
      vitola: string;
    };
    profile: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    likes_count: number;
    comments_count: number;
    user_has_liked: boolean;
  };
  onLikeToggle: (logId: string, currentlyLiked: boolean) => void;
}

export function SmokeLogCard({ log, onLikeToggle }: SmokeLogCardProps) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    await onLikeToggle(log.id, log.user_has_liked);
    setIsLiking(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={log.profile.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-sm">
              {(log.profile.display_name || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">
              {log.profile.display_name || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Photo */}
      {log.photo_url && (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img
            src={log.photo_url}
            alt={`${log.cigar.brand} ${log.cigar.line}`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Cigar info */}
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {log.cigar.brand} {log.cigar.line}
          </h3>
          <p className="text-sm text-muted-foreground">{log.cigar.vitola}</p>
        </div>

        {/* Rating */}
        <LitMatchDisplay score={Number(log.overall_score)} size="md" />

        {/* Notes */}
        <p className="text-sm text-foreground/90 line-clamp-3">{log.notes}</p>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleLike}
            disabled={!user || isLiking}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              log.user_has_liked
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-all",
                log.user_has_liked && "fill-primary"
              )}
            />
            <span>{log.likes_count}</span>
          </button>

          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span>{log.comments_count}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
