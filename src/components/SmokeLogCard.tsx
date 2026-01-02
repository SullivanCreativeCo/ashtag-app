import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MoreHorizontal, Flag, Share2, Bookmark } from "lucide-react";
import { LitMatchDisplay } from "./LitMatchRating";
import { CommentSection } from "./CommentSection";
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
import { toast } from "sonner";
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
  const navigate = useNavigate();
  const [isLiking, setIsLiking] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(log.comments_count);

  const handleAuthRequired = () => {
    toast.error("Please sign in to interact", {
      action: {
        label: "Sign In",
        onClick: () => navigate("/auth"),
      },
    });
  };

  const handleLike = async () => {
    if (!user) {
      handleAuthRequired();
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    await onLikeToggle(log.id, log.user_has_liked);
    setIsLiking(false);
  };

  const handleDoubleTap = () => {
    if (!log.user_has_liked && user) {
      handleLike();
    }
  };

  return (
    <div className="card-elevated stagger-item group">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/profile/${log.user_id}`)}
        >
          <div className="relative">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40">
              <AvatarImage src={log.profile.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-sm font-semibold text-primary">
                {(log.profile.display_name || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator effect */}
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground tracking-tight hover:text-primary transition-colors">
              {log.profile.display_name || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/80 interactive">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass rounded-xl border-border/50">
            <DropdownMenuItem className="rounded-lg">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg">
              <Bookmark className="mr-2 h-4 w-4" />
              Save
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-destructive focus:text-destructive">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Photo */}
      {log.photo_url && (
        <div 
          className="relative aspect-[4/5] w-full overflow-hidden bg-muted cursor-pointer"
          onDoubleClick={handleDoubleTap}
        >
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton-shimmer" />
          )}
          <img
            src={log.photo_url}
            alt={`${log.cigar.brand} ${log.cigar.line}`}
            className={cn(
              "h-full w-full object-cover transition-all duration-700",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          {/* Gradient overlays for depth */}
          <div className="photo-overlay" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-card/30 to-transparent pointer-events-none" />
          
          {/* Rating badge on photo */}
          <div className="absolute bottom-4 left-4 glass rounded-xl px-3 py-2">
            <LitMatchDisplay score={Number(log.overall_score)} size="sm" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Cigar info with premium styling */}
        <div>
          <h3 className="font-display text-xl font-bold text-foreground leading-tight tracking-tight">
            {log.cigar.brand}
          </h3>
          <p className="text-base text-primary/90 font-medium">{log.cigar.line}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{log.cigar.vitola}</p>
        </div>

        {/* Rating if no photo */}
        {!log.photo_url && (
          <div className="py-2">
            <LitMatchDisplay score={Number(log.overall_score)} size="md" />
          </div>
        )}

        {/* Notes with expand functionality */}
        {log.notes && (
          <div>
            <p 
              className={cn(
                "text-sm text-foreground/85 leading-relaxed cursor-pointer",
                !showFullNotes && "line-clamp-2"
              )}
              onClick={() => setShowFullNotes(!showFullNotes)}
            >
              {log.notes}
            </p>
            {log.notes.length > 100 && !showFullNotes && (
              <button 
                onClick={() => setShowFullNotes(true)}
                className="text-xs text-muted-foreground hover:text-primary mt-1 transition-colors"
              >
                Read more
              </button>
            )}
          </div>
        )}

        {/* Actions - more engaging */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <div className="flex items-center gap-5">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "like-button flex items-center gap-2 text-sm font-medium",
                log.user_has_liked
                  ? "text-primary liked"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Heart
                className={cn(
                  "h-6 w-6 transition-all",
                  log.user_has_liked && "fill-primary scale-110"
                )}
              />
              <span className="tabular-nums">{log.likes_count}</span>
            </button>

            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageCircle className="h-6 w-6" />
              <span className="tabular-nums">{localCommentsCount}</span>
            </span>

            <button className="text-muted-foreground hover:text-foreground transition-colors interactive">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <button className="text-muted-foreground hover:text-primary transition-colors interactive">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Comment Section */}
      <CommentSection
        smokeLogId={log.id}
        onCommentCountChange={setLocalCommentsCount}
        onAuthRequired={handleAuthRequired}
      />
    </div>
  );
}
