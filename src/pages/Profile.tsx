import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { SmokeLogCard } from "@/components/SmokeLogCard";
import { FriendButton } from "@/components/FriendButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Flame, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SmokeLogWithDetails } from "@/types/smoke-log";

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [logs, setLogs] = useState<SmokeLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSmokes: 0, avgScore: 0 });

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchLogs();
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  };

  const fetchLogs = async () => {
    try {
      const { data: logsData, error } = await supabase
        .from("smoke_logs")
        .select(`*, cigar:cigars(id, brand, line, vitola)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Calculate stats
      const totalSmokes = logsData?.length || 0;
      const avgScore = totalSmokes > 0
        ? logsData!.reduce((acc, log) => acc + Number(log.overall_score || 0), 0) / totalSmokes
        : 0;

      setStats({ totalSmokes, avgScore });

      // Fetch additional data for each log
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
      await supabase.from("likes").delete().eq("smoke_log_id", logId).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ smoke_log_id: logId, user_id: user.id });
    }

    setLogs((prev) =>
      prev.map((log) =>
        log.id === logId
          ? {
              ...log,
              user_has_liked: !currentlyLiked,
              likes_count: currentlyLiked ? log.likes_count - 1 : log.likes_count + 1,
            }
          : log
      )
    );
  };

  const handleAuthRequired = () => {
    toast.error("Please sign in", {
      action: { label: "Sign In", onClick: () => navigate("/auth") },
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 px-4 py-3 header-blur flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">Profile</h1>
        </div>

        {/* Profile Header */}
        <div className="px-4 py-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-2xl font-bold text-primary">
                {(profile.display_name || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {profile.display_name || "Anonymous"}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>

              <div className="mt-3">
                <FriendButton
                  userId={profile.id}
                  onAuthRequired={handleAuthRequired}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6 px-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.totalSmokes}</p>
              <p className="text-xs text-muted-foreground">Cigars</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                {stats.avgScore.toFixed(1)}
                <Flame className="h-4 w-4 text-primary" />
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="smokes" className="px-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="smokes">Smoke Logs</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="smokes" className="mt-4 space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No smoke logs yet
              </div>
            ) : (
              logs.map((log) => (
                <SmokeLogCard key={log.id} log={log} onLikeToggle={handleLikeToggle} />
              ))
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              Favorites coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
