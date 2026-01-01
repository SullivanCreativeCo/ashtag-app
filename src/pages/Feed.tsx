import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { SmokeLogCard } from "@/components/SmokeLogCard";
import { Loader2 } from "lucide-react";

interface SmokeLogWithDetails {
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
}

export default function Feed() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SmokeLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      // Fetch smoke logs with cigar info
      const { data: logsData, error: logsError } = await supabase
        .from("smoke_logs")
        .select(`
          *,
          cigar:cigars(id, brand, line, vitola)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Fetch profiles, likes and comments counts
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

    // Refresh the specific log
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

  return (
    <AppLayout>
      <div className="space-y-4 py-4">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Stick Pics
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-card p-6">
              <svg
                className="h-12 w-12 text-muted-foreground"
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
            <h3 className="text-lg font-semibold text-foreground">No smoke logs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to share your cigar experience!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <SmokeLogCard
                key={log.id}
                log={log}
                onLikeToggle={handleLikeToggle}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
