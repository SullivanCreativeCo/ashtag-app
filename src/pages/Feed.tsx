import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendships } from "@/hooks/useFriendships";
import { useFavorites } from "@/hooks/useFavorites";
import { AppLayout } from "@/components/AppLayout";
import { SmokeLogCard } from "@/components/SmokeLogCard";
import { StickPickOfWeek } from "@/components/StickPickOfWeek";
import { NewCigarAdditions } from "@/components/NewCigarAdditions";
import { CameraCapture } from "@/components/CameraCapture";
import { FriendRequestBadge } from "@/components/FriendRequestBadge";
import { FriendRequestsSheet } from "@/components/FriendRequestsSheet";
import { BetaBanner } from "@/components/BetaBanner";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SmokeLogWithDetails } from "@/types/smoke-log";

type FeedFilter = "all" | "friends";

export default function Feed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { pendingRequests, getFriendIds } = useFriendships();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [logs, setLogs] = useState<SmokeLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");

  const handleSaveToggle = async (cigarId: string) => {
    const log = logs.find(l => l.cigar.id === cigarId);
    const cigarName = log ? `${log.cigar.brand} ${log.cigar.line}` : undefined;
    await toggleFavorite(cigarId, cigarName);
  };

  useEffect(() => {
    fetchLogs();
    // Re-run when navigating back to /feed (e.g. after saving a rating)
  }, [user, location.key]);

  const handleCameraCapture = (imageData: string) => {
    navigate("/match-cigar", { state: { capturedImage: imageData } });
  };

  const fetchLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("smoke_logs")
        .select(`
          *,
          cigar:cigars(id, brand, line, vitola)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      const logsWithCounts = await Promise.all(
        (logsData || []).map(async (log) => {
          const [profileResult, likesResult, commentsResult, userLikeResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .eq("id", log.user_id)
              .maybeSingle(),
            supabase
              .from("likes")
              .select("id", { count: "exact", head: true })
              .eq("smoke_log_id", log.id),
            supabase
              .from("comments")
              .select("id", { count: "exact", head: true })
              .eq("smoke_log_id", log.id),
            user
              ? supabase
                  .from("likes")
                  .select("id")
                  .eq("smoke_log_id", log.id)
                  .eq("user_id", user.id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...log,
            cigar: log.cigar as SmokeLogWithDetails["cigar"],
            profile: profileResult.data || { id: log.user_id, display_name: null, avatar_url: null },
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            user_has_liked: !!userLikeResult.data,
          };
        })
      );

      setLogs(logsWithCounts);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async (logId: string, currentlyLiked: boolean) => {
    if (!user) return;

    if (currentlyLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("smoke_log_id", logId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("likes")
        .insert({ smoke_log_id: logId, user_id: user.id });
    }

    setLogs((prev) =>
      prev.map((log) =>
        log.id === logId
          ? {
              ...log,
              user_has_liked: !currentlyLiked,
              likes_count: currentlyLiked
                ? log.likes_count - 1
                : log.likes_count + 1,
            }
          : log
      )
    );
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 
                    user?.user_metadata?.name?.split(' ')[0] || 
                    'Friend';

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Header section */}
        <div className="sticky top-0 z-40 -mx-1 px-5 py-5 header-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                Welcome back
              </p>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                Hello, {firstName}
              </h1>
            </div>
            {pendingRequests.length > 0 && (
              <FriendRequestsSheet>
                <FriendRequestBadge count={pendingRequests.length} />
              </FriendRequestsSheet>
            )}
          </div>

          {/* Premium pill toggle */}
          {user && (
            <div className="mt-5 flex justify-center">
              <div className="pill-toggle">
                <div 
                  className="pill-toggle-indicator"
                  style={{
                    left: feedFilter === "all" ? "4px" : "calc(50%)",
                    width: "calc(50% - 4px)"
                  }}
                />
                <button
                  onClick={() => setFeedFilter("all")}
                  className={cn(
                    "pill-toggle-item",
                    feedFilter === "all" && "active"
                  )}
                >
                  Everyone
                </button>
                <button
                  onClick={() => setFeedFilter("friends")}
                  className={cn(
                    "pill-toggle-item",
                    feedFilter === "friends" && "active"
                  )}
                >
                  Friends
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Beta Banner */}
        <BetaBanner />

        {/* Stick Pick of the Week - only on Everyone tab */}
        {feedFilter === "all" && <StickPickOfWeek />}

        {/* New Cigar Additions - only on Everyone tab */}
        {feedFilter === "all" && <NewCigarAdditions />}

        <div className="px-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="absolute inset-0 h-8 w-8 animate-ping opacity-15 rounded-full bg-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-body">Loading the latest smokes...</p>
            </div>
          ) : (() => {
            const friendIds = getFriendIds();
            const filteredLogs = feedFilter === "friends" 
              ? logs.filter(log => friendIds.includes(log.user_id))
              : logs;

            if (filteredLogs.length === 0) {
              return (
                <div className="card-glass flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="mb-5 rounded-2xl bg-charcoal-light p-5">
                    <svg
                      className="h-10 w-10 text-primary animate-pulse-subtle"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground">
                    {feedFilter === "friends" ? "No friend posts yet" : "No smoke logs yet"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground font-body max-w-[260px]">
                    {feedFilter === "friends" 
                      ? "Add some friends to see their smoke logs here"
                      : "Be the first to share your cigar experience with the community"}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <SmokeLogCard
                    key={log.id}
                    log={log}
                    onLikeToggle={handleLikeToggle}
                    isSaved={isFavorite(log.cigar.id)}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setCameraOpen(true)}
        className="fab animate-float"
        aria-label="Add smoke log"
      >
        <Plus className="h-6 w-6 text-primary-foreground drop-shadow-sm" />
      </button>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </AppLayout>
  );
}
