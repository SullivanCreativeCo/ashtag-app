import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentSectionProps {
  smokeLogId: string;
  onCommentCountChange?: (count: number) => void;
  onAuthRequired?: () => void;
}

export function CommentSection({ smokeLogId, onCommentCountChange, onAuthRequired }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      fetchComments();
    }
  }, [smokeLogId, expanded]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("id, comment, created_at, user_id")
        .eq("smoke_log_id", smokeLogId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all comments
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", comment.user_id)
            .maybeSingle();

          return {
            ...comment,
            profile,
          };
        })
      );

      setComments(commentsWithProfiles);
      onCommentCountChange?.(commentsWithProfiles.length);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        smoke_log_id: smokeLogId,
        user_id: user.id,
        comment: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      await fetchComments();
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputFocus = () => {
    if (!user) {
      onAuthRequired?.();
    }
  };

  return (
    <div className="border-t border-border/30">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Hide comments
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            View comments
          </>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Comment input */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user ? undefined : undefined} />
              <AvatarFallback className="bg-primary/20 text-xs">
                {user ? "U" : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder={user ? "Add a comment..." : "Sign in to comment"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={handleInputFocus}
                disabled={!user}
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting || !user}
                className="shrink-0 h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Comments list */}
          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={comment.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-xs">
                      {(comment.profile?.display_name || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {comment.profile?.display_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 mt-0.5 break-words">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
