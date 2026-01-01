import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { LitMatchDisplay } from "@/components/LitMatchRating";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface HumidorCigar {
  cigar_id: string;
  brand: string;
  line: string;
  vitola: string;
  avg_score: number;
  logs_count: number;
  last_smoked: string;
  is_favorite: boolean;
}

type FilterType = "all" | "favorites";

export default function Humidor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cigars, setCigars] = useState<HumidorCigar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchHumidor();
  }, [user, navigate]);

  const fetchHumidor = async () => {
    if (!user) return;

    try {
      // Get all smoke logs for this user with cigar info
      const { data: logs, error: logsError } = await supabase
        .from("smoke_logs")
        .select(`
          cigar_id,
          overall_score,
          smoked_at,
          cigars(brand, line, vitola)
        `)
        .eq("user_id", user.id)
        .order("smoked_at", { ascending: false });

      if (logsError) throw logsError;

      // Get user favorites
      const { data: favorites, error: favError } = await supabase
        .from("user_favorites")
        .select("cigar_id")
        .eq("user_id", user.id);

      if (favError) throw favError;

      const favoriteIds = new Set(favorites?.map((f) => f.cigar_id) || []);

      // Group by cigar
      const cigarMap = new Map<string, HumidorCigar>();
      
      (logs || []).forEach((log) => {
        const cigar = log.cigars as { brand: string; line: string; vitola: string };
        if (!cigar) return;

        const existing = cigarMap.get(log.cigar_id);
        if (existing) {
          existing.logs_count += 1;
          existing.avg_score =
            (existing.avg_score * (existing.logs_count - 1) + Number(log.overall_score)) /
            existing.logs_count;
        } else {
          cigarMap.set(log.cigar_id, {
            cigar_id: log.cigar_id,
            brand: cigar.brand,
            line: cigar.line,
            vitola: cigar.vitola,
            avg_score: Number(log.overall_score),
            logs_count: 1,
            last_smoked: log.smoked_at,
            is_favorite: favoriteIds.has(log.cigar_id),
          });
        }
      });

      setCigars(Array.from(cigarMap.values()));
    } catch (error) {
      console.error("Error fetching humidor:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (cigarId: string, currentlyFavorite: boolean) => {
    if (!user) return;

    if (currentlyFavorite) {
      await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("cigar_id", cigarId);
    } else {
      await supabase
        .from("user_favorites")
        .insert({ user_id: user.id, cigar_id: cigarId });
    }

    setCigars((prev) =>
      prev.map((c) =>
        c.cigar_id === cigarId ? { ...c, is_favorite: !currentlyFavorite } : c
      )
    );
  };

  const filteredCigars =
    filter === "favorites" ? cigars.filter((c) => c.is_favorite) : cigars;

  return (
    <AppLayout>
      <div className="py-4 space-y-4">
        <h1 className="font-display text-2xl font-bold text-foreground">
          My Humidor
        </h1>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "favorites"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? "All" : "Favorites"}
            </button>
          ))}
        </div>

        {/* Cigars list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCigars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-card p-6">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {filter === "favorites" ? "No favorites yet" : "Your humidor is empty"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "favorites"
                ? "Tap the heart on any cigar to add it here"
                : "Start logging cigars to build your collection"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCigars.map((cigar) => (
              <div
                key={cigar.cigar_id}
                className="rounded-xl border border-border bg-card p-4 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {cigar.brand} {cigar.line}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {cigar.vitola}
                    </p>
                    <LitMatchDisplay score={cigar.avg_score} size="sm" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {cigar.logs_count} log{cigar.logs_count !== 1 ? "s" : ""} •
                      Last smoked{" "}
                      {formatDistanceToNow(new Date(cigar.last_smoked), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(cigar.cigar_id, cigar.is_favorite)}
                    className={cn(
                      "rounded-full p-2 transition-colors",
                      cigar.is_favorite
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-6 w-6 transition-all",
                        cigar.is_favorite && "fill-primary"
                      )}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate("/rate")}
        className="fab"
        aria-label="Log a new cigar"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>
    </AppLayout>
  );
}
