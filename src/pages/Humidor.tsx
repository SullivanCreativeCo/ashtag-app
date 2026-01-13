import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { LitMatchDisplay } from "@/components/LitMatchRating";
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
  const { user, loading: authLoading } = useAuth();
  const [cigars, setCigars] = useState<HumidorCigar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchHumidor();
  }, [authLoading, user, navigate]);

  const fetchHumidor = async () => {
    if (!user) return;

    try {
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

      const { data: favorites, error: favError } = await supabase
        .from("user_favorites")
        .select("cigar_id")
        .eq("user_id", user.id);

      if (favError) throw favError;

      const favoriteIds = new Set(favorites?.map((f) => f.cigar_id) || []);

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
      <div className="py-5 space-y-5 px-1">
        <h1 className="font-display text-3xl font-semibold text-foreground px-2">
          My Humidor
        </h1>

        {/* Premium pill toggle */}
        <div className="flex justify-start px-2">
          <div className="pill-toggle">
            <div 
              className="pill-toggle-indicator"
              style={{
                left: filter === "all" ? "4px" : "calc(50%)",
                width: "calc(50% - 4px)"
              }}
            />
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "pill-toggle-item",
                filter === "all" && "active"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("favorites")}
              className={cn(
                "pill-toggle-item",
                filter === "favorites" && "active"
              )}
            >
              Favorites
            </button>
          </div>
        </div>

        {/* Cigars list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCigars.length === 0 ? (
          <div className="card-glass flex flex-col items-center justify-center py-16 text-center mx-2">
            <div className="mb-4 rounded-full bg-charcoal-light p-5">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground">
              {filter === "favorites" ? "No favorites yet" : "Your humidor is empty"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground font-body max-w-[260px]">
              {filter === "favorites"
                ? "Tap the heart on any cigar to add it here"
                : "Start logging cigars to build your collection"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-2">
            {filteredCigars.map((cigar, index) => (
              <div
                key={cigar.cigar_id}
                className="card-glass p-4 stagger-item"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-semibold text-foreground leading-tight">
                      {cigar.brand} {cigar.line}
                    </h3>
                    <p className="text-sm text-muted-foreground font-body mt-0.5">
                      {cigar.vitola}
                    </p>
                    <div className="mt-3">
                      <LitMatchDisplay score={cigar.avg_score} size="sm" />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground font-body">
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
                      "rounded-full p-2 transition-all duration-300 like-button",
                      cigar.is_favorite
                        ? "text-primary liked"
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
